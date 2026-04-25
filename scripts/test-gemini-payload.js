import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";

let API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    try {
        const envConfig = fs.readFileSync(".env.local", "utf8");
        const match = envConfig.match(/GEMINI_API_KEY=(.+)/);
        if (match) API_KEY = match[1].trim();
    } catch (e) {}
}

if (!API_KEY) {
    console.error("No API key found.");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

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

const AUDIT_TOOL = {
    functionDeclarations: [
        {
            name: "report_compliance_gaps",
            description: "Report gap findings identified during a policy document audit.",
            parameters: {
                type: "object",
                properties: {
                    findings: {
                        type: "array",
                        description: "List of identified compliance gaps.",
                        items: {
                            type: "object",
                            properties: {
                                requirement: { type: "string", description: "The specific framework requirement or Article." },
                                description: { type: "string", description: "Description of why the document is insufficient." },
                                severity: { type: "string", enum: ["Critical", "Major", "Minor"], description: "Risk level of the gap." },
                                remediation: { type: "string", description: "Actionable advice to fix the gap." }
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

const checklist = `
1. Lawful basis (Art. 6) – must state one of: consent, contract, legal obligation, vital interests, public task, legitimate interests.
2. Data subject rights (Art. 12-22) – must describe how users can access, rectify, delete their data.
3. Data Protection Officer contact (Art. 37) – if applicable, must have contact or justification why none.
4. Retention period (Art. 5(1)(e)) – must specify a time limit, not "forever".
5. International transfers (Art. 44-49) – if data is transferred outside EU, must mention safeguards like SCCs.
6. Breach notification to authority (Art. 33) – must state 72‑hour notification to supervisory authority.
7. Data processing agreements (Art. 28) – must require contracts with third‑party processors.
8. Security measures (Art. 32) – must describe technical/organizational measures.
`;

const manualText = `
AlphaTech Inc. Privacy Policy

We collect user email addresses, IP addresses, and browsing history to improve our services and share with marketing partners. We will keep this data indefinitely on our database. If you have any questions, you can reach out to our customer support team. We do our best to keep data secure.
`;

const userPrompt = `
Framework: GDPR

Check the document against these requirements. For each requirement, state whether it is met. If not met, output a finding with severity and remediation. If the document does not contain a required element, that is a gap.

Requirements:
${checklist}

Analyze the document for gaps against the framework and checklist. Return your report by calling the 'report_compliance_gaps' tool.
`;

async function test() {
    const model = ai.getGenerativeModel({ 
        model: "gemini-1.5-pro",
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [AUDIT_TOOL],
        toolConfig: { functionCallingConfig: { mode: "ANY" } }
    });

    console.log("Sending prompt to Gemini...");
    
    try {
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [
                { text: userPrompt },
                { text: manualText }
            ]}],
            generationConfig: {
                temperature: 0.0,
            }
        });

        const response = result.response;
        console.log("Raw Response parts:", JSON.stringify(response.candidates?.[0]?.content?.parts, null, 2));

        const call = response.candidates?.[0]?.content?.parts?.[0]?.functionCall;
        
        if (call) {
            console.log("Function Call name:", call.name);
            console.log("Function Call args:", JSON.stringify(call.args, null, 2));
        } else {
            console.log("No function call returned!");
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
