import { GoogleGenerativeAI, SchemaType, Schema } from '@google/generative-ai';
import { FRAMEWORKS } from './frameworks';
import { callGeminiWithRotation } from './geminiKeyRotator.js';

export { FRAMEWORKS };

const MODELS = [
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro-latest", 
  "gemini-pro"
];


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

export async function callGeminiWithFallback(parts: any[]) {
  
  
  const response = await callGeminiWithRotation(parts, {
    temperature: 0,
    responseMimeType: "application/json",
    responseSchema: RESPONSE_SCHEMA
  });

  const text = await response.text();
  return JSON.parse(text);
}

export async function analyzeWithGemini(documentText: string, framework: string) {
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
    `;

    return await callGeminiWithFallback([{ text: prompt }]);
}


