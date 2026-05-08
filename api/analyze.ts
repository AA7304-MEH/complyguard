import type { VercelRequest, VercelResponse } from '@vercel/node';

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
        const { documentText, framework } = req.body;
        if (!documentText) return res.status(400).json({ error: 'Missing documentText' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(apiKey);

        const checklist = FRAMEWORKS[framework] || FRAMEWORKS.GDPR;
        const prompt = `
            Analyze this document against ${framework}.
            Checklist: ${checklist}
            Content: """${documentText}"""
            Return JSON with 'findings'.
        `;

        const MODELS_TO_TRY = ["gemini-2.0-flash", "gemini-2.5-pro", "gemini-1.5-flash", "gemini-pro"];
        let result;
        let lastErr;

        for (const modelName of MODELS_TO_TRY) {
            try {
                const currentModel = genAI.getGenerativeModel({ 
                    model: modelName,
                    generationConfig: {
                        temperature: 0,
                        responseMimeType: "application/json"
                    }
                });
                const genRes = await currentModel.generateContent([{ text: prompt }]);
                result = await genRes.response;
                if (result) break;
            } catch (e: any) {
                lastErr = e;
            }
        }

        if (!result) throw lastErr || new Error("All AI models failed");
        return res.status(200).json(JSON.parse(result.text()));

    } catch (error: any) {
        console.error('❌ API Error:', error);
        return res.status(500).json({ 
            error: 'AI Analysis Failed', 
            message: error.message || 'Unknown error'
        });
    }
}






