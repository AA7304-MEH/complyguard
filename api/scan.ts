import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// Vercel Serverless Function for AI Scanning
export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { framework, contents, rules, model } = req.body;
    const HARDCODED_KEY = "AIzaSyD9ZK0a92__91N5RgXCCk1tEWDNAU4tZZ8"; // From user screenshot
    const API_KEY = HARDCODED_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    if (!API_KEY) {
        console.error('❌ Server-side GEMINI_API_KEY is missing');
        return res.status(500).json({ error: 'Missing Gemini API Key on server' });
    }

    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const modelInstance = genAI.getGenerativeModel({ 
            model: model || "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        findings: {
                            type: SchemaType.ARRAY,
                            items: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    id: { type: SchemaType.STRING },
                                    rule_id: { type: SchemaType.STRING },
                                    severity: { type: SchemaType.STRING, enum: ["Critical", "High", "Medium", "Low"] },
                                    title: { type: SchemaType.STRING },
                                    description: { type: SchemaType.STRING },
                                    suggestion: { type: SchemaType.STRING },
                                    clause: { type: SchemaType.STRING },
                                    status: { type: SchemaType.STRING, enum: ["Fail", "Pass", "Warning"] }
                                },
                                required: ["id", "rule_id", "severity", "title", "description", "suggestion", "status"]
                            }
                        }
                    }
                }
            }
        });

        const prompt = `Analyze this document for ${framework} compliance based on these rules: ${JSON.stringify(rules)}.`;
        
        // Handle multimodal content (text or PDF data)
        const parts = contents.map((c: any) => {
            if (typeof c === 'string') return { text: c };
            return { inlineData: { data: c.data, mimeType: c.mimeType } };
        });

        const result = await modelInstance.generateContent([prompt, ...parts]);
        const response = await result.response;
        const text = response.text();
        
        return res.status(200).json(JSON.parse(text));
    } catch (error: any) {
        console.error('❌ AI Analysis Error:', error);
        return res.status(500).json({ error: error.message || 'AI Analysis failed' });
    }
}
