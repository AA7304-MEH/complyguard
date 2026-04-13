/**
 * Framework Checklists
 */
export const FRAMEWORKS: Record<string, string> = {
    GDPR: `
        1. Lawful basis (Art. 6) – must state one of: consent, contract, legal obligation, vital interests, public task, legitimate interests.
        2. Data subject rights (Art. 12-22) – must describe how users can access, rectify, delete their data.
        3. Data Protection Officer contact (Art. 37) – if applicable, must have contact or justification why none.
        4. Retention period (Art. 5(1)(e)) – must specify a time limit, not "forever".
        5. International transfers (Art. 44-49) – if data is transferred outside EU, must mention safeguards like SCCs.
        6. Breach notification to authority (Art. 33) – must state 72‑hour notification to supervisory authority.
        7. Data processing agreements (Art. 28) – must require contracts with third‑party processors.
        8. Security measures (Art. 32) – must describe technical/organizational measures.
    `,
    HIPAA: `
        1. Privacy Rule: Notice of Privacy Practices, minimum necessary, patient rights.
        2. Security Rule: Risk analysis, workforce training, facility access, workstation security, access controls, audit logs, transmission security.
        3. Breach Notification Rule: Timely notification to HHS and individuals.
        4. Business Associate Agreements (BAAs).
        5. Documentation retention (6 years).
    `,
    SOC2: `
        1. CC2.1: Communication of objectives.
        2. CC3.1: Risk assessment.
        3. CC5.1: Control activities.
        4. CC6.1: Logical access controls.
        5. CC6.6: Physical security.
        6. CC6.8: Encryption.
        7. CC8.1: Change management.
    `,
    ISO27001: `
        1. A.5.1.1: Information security policy.
        2. A.5.15.1: Access control policy.
        3. A.5.17.1: Authentication.
        4. A.5.34.1: Privacy & PII protection.
        5. A.8.5.1: Secure coding.
    `
};

/**
 * Perform AI analysis using secure serverless backend
 */
export async function analyzeWithGemini(documentText: string, framework: string) {
    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ documentText, framework })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Backend analysis failed');
        }

        return await response.json();
    } catch (error) {
        console.error("[Gemini Proxy] Request Failed:", error);
        throw error;
    }
}
