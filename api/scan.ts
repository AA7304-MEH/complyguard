import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Content-Type', 'application/json');
    
    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method Not Allowed' });
        }

        const { framework, pastedText, userId, email, base64File, fileName } = req.body;
        if (!userId) return res.status(401).json({ error: 'Unauthorized: Missing User ID' });

        // Dynamic imports to catch loading errors
        const { GoogleGenerativeAI, SchemaType } = await import('@google/generative-ai');
        const { createClient } = await import('@supabase/supabase-js');
        const { FRAMEWORKS } = await import('../lib/frameworks');

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
        const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
        const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

        const MODELS = ["gemini-1.5-flash-latest", "gemini-1.5-pro-latest", "gemini-pro"];

        const RESPONSE_SCHEMA: any = {
            type: SchemaType.OBJECT,
            properties: {
                findings: {
                    type: SchemaType.ARRAY,
                    items: {
                        type: SchemaType.OBJECT,
                        properties: {
                            requirement: { type: SchemaType.STRING },
                            description: { type: SchemaType.STRING },
                            severity: { type: SchemaType.STRING },
                            remediation: { type: SchemaType.STRING }
                        },
                        required: ["requirement", "description", "severity", "remediation"]
                    }
                }
            }
        };

        const checklist = FRAMEWORKS[framework] || FRAMEWORKS.GDPR;
        const prompt = `
            You are a highly pedantic, expert compliance auditor and legal professional. 
            Analyze the provided content against the strict requirements of the ${framework} framework.
            Checklist: ${checklist}
            Output the result in JSON format only with 'findings' array.
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

        const genAI = new GoogleGenerativeAI(apiKey);
        let result = null;
        let lastError = null;

        for (const modelName of MODELS) {
            try {
                console.log(`[Gemini] Trying model: ${modelName}`);
                const model = genAI.getGenerativeModel({ 
                    model: modelName,
                    generationConfig: {
                        temperature: 0,
                        responseMimeType: "application/json",
                        responseSchema: modelName.includes('1.5') ? RESPONSE_SCHEMA : undefined
                    }
                });
                
                const genResult = await model.generateContent(parts);
                const response = await genResult.response;
                result = JSON.parse(await response.text());
                break;
            } catch (err: any) {
                console.warn(`[Gemini] ${modelName} failed:`, err.message);
                lastError = err;
            }
        }

        if (!result) throw lastError || new Error("All AI models failed");

        const findings = result.findings || [];
        const deductions: Record<string, number> = { Critical: 25, High: 15, Medium: 7, Low: 2 };
        const totalDeduction = findings.reduce((acc: number, f: any) => acc + (deductions[f.severity] || 5), 0);
        const score = Math.max(0, 100 - totalDeduction);

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
                console.error('[DB Error]:', dbErr.message);
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
            error: 'Internal Server Error', 
            message: error.message || 'Unknown error',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}


