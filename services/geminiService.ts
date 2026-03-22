import { GoogleGenAI } from "@google/genai";
import { FindingSeverity, AuditFinding, FrameworkRule } from '../types';

// Use Vite's environment variable access with fallback
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' && process.env.GEMINI_API_KEY);

if (!API_KEY) {
    console.warn("⚠️ Gemini API key not found. AI analysis will be mocked.");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;
const MODEL_NAME = "gemini-1.5-flash";

const SYSTEM_PROMPT = `
You are a senior compliance auditor specializing in GDPR, HIPAA, SOC 2, and ISO 27001. 
Your task is to analyze a company policy document and identify gaps against the selected framework.

Rules:
- Be critical and thorough. If a requirement is missing, unclear, or partially addressed, flag it.
- For each gap, provide:
  1. The specific requirement (e.g., GDPR Article 5, SOC 2 CC6.1)
  2. A clear description of what is missing or insufficient
  3. Severity: Critical (major risk of non-compliance), Major (important but not critical), Minor (improvement)
  4. Actionable remediation advice (what to add or change)
- If the document meets all requirements, output a JSON object with "findings": [] 
- Output only a valid JSON object. Do not include any other text, markdown, or explanation.

JSON structure:
{
  "framework": "string",
  "total_findings": number,
  "findings": [
    {
      "requirement": "string",
      "description": "string",
      "severity": "Critical | Major | Minor",
      "remediation": "string"
    }
  ]
}
`;

export type MultimodalContent = string | { data: string; mimeType: string };

interface AIFinding {
    requirement: string;
    description: string;
    severity: "Critical" | "Major" | "Minor";
    remediation: string;
}

interface AIResponse {
    framework: string;
    total_findings: number;
    findings: AIFinding[];
}

export const analyzeFullDocument = async (
    frameworkName: string,
    content: MultimodalContent,
    scanId: string,
    frameworkRules: FrameworkRule[] = []
): Promise<AuditFinding[]> => {
    if (!ai) {
        return [];
    }

    try {
        const userPrompt = `Framework: ${frameworkName}\n\nDocument:\n${typeof content === 'string' ? content : "[Multimodal Document Content]"}\n\nAnalyze the document for compliance gaps against the framework. Return a JSON object following the specified format.`;
        
        const contentParts: any[] = [{ text: SYSTEM_PROMPT + "\n\n" + userPrompt }];
        
        if (typeof content !== 'string') {
            contentParts.push({
                inlineData: {
                    data: content.data,
                    mimeType: content.mimeType
                }
            });
        }

        const result = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: [{ parts: contentParts }],
            config: {
                responseMimeType: "application/json",
                temperature: 0.0,
            }
        });

        const textResponse = (result.text || "").trim();
        if (!textResponse) return [];

        const aiResponse = JSON.parse(textResponse) as AIResponse;
        
        return aiResponse.findings.map((finding, index) => {
            // Map AI severity to internal FindingSeverity
            let severity = FindingSeverity.Low;
            if (finding.severity === "Critical") severity = FindingSeverity.High;
            else if (finding.severity === "Major") severity = FindingSeverity.Medium;

            // Attempt to find a matching rule, or create a virtual one
            const matchingRule = frameworkRules.find(r => 
                finding.requirement.toLowerCase().includes(r.article.toLowerCase()) ||
                r.requirement_text.toLowerCase().includes(finding.requirement.toLowerCase())
            );

            const rule: FrameworkRule = matchingRule || {
                id: `virtual-${index}`,
                framework_id: 'unknown',
                article: finding.requirement,
                title: finding.requirement,
                requirement_text: finding.description
            };

            return {
                id: `finding-${crypto.randomUUID()}`,
                audit_scan_id: scanId,
                framework_rule: rule,
                severity,
                excerpt_from_document: "[Scan excerpt]", // AI description serves as context
                remediation_advice: finding.remediation,
                paragraph_number: index + 1,
            };
        });
    } catch (error) {
        console.error("Error analyzing full document with Gemini:", error);
        return [];
    }
};

/**
 * @deprecated Use analyzeFullDocument for better accuracy and performance.
 */
export const analyzeCompliance = async (
    rule: FrameworkRule,
    content: MultimodalContent,
    paragraphNumber: number,
    scanId: string,
): Promise<AuditFinding | null> => {
    // Left for backward compatibility if needed, but redirects to an empty result as it's no longer the main path
    return null;
};