import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Inlined FRAMEWORKS to avoid any relative import issues in serverless
const FRAMEWORKS: Record<string, string> = {
    GDPR: "Lawful basis, Data subject rights, DPO contact, Retention period, International transfers, Breach notification, Security measures.",
    HIPAA: "Privacy Rule, Security Rule, Breach Notification, BAAs, Documentation retention.",
    SOC2: "Communication of objectives, Risk assessment, Control activities, Logical access, Physical security, Encryption, Change management.",
    ISO27001: "Information security policy, Access control, Authentication, Privacy & PII protection, Secure coding."
};

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const { framework, pastedText, userId, email, base64File, fileName } = req.body;
        if (!userId) return res.status(401).json({ error: 'Unauthorized: Missing User ID' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

        const genAI = new GoogleGenerativeAI(apiKey);
        // Using Gemini 2.0 Flash as verified in list_models
        let model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const checklist = FRAMEWORKS[framework] || FRAMEWORKS.GDPR;
        const prompt = `
            You are a compliance auditor. Analyze the document against ${framework}.
            Checklist: ${checklist}
            Return JSON with a 'findings' array. Each finding must have 'requirement', 'description', 'severity', and 'remediation'.
        `;

        const parts: any[] = [{ text: prompt }];
        if (pastedText) parts.push({ text: `Document Text: """${pastedText}"""` });
        
        if (base64File && fileName) {
            const ext = fileName.split('.').pop()?.toLowerCase();
            let mimeType = 'application/pdf';
            if (ext === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            if (ext === 'doc') mimeType = 'application/msword';
            if (ext === 'txt') mimeType = 'text/plain';
            if (['png', 'jpg', 'jpeg'].includes(ext || '')) mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
            parts.push({ inlineData: { data: base64File, mimeType } });
        }

        const MODELS_TO_TRY = ["gemini-2.0-flash", "gemini-2.5-pro", "gemini-1.5-flash", "gemini-pro"];
        let result;
        let lastErr;

        for (const modelName of MODELS_TO_TRY) {
            try {
                console.log(`[API] Trying model: ${modelName}`);
                const currentModel = genAI.getGenerativeModel({ model: modelName });
                result = await currentModel.generateContent(parts);
                if (result) break;
            } catch (e: any) {
                console.warn(`[API] Model ${modelName} failed:`, e.message);
                lastErr = e;
            }
        }

        if (!result) throw lastErr || new Error("All AI models failed");


        const response = await result.response;
        const jsonResult = JSON.parse(response.text());
        const findings = jsonResult.findings || [];

        const deductions: Record<string, number> = { Critical: 25, High: 15, Medium: 7, Low: 2 };
        const score = Math.max(0, 100 - findings.reduce((acc: number, f: any) => acc + (deductions[f.severity] || 5), 0));

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
            } catch (dbErr: any) {
                console.error('[DB Error] Non-fatal:', dbErr.message);
            }
        }

        return res.status(200).json({
            id: 'scan-' + Date.now().toString(36),
            user_id: userId,
            framework,
            status: 'completed',
            result: findings,
            score,
            created_at: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('❌ API Error:', error);
        return res.status(500).json({ 
            error: 'AI Analysis Failed', 
            message: error.message || 'Unknown AI error',
            details: error.toString(),
            stack: error.stack
        });
    }
}




