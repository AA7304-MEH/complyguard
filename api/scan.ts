import type { VercelRequest, VercelResponse } from '@vercel/node';

// Inlined FRAMEWORKS
const FRAMEWORKS: Record<string, string> = {
    GDPR: "Lawful basis, Data subject rights, DPO contact, Retention period, International transfers, Breach notification, Security measures.",
    HIPAA: "Privacy Rule, Security Rule, Breach Notification, BAAs, Documentation retention.",
    SOC2: "Communication of objectives, Risk assessment, Control activities, Logical access, Physical security, Encryption, Change management.",
    ISO27001: "Information security policy, Access control, Authentication, Privacy & PII protection, Secure coding."
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const { framework, pastedText, userId, email, base64File, fileName } = req.body;
        if (!userId) return res.status(401).json({ error: 'Unauthorized: Missing User ID' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

        // Lazy load heavy dependencies
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const { createClient } = await import('@supabase/supabase-js');

        const genAI = new GoogleGenerativeAI(apiKey);
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

        const MODELS_TO_TRY = [
            "models/gemini-1.5-flash", 
            "models/gemini-2.0-flash", 
            "models/gemini-pro",
            "models/gemini-2.5-pro"
        ];
        let result;
        let errors: string[] = [];

        for (const modelName of MODELS_TO_TRY) {
            try {
                const currentModel = genAI.getGenerativeModel({ 
                    model: modelName,
                    generationConfig: {
                        temperature: 0.1,
                        responseMimeType: "application/json"
                    }
                });
                const genRes = await currentModel.generateContent(parts);
                const response = await genRes.response;
                if (response) {
                    result = response;
                    break;
                }
            } catch (e: any) {
                errors.push(`${modelName}: ${e.message}`);
            }
        }

        if (!result) {
            return res.status(500).json({
                error: 'AI Analysis Failed',
                message: 'All available AI models returned errors or quota limits.',
                details: errors.join(' | ')
            });
        }

        const jsonResult = JSON.parse(result.text());
        const findings = jsonResult.findings || [];

        const deductions: Record<string, number> = { Critical: 25, High: 15, Medium: 7, Low: 2 };
        const score = Math.max(0, 100 - findings.reduce((acc: number, f: any) => acc + (deductions[f.severity] || 5), 0));

        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
        const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
        if (supabaseUrl && supabaseKey) {
            try {
                const supabase = createClient(supabaseUrl, supabaseKey);
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
            details: error.toString()
        });
    }
}




