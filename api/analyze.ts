import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Content-Type', 'application/json');
    
    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method Not Allowed' });
        }

        const { documentText, framework } = req.body;
        if (!documentText) return res.status(400).json({ error: 'Missing documentText' });

        // Dynamic imports
        const { GoogleGenerativeAI, SchemaType } = await import('@google/generative-ai');
        const { FRAMEWORKS } = await import('../lib/frameworks');

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

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
            Analyze this document against ${framework}.
            Checklist: ${checklist}
            Content: """${documentText}"""
            Return JSON with 'findings'.
        `;

        const genAI = new GoogleGenerativeAI(apiKey);
        let result = null;
        let lastError = null;

        for (const modelName of MODELS) {
            try {
                const model = genAI.getGenerativeModel({ 
                    model: modelName,
                    generationConfig: {
                        temperature: 0,
                        responseMimeType: "application/json",
                        responseSchema: modelName.includes('1.5') ? RESPONSE_SCHEMA : undefined
                    }
                });
                
                const genResult = await model.generateContent([{ text: prompt }]);
                const response = await genResult.response;
                result = JSON.parse(await response.text());
                break;
            } catch (err: any) {
                lastError = err;
            }
        }

        if (!result) throw lastError || new Error("All AI models failed");
        return res.status(200).json(result);

    } catch (error: any) {
        console.error('❌ API Error:', error);
        return res.status(500).json({ 
            error: 'Internal Server Error', 
            message: error.message || 'Unknown error'
        });
    }
}



