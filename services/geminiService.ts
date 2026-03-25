import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { FindingSeverity, AuditFinding, FrameworkRule } from '../types';

// Use Vite's environment variable access with fallback
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' && process.env.GEMINI_API_KEY);

if (!API_KEY) {
    console.warn("⚠️ Gemini API key not found. AI analysis will be mocked.");
}

const ai = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;
// Upgraded to Pro for better reasoning as requested
const MODEL_NAME = "gemini-1.5-pro";

const SYSTEM_INSTRUCTION = `
You are a senior, highly critical compliance auditor. 
You never assume compliance. You examine every line of the document and compare it against the framework's requirements. 
If any requirement is missing, incomplete, or unclear, you MUST report it as a gap.

Rules:
- Be pedantic and thorough.
- Do not assume context not explicitly in the text.
- If a document is minimal or vague (e.g., "We keep data forever"), it is a CRITICAL violation of retention requirements.
- Use the provided checklists precisely.
`;

const FRAMEWORK_CHECKLISTS: Record<string, string> = {
    "GDPR": `
1. Lawful basis (Art. 6) – must state one of: consent, contract, legal obligation, vital interests, public task, legitimate interests.
2. Data subject rights (Art. 12-22) – must describe how users can access, rectify, delete their data.
3. Data Protection Officer contact (Art. 37) – if applicable, must have contact or justification why none.
4. Retention period (Art. 5(1)(e)) – must specify a time limit, not "forever".
5. International transfers (Art. 44-49) – if data is transferred outside EU, must mention safeguards like SCCs.
6. Breach notification to authority (Art. 33) – must state 72‑hour notification to supervisory authority.
7. Data processing agreements (Art. 28) – must require contracts with third‑party processors.
8. Security measures (Art. 32) – must describe technical/organizational measures.
`,
    "HIPAA": `
- Privacy Rule: Notice of Privacy Practices, minimum necessary, patient rights
- Security Rule: risk analysis, workforce training, facility access, workstation security, access controls, audit logs, transmission security
- Breach Notification Rule: timely notification to HHS and individuals
- Business Associate Agreements
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

const AUDIT_TOOL: any = {
    functionDeclarations: [
        {
            name: "report_compliance_gaps",
            description: "Report gap findings identified during a policy document audit.",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    findings: {
                        type: SchemaType.ARRAY,
                        description: "List of identified compliance gaps.",
                        items: {
                            type: SchemaType.OBJECT,
                            properties: {
                                requirement: { type: SchemaType.STRING, description: "The specific framework requirement or Article." },
                                description: { type: SchemaType.STRING, description: "Description of why the document is insufficient." },
                                severity: { type: SchemaType.STRING, enum: ["Critical", "Major", "Minor"], description: "Risk level of the gap." },
                                remediation: { type: SchemaType.STRING, description: "Actionable advice to fix the gap." }
                            },
                            required: ["requirement", "description", "severity", "remediation"]
                        }
                    }
                },
                required: ["findings"]
            }
        }
    ]
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
        throw new Error("Missing Gemini API Key. The application cannot perform AI analysis because the VITE_GEMINI_API_KEY environment variable is missing.");
    }

    try {
        const checklist = FRAMEWORK_CHECKLISTS[frameworkName] || "Evaluate against standard compliance best practices.";
        
        // Log the types of content being sent
        const contentArray = Array.isArray(content) ? content : [content];
        console.debug(`AI Auditor: Analyzing ${contentArray.length} document parts against ${frameworkName}.`);

        const userPrompt = `
Framework: ${frameworkName}

Check the document against these requirements. For each requirement, state whether it is met. If not met, output a finding with severity and remediation. If the document does not contain a required element, that is a gap.

Requirements:
${checklist}

Analyze the document for gaps against the framework and checklist. Return your report by calling the 'report_compliance_gaps' tool.
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

        console.log("AI Auditor: Sending prompt to Gemini...", JSON.stringify(contentParts, null, 2));

        const model = ai.getGenerativeModel({ 
            model: modelName,
            systemInstruction: SYSTEM_INSTRUCTION,
            tools: [AUDIT_TOOL],
            toolConfig: { functionCallingConfig: { mode: "ANY" } as any }
        });

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: contentParts }],
            generationConfig: {
                temperature: 0.0,
            }
        });

        const response = result.response;
        console.log("AI Auditor: Raw Response received:", JSON.stringify(response, null, 2));
        
        const call = response.candidates?.[0]?.content?.parts?.[0]?.functionCall;
        
        if (!call || call.name !== 'report_compliance_gaps') {
            console.warn("AI Auditor: No function call detected in response.", response.text());
            throw new Error(`AI generated an unstructured response instead of the required JSON. Please try again. Raw output: ${response.text().substring(0, 50)}...`);
        }

        const args = call.args as { findings: AIFinding[] };
        const findings = args.findings || [];
        console.log(`AI Auditor: Detected ${findings.length} findings.`);
        
        return findings.map((finding, index) => {
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
    } catch (error: any) {
        console.error("❌ AI Auditor: Gemini analysis failed!", {
            message: error.message,
            stack: error.stack,
            framework: frameworkName,
            model: modelName
        });
        
        // Propagate specific errors back to the caller
        if (error.message?.includes("API_KEY_INVALID")) {
            throw new Error("Invalid Gemini API Key. Please check your environment variables.");
        }
        if (error.message?.includes("quota")) {
            throw new Error("Gemini API quota exceeded. Please try again later.");
        }
        
        throw error; // Rethrow to be caught by apiClient
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