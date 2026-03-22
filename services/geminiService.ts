import { GoogleGenAI } from "@google/genai";
import { FindingSeverity, AuditFinding, FrameworkRule, FindingSeverity as FS } from '../types';

// Use Vite's environment variable access with fallback
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' && process.env.GEMINI_API_KEY);

if (!API_KEY) {
    console.warn("⚠️ Gemini API key not found. AI analysis will be mocked.");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;
const MODEL_NAME = "gemini-1.5-flash";

const analysisPromptTemplate = (requirement_text: string, document_chunk: string) => `
Analyze the compliance of a document snippet against a specific regulatory requirement.

**Role**: Senior Compliance Auditor

**Task**: Determine if the provided document snippet meets the specified regulatory requirement.

**Regulatory Requirement**:
\`\`\`
${requirement_text}
\`\`\`

**Document Snippet to Analyze**:
\`\`\`
${document_chunk}
\`\`\`

**Instructions**:
1.  **Analyze**: Carefully compare the "Document Snippet" to the "Regulatory Requirement".
2.  **No Gap**: If the requirement is fully and clearly addressed by the snippet, your entire response must be only the exact text: \`NO_GAP\`
3.  **Gap Found**: If the requirement is not addressed, is only partially addressed, or is ambiguous, you must identify a compliance gap.
4.  **JSON Output**: If you find a gap, your entire response MUST be a single, valid JSON object following the schema.

The JSON object must have:
- "severity": "high", "medium", or "low"
- "remediation_advice": "A concrete recommendation"
`;

export type MultimodalContent = string | { data: string; mimeType: string };

export const analyzeCompliance = async (
    rule: FrameworkRule,
    content: MultimodalContent,
    paragraphNumber: number,
    scanId: string,
): Promise<AuditFinding | null> => {
    if (!ai) {
        return null; // Fallback handled by caller
    }

    try {
        const documentChunk = typeof content === 'string' ? content : "[PDF Document Content]";
        const prompt = analysisPromptTemplate(rule.requirement_text, documentChunk);
        
        const contentParts: any[] = [{ text: prompt }];
        if (typeof content === 'string') {
            contentParts.push({ text: content });
        } else {
            contentParts.push({
                inlineData: {
                    data: content.data,
                    mimeType: content.mimeType
                }
            });
        }

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: [{ parts: contentParts }],
            config: {
                responseMimeType: "application/json",
            }
        });

        const textResponse = (response.text || "").trim();

        if (textResponse.toUpperCase() === 'NO_GAP') {
            return null;
        }

        const findingJson = JSON.parse(textResponse);

        return {
            id: `finding-${crypto.randomUUID()}`,
            audit_scan_id: scanId,
            framework_rule: rule,
            severity: findingJson.severity as FS,
            excerpt_from_document: documentChunk.slice(0, 200) + '...',
            remediation_advice: findingJson.remediation_advice,
            paragraph_number: paragraphNumber,
        };
    } catch (error) {
        console.error("Error analyzing compliance with Gemini:", error);
        return null;
    }
};