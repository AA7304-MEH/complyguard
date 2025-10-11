

import { GoogleGenAI, Type } from "@google/genai";
import { FindingSeverity, AuditFinding, FrameworkRule } from '../types';

// The API key is expected to be set as an environment variable.
// The app will not function correctly without it.
if (!process.env.GEMINI_API_KEY) {
    throw new Error("Gemini API key not found. Please set the GEMINI_API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const model = "gemini-2.5-flash";

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
4.  **JSON Output**: If you find a gap, your entire response MUST be a single, valid JSON object. Do not include any text, explanation, or markdown formatting outside of the JSON object itself.

The JSON object must conform to the schema provided in the API request.
`;


export const analyzeCompliance = async (
    rule: FrameworkRule,
    documentChunk: string,
    paragraphNumber: number,
    scanId: string,
): Promise<AuditFinding | null> => {
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: analysisPromptTemplate(rule.requirement_text, documentChunk),
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        severity: {
                            type: Type.STRING,
                            enum: ["high", "medium", "low"],
                            description: "The severity of the compliance gap."
                        },
                        remediation_advice: {
                            type: Type.STRING,
                            description: "A concrete, actionable recommendation for how to modify the document to comply with the requirement."
                        }
                    },
                    required: ["severity", "remediation_advice"]
                }
            }
        });

        const textResponse = response.text.trim();
        if (textResponse.toUpperCase() === 'NO_GAP') {
            return null;
        }

        const findingJson = JSON.parse(textResponse);

        return {
            id: `finding-${crypto.randomUUID()}`,
            audit_scan_id: scanId,
            framework_rule: rule,
            severity: findingJson.severity as FindingSeverity,
            excerpt_from_document: documentChunk.slice(0, 200) + '...',
            remediation_advice: findingJson.remediation_advice,
            paragraph_number: paragraphNumber,
        };
    } catch (error) {
        console.error("Error analyzing compliance with Gemini:", error);
        // Do not create a finding if the API fails, just log the error.
        return null;
    }
};