import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { FRAMEWORKS } from '../lib/frameworks';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { documentText, framework } = req.body;
        if (!documentText) return res.status(400).json({ error: 'Missing documentText' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash-latest",
            generationConfig: {
                temperature: 0,
                responseMimeType: "application/json"
            }
        });

        const checklist = FRAMEWORKS[framework] || FRAMEWORKS.GDPR;
        const prompt = `
            Analyze this document against ${framework}.
            Checklist: ${checklist}
            Content: """${documentText}"""
            Return JSON with 'findings'.
        `;

        const result = await model.generateContent([{ text: prompt }]);
        const response = await result.response;
        const json = JSON.parse(response.text());
        
        return res.status(200).json(json);

    } catch (error: any) {
        console.error('❌ API Error:', error);
        return res.status(500).json({ 
            error: 'AI Analysis Failed', 
            message: error.message || 'Unknown error'
        });
    }
}




