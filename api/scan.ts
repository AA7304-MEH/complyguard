import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// --- Inline Supabase client for serverless (no import.meta) ---
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// --- Inline Gemini analysis for serverless ---
const FRAMEWORKS: Record<string, string> = {
    GDPR: `
        1. Lawful basis (Art. 6) – must state one of: consent, contract, legal obligation, vital interests, public task, legitimate interests.
        2. Data subject rights (Art. 12-22) – must describe how users can access, rectify, delete their data.
        3. Data Protection Officer contact (Art. 37) – if applicable, must have contact or justification why none.
        4. Retention period (Art. 5(1)(e)) – must specify a time limit, not "forever".
        5. International transfers (Art. 44-49) – if data is transferred outside EU, must mention safeguards like SCCs.
        6. Breach notification to authority (Art. 33) – must state 72-hour notification to supervisory authority.
        7. Data processing agreements (Art. 28) – must require contracts with third-party processors.
        8. Security measures (Art. 32) – must describe technical/organizational measures.
    `,
    HIPAA: `
        1. Privacy Rule: Notice of Privacy Practices, minimum necessary, patient rights.
        2. Security Rule: Risk analysis, workforce training, facility access, workstation security, access controls, audit logs, transmission security.
        3. Breach Notification Rule: Timely notification to HHS and individuals.
        4. Business Associate Agreements (BAAs).
        5. Documentation retention (6 years).
    `,
    SOC2: `
        1. CC2.1: Communication of objectives.
        2. CC3.1: Risk assessment.
        3. CC5.1: Control activities.
        4. CC6.1: Logical access controls.
        5. CC6.6: Physical security.
        6. CC6.8: Encryption.
        7. CC8.1: Change management.
    `,
    ISO27001: `
        1. A.5.1.1: Information security policy.
        2. A.5.15.1: Access control policy.
        3. A.5.17.1: Authentication.
        4. A.5.34.1: Privacy & PII protection.
        5. A.8.5.1: Secure coding.
    `
};

async function analyzeMultimodal(framework: string, pastedText?: string, base64File?: string, fileName?: string) {
    const API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!API_KEY) throw new Error("Missing Gemini API Key in environment.");

    const genAI = new GoogleGenerativeAI(API_KEY);
    const checklist = FRAMEWORKS[framework] || FRAMEWORKS.GDPR;
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
            temperature: 0,
            responseMimeType: "application/json",
            responseSchema: {
                type: SchemaType.OBJECT,
                properties: {
                    findings: {
                        type: SchemaType.ARRAY,
                        items: {
                            type: SchemaType.OBJECT,
                            properties: {
                                requirement: { type: SchemaType.STRING },
                                description: { type: SchemaType.STRING },
                                severity: { type: SchemaType.STRING, format: "enum", enum: ["Critical", "High", "Medium", "Low"] },
                                remediation: { type: SchemaType.STRING }
                            },
                            required: ["requirement", "description", "severity", "remediation"]
                        }
                    }
                }
            }
        }
    });

    const prompt = `
        You are a highly pedantic, expert compliance auditor and legal professional. 
        Analyze the provided content against the strict requirements of the ${framework} framework.
        
        Requirements Checklist:
        ${checklist}

        Strict Auditing Rules:
        1. Only report items that are MISSING, INCOMPLETE, NON-COMPLIANT, or VAGUE regarding the requirement.
        2. If the document is an image or scan with no text layer, use your native OCR to read it.
        3. Output the result in JSON format only.
        
        Output Formatting Guidelines:
        - "requirement": Quote the specific Framework Article/Criterion being violated.
        - "description": Provide a professional, objective statement of what is missing or wrong.
        - "severity": Assign "Critical" for missing legal bases/breach notifications, "High" for missing security controls, "Medium" for vague clauses, and "Low" for minor administrative gaps.
        - "remediation": Provide highly actionable steps to fix the document.
    `;

    const parts: any[] = [{ text: prompt }];

    if (pastedText) {
        parts.push({ text: `Document Text: """${pastedText}"""` });
    }

    if (base64File && fileName) {
        const ext = fileName.split('.').pop()?.toLowerCase();
        let mimeType = 'application/pdf';
        if (ext === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        if (ext === 'doc') mimeType = 'application/msword';
        if (ext === 'txt') mimeType = 'text/plain';
        if (['png', 'jpg', 'jpeg'].includes(ext || '')) mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

        parts.push({
            inlineData: {
                data: base64File,
                mimeType
            }
        });
    }

    // Retry loop for rate limits
    const MAX_RETRIES = 3;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const result = await model.generateContent(parts);
            const response = await result.response;
            return JSON.parse(response.text());
        } catch (err: any) {
            const is429 = err?.message?.includes('429') || err?.message?.includes('quota');
            if (is429 && attempt < MAX_RETRIES) {
                const waitSec = attempt * 30;
                console.log(`[Gemini] Rate limited. Waiting ${waitSec}s...`);
                await new Promise(resolve => setTimeout(resolve, waitSec * 1000));
            } else {
                throw err;
            }
        }
    }
    throw new Error('Gemini analysis failed after retries.');
}

// --- The Vercel Serverless Handler ---
export default async function handler(req: any, res: any) {
    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method Not Allowed' });
        }

        const { framework, pastedText, userId, email, base64File, fileName } = req.body;

        if (!userId) return res.status(401).json({ error: 'Unauthorized: Missing User ID' });

        // 1. Run Gemini Analysis (Multimodal)
        console.log(`[API] Starting Gemini analysis for ${framework}...`);
        const result = await analyzeMultimodal(framework, pastedText, base64File, fileName);
        console.log(`[API] Gemini returned ${result.findings?.length || 0} findings`);

        // 3. Calculate compliance score based on findings
        const findings = result.findings || [];
        const maxScore = 100;
        const deductions: Record<string, number> = { 
            Critical: 25, 
            High: 15, 
            Medium: 7, 
            Low: 2 
        };
        const totalDeduction = findings.reduce((acc: number, f: any) => {
            const severity = f.severity || 'Medium';
            return acc + (deductions[severity] || 5);
        }, 0);
        const score = Math.max(0, maxScore - totalDeduction);

        // 4. Build the scan ID
        const scanId = 'scan-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

        // 5. Save to DB (best-effort, don't crash if DB is down)
        if (supabase) {
            try {
                await supabase.from('scan_jobs').insert([{
                    user_id: userId,
                    framework,
                    status: 'completed',
                    result: findings,
                    score,
                    file_url: fileName || null,
                    user_email: email || null
                }]);
                await supabase.rpc('increment_usage', { x_id: userId });
            } catch (dbErr: any) {
                console.error('[API] DB save failed (non-fatal):', dbErr.message);
            }
        }

        // 6. Return a full AuditScan object the frontend can display immediately
        return res.status(200).json({
            id: scanId,
            user_id: userId,
            framework,
            status: 'completed',
            result: findings,
            score,
            file_url: fileName || null,
            created_at: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('❌ /api/scan fatal error:', error);
        return res.status(500).json({ error: error.message || 'Analysis failed. Please try again.' });
    }
}
