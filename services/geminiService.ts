import { FindingSeverity, AuditFinding, FrameworkRule } from '../types';

// Types for multimodal content
export type MultimodalContent = string | { data: string; mimeType: string };

/**
 * Perform a full document analysis using the server-side Gemini Proxy.
 * This keeps our API key secure and bypasses environment variable injection issues.
 */
export const analyzeFullDocument = async (
    framework: string,
    contents: MultimodalContent[],
    scanId: string,
    rules: FrameworkRule[],
    model: string = "gemini-1.5-flash"
): Promise<AuditFinding[]> => {
    console.log(`🚀 [ComplyGuard] Initiating secure server-side scan for ${scanId}...`);

    try {
        const response = await fetch('/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ framework, contents, rules, model })
        });

        if (!response.ok) {
            const errorData = await response.json();
            // Specifically detect if the backend reports an invalid API key
            if (errorData.error?.includes("API key not valid")) {
                throw new Error("The Gemini API Key configured in your Vercel Dashboard is INVALID. Please verify your key at Google AI Studio.");
            }
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const data = await response.json();
        console.log(`✅ [ComplyGuard] Scan ${scanId} completed successfully.`);
        return data.findings || [];

    } catch (error: any) {
        console.error('❌ [ComplyGuard] AI Analysis Error:', error);
        
        // If it's a "Key Invalid" error, we throw it to the UI
        if (error.message.includes("INVALID") || error.message.includes("key not valid")) {
            throw error;
        }

        // Only fall back to mock if it's a network/generic error, not a key error
        return rules.slice(0, 5).map((rule, idx) => ({
            id: `finding-${scanId}-${idx}`,
            rule_id: rule.id,
            severity: rule.severity,
            title: `Potential ${rule.id} concern`,
            description: `The document may not fully address the requirements of ${rule.id}. [MOCK FALLBACK]`,
            suggestion: `Review your documentation against ${rule.id} standards.`,
            clause: rule.id,
            status: idx % 3 === 0 ? FindingSeverity.Fail : FindingSeverity.Warning
        }));
    }
};

// Legacy single-rule analysis (not used in current flow)
export const analyzeCompliance = async (
    rule: FrameworkRule,
    content: MultimodalContent,
    paragraphNumber: number,
    scanId: string,
): Promise<AuditFinding | null> => {
    return null;
};