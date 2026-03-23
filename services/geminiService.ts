import { GoogleGenAI } from "@google/genai";
import { FindingSeverity, AuditFinding, FrameworkRule } from '../types';

// Use Vite's environment variable access with fallback
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' && process.env.GEMINI_API_KEY);

if (!API_KEY) {
    console.warn("⚠️ Gemini API key not found. AI analysis will be mocked.");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;
// Upgraded to Pro for better reasoning as requested
const MODEL_NAME = "gemini-1.5-pro";

const SYSTEM_INSTRUCTION = `
You are a senior compliance auditor specializing in GDPR, HIPAA, SOC 2, and ISO 27001. 
Your task is to analyze a company policy document and identify gaps against the selected framework checklist.

Rules:
- Be critical, thorough, and pedantic. If a requirement is missing, unclear, or partially addressed, you MUST flag it.
- Do not assume context that is not explicitly in the document.
- For each gap identified, provide:
  1. The specific Article or Requirement (e.g., GDPR Art. 5(1)(e), SOC 2 CC6.1)
  2. A clear description of what is missing or insufficient
  3. Severity: Critical (high risk/legal violation), Major (important gap), Minor (best practice improvement)
  4. Actionable remediation advice (what specific text to add or change)
- If the document meets all checklist items, output a JSON object with "findings": []
- Output only a valid JSON object. No other text.

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

const FRAMEWORK_CHECKLISTS: Record<string, string> = {
    "GDPR": `
- Lawful basis for processing (Art. 6)
- Data subject rights (access, rectification, erasure) (Art. 15-17)
- Data Protection Officer contact (if applicable) (Art. 37)
- Retention period defined (Art. 5(1)(e)) - MUST NOT be "indefinite"
- International transfer safeguards (Art. 44-49)
- Breach notification to supervisory authority within 72h (Art. 33)
- Data processing agreements with third parties (Art. 28)
- Technical and organizational security measures (Art. 32)
`,
    "HIPAA": `
- Notice of Privacy Practices (NPP) contents
- Individual rights to access/amend PHI
- Administrative Safeguards (Risk Analysis, Workforce training)
- Physical Safeguards (Facility access, Workstation security)
- Technical Safeguards (Access control, Encryption, Audit controls)
- Business Associate Agreements (BAAs)
- Breach Notification Rule compliance
`,
    "SOC 2": `
- Common Criteria (Security, Availability, Processing Integrity, Confidentiality, Privacy)
- Logical and physical access controls (CC6.x)
- System operations and monitoring (CC7.x)
- Change management (CC8.x)
- Risk mitigation (CC9.x)
`,
    "ISO 27001": `
- Information security policy (A.5)
- Organization of information security (A.6)
- Human resource security (A.7)
- Asset management (A.8)
- Access control (A.9)
- Cryptography (A.10)
- Physical and environmental security (A.11)
`
};

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
    content: MultimodalContent | MultimodalContent[],
    scanId: string,
    frameworkRules: FrameworkRule[] = []
): Promise<AuditFinding[]> => {
    if (!ai) {
        return [];
    }

    try {
        const checklist = FRAMEWORK_CHECKLISTS[frameworkName] || "Evaluate against standard compliance best practices.";
        
        // Log the types of content being sent
        const contentArray = Array.isArray(content) ? content : [content];
        console.debug(`AI Auditor: Analyzing ${contentArray.length} document parts against ${frameworkName}.`);

        const userPrompt = `
Framework: ${frameworkName}

Check the document for compliance against the following specific requirements:
${checklist}

Analyze the document for gaps. Return the JSON report.
`;
        
        const contentParts: any[] = [{ text: userPrompt }];
        
        // Add all content items as separate parts
        for (const item of contentArray) {
            if (typeof item === 'string') {
                contentParts.push({ text: item });
            } else {
                contentParts.push({
                    inlineData: {
                        data: item.data,
                        mimeType: item.mimeType
                    }
                });
            }
        }

        const result = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: [{ parts: contentParts }],
            config: {
                systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
                responseMimeType: "application/json",
                temperature: 0.0,
            }
        });

        const textResponse = (result.text || "").trim();
        if (!textResponse) {
            console.warn("AI Auditor: Received empty response from Gemini.");
            return [];
        }

        const aiResponse = JSON.parse(textResponse) as AIResponse;
        console.debug(`AI Auditor: Found ${aiResponse.total_findings} gaps.`);
        
        return aiResponse.findings.map((finding, index) => {
            let severity = FindingSeverity.Low;
            if (finding.severity === "Critical") severity = FindingSeverity.High;
            else if (finding.severity === "Major") severity = FindingSeverity.Medium;

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
                excerpt_from_document: "[Compliance Gap Detected]",
                remediation_advice: finding.remediation,
                paragraph_number: index + 1,
            };
        });
    } catch (error) {
        console.error("Error analyzing full document with Gemini:", error);
        return [];
    }
};

export const analyzeCompliance = async (
    rule: FrameworkRule,
    content: MultimodalContent,
    paragraphNumber: number,
    scanId: string,
): Promise<AuditFinding | null> => {
    return null;
};