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

async function analyzeText(documentText: string, framework: string) {
    const API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!API_KEY) throw new Error("Missing Gemini API Key in environment.");

    const genAI = new GoogleGenerativeAI(API_KEY);
    const checklist = FRAMEWORKS[framework] || FRAMEWORKS.GDPR;

    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
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
        Analyze the following document against the strict requirements of the ${framework} framework.
        
        Requirements Checklist:
        ${checklist}

        Document Content:
        """${documentText.substring(0, 30000)}"""

        Strict Auditing Rules:
        1. Only report items that are MISSING, INCOMPLETE, NON-COMPLIANT, or VAGUE regarding the requirement.
        2. If a section is vague or uses non-committal language (e.g., "we try to protect data"), record it as a finding.
        3. If the document is clearly not a policy or contract, generate findings stating that the text completely fails to address the framework.
        4. If you find absolute perfection and NO issues, return an empty 'findings' array (this should be exceedingly rare).
        
        Output Formatting Guidelines:
        - "requirement": Quote the specific Framework Article/Criterion being violated.
        - "description": Provide a professional, objective statement of what is missing or wrong in the text.
        - "severity": Assign "Critical" for missing legal bases/breach notifications, "High" for missing security controls, "Medium" for vague clauses, and "Low" for minor administrative gaps.
        - "remediation": Provide highly actionable steps the user must take to fix the document.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
}

// --- The Vercel Serverless Handler ---
export default async function handler(req: any, res: any) {
    // Always return JSON, even on crash
    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method Not Allowed' });
        }

        const { framework, pastedText, userId, email, base64File, fileName } = req.body;

        if (!userId) return res.status(401).json({ error: 'Unauthorized: Missing User ID' });
        if (!supabase) {
            console.error('[API] Supabase not configured. VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing.');
            // Continue without DB - still do the analysis
        }

        // 1. Extract text
        let textToAnalyze = pastedText;

        if (!textToAnalyze && base64File && fileName) {
            console.log(`[API] Processing base64 file: ${fileName}`);
            const buffer = Buffer.from(base64File, 'base64');
            const extension = fileName.split('.').pop()?.toLowerCase();

            if (extension === 'pdf') {
                const pdfParse = (await import('pdf-parse')).default;
                const data = await pdfParse(buffer);
                textToAnalyze = data.text;
            } else if (extension === 'docx') {
                const mammoth = await import('mammoth');
                const result = await mammoth.extractRawText({ buffer });
                textToAnalyze = result.value;
            } else {
                textToAnalyze = buffer.toString('utf-8');
            }
        }

        if (!textToAnalyze || textToAnalyze.trim().length === 0) {
            return res.status(400).json({ error: 'No content provided for analysis. Upload a file or paste text.' });
        }

        // 2. Run Gemini Analysis
        console.log(`[API] Starting Gemini analysis for ${framework}, text length: ${textToAnalyze.length}`);
        const result = await analyzeText(textToAnalyze, framework);
        console.log(`[API] Gemini returned ${result.findings?.length || 0} findings`);

        // 3. Save to DB (best-effort, don't crash if DB is down)
        if (supabase) {
            try {
                await supabase.from('scan_jobs').insert([{
                    user_id: userId,
                    framework,
                    status: 'completed',
                    result: result.findings,
                    file_url: fileName || null,
                    user_email: email || null
                }]);
                await supabase.rpc('increment_usage', { x_id: userId });
            } catch (dbErr: any) {
                console.error('[API] DB save failed (non-fatal):', dbErr.message);
            }
        }

        // 4. Return the analysis result
        return res.status(200).json(result);

    } catch (error: any) {
        console.error('❌ /api/scan fatal error:', error);
        return res.status(500).json({ error: error.message || 'Analysis failed. Please try again.' });
    }
}
