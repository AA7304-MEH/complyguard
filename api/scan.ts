import { createClient } from '@supabase/supabase-js';
import { callGeminiWithFallback, FRAMEWORKS } from '../lib/gemini-service';

// --- Inline Supabase client for serverless (no import.meta) ---
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;


async function analyzeMultimodal(framework: string, pastedText?: string, base64File?: string, fileName?: string) {
    const checklist = FRAMEWORKS[framework] || FRAMEWORKS.GDPR;
    
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

    return await callGeminiWithFallback(parts);
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
