import { FRAMEWORKS } from './frameworks';


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
