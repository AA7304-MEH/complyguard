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
- Data subject rights (Art. 12-22: access, rectification, erasure, portability, etc.)
- Data Protection Officer contact (if applicable) (Art. 37)
- Data retention period (Art. 5(1)(e)) - MUST NOT be "indefinite"
- International transfers (Art. 44-49)
- Breach notification to authority (Art. 33) within 72h
- Data processing agreements (Art. 28)
- Security measures (Art. 32)
`,
    "HIPAA": `
- Privacy Rule: Notice of Privacy Practices, minimum necessary, patient rights
- Security Rule: risk analysis, workforce training, facility access, workstation security, access controls, audit logs, transmission security
- Breach Notification Rule: timely notification to HHS and individuals
- Business Associate Agreements (BAAs)
- Documentation retention (6 years)
`,
    "SOC 2": `
- CC2.1: Communication of objectives
- CC3.1: Risk assessment
- CC5.1: Control activities
- CC6.1: Logical access controls
- CC6.6: Physical security
- CC6.8: Encryption
- CC7.1: Incident management
- CC7.2: Monitoring
- CC8.1: Change management
- C1.1: Confidential information protection
`,
    "ISO 27001": `
- A.5.1.1: Information security policy
- A.5.2.1: Roles and responsibilities
- A.5.9.1: Asset inventory
- A.5.12.1: Information classification
- A.5.14.1: Information transfer
- A.5.15.1: Access control policy
- A.5.16.1: Identity management
- A.5.17.1: Authentication
- A.5.18.1: Access rights
- A.5.23.1: Cloud service use
- A.5.24.1: Incident management planning
- A.5.25.1: Incident assessment
- A.5.26.1: Incident response
- A.5.27.1: Learning from incidents
- A.5.29.1: Disruption management
- A.5.31.1: Legal requirements
- A.5.32.1: IP rights
- A.5.33.1: Record protection
- A.5.34.1: Privacy & PII
- A.5.35.1: Independent review
- A.5.36.1: Policy compliance
- A.8.1.1: User endpoint devices
- A.8.2.1: Privileged access
- A.8.3.1: Awareness & training
- A.8.4.1: Vulnerability management
- A.8.5.1: Secure coding
- A.8.6.1: Configuration management
- A.8.7.1: Change management
- A.8.8.1: Vulnerability management
- A.8.9.1: Business continuity
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
    frameworkRules: FrameworkRule[] = [],
    modelName: string = MODEL_NAME
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

Checklist:
${checklist}

Document:
[Document Content follows in subsequent parts]

Analyze the document for gaps against the framework and checklist. Return the JSON report.
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
            model: modelName,
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