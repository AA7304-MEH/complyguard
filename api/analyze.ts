import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI, SchemaType, Schema } from '@google/generative-ai';
import { FRAMEWORKS } from '../lib/frameworks';

const MODELS = ["gemini-1.5-flash-latest", "gemini-1.5-pro-latest", "gemini-pro"];

const RESPONSE_SCHEMA: Schema = {
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

async function callGeminiWithFallback(parts: any[]) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const genAI = new GoogleGenerativeAI(apiKey);

  for (const modelName of MODELS) {
    try {
      console.log(`[Gemini] Attempting with model: ${modelName}`);
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
          responseSchema: modelName.includes('1.5') ? RESPONSE_SCHEMA : undefined
        }
      });
      
      const result = await model.generateContent(parts);
      const response = await result.response;
      const text = await response.text();
      return JSON.parse(text);
    } catch (error: any) {
      console.warn(`[Gemini] Model ${modelName} failed:`, error.message);
      if (MODELS.indexOf(modelName) === MODELS.length - 1) throw error;
      continue;
    }
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Content-Type', 'application/json');
    
    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method Not Allowed' });
        }

        const { documentText, framework } = req.body;

        if (!documentText) {
            return res.status(400).json({ error: 'Missing documentText' });
        }

        if (documentText.length > 50000) {
            return res.status(400).json({ error: 'Document text exceeds 50,000 character limit' });
        }

        const checklist = FRAMEWORKS[framework] || FRAMEWORKS.GDPR;
        
        const prompt = `
            You are a highly pedantic, expert compliance auditor and legal professional. 
            Analyze the following document against the strict requirements of the ${framework} framework.
            
            Requirements Checklist:
            ${checklist}

            Document Content:
            """${documentText}"""

            Strict Auditing Rules:
            1. Only report items that are MISSING, INCOMPLETE, NON-COMPLIANT, or VAGUE regarding the requirement.
            2. If a section is vague or uses non-committal language (e.g., "we try to protect data"), record it as a finding.
            3. If the document is clearly not a policy or contract (e.g., random text or gibberish), generate findings stating that the text completely fails to address the framework.
            4. If you find absolute perfection and NO issues, return an empty 'findings' array.
            
            Output Formatting Guidelines:
            - "requirement": Quote the specific Framework Article/Criterion being violated.
            - "description": Provide a professional, objective statement of what is missing or wrong in the text.
            - "severity": Assign "Critical" for missing legal bases, "High" for missing security controls, "Medium" for vague clauses, and "Low" for minor gaps.
            - "remediation": Provide highly actionable steps to fix the document as a direct instruction.
        `;

        const json = await callGeminiWithFallback([{ text: prompt }]);
        return res.status(200).json(json);

    } catch (error: any) {
        console.error('❌ Analysis fatal error:', error);
        return res.status(500).json({ 
            error: 'Analysis failed', 
            message: error.message || 'Unknown error',
            details: error.toString()
        });
    }
}


