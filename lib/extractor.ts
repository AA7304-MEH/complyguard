import mammoth from 'mammoth';
// @ts-ignore
import pdf from 'pdf-parse/lib/pdf-parse.js';

/**
 * Extract text from various file types (PDF, DOCX, TXT)
 */
export async function extractTextFromUrl(fileUrl: string): Promise<string> {
    console.log(`[Extractor] Fetching file from: ${fileUrl}`);
    
    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error(`Failed to fetch file: ${response.statusText}`);
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Determine file type by extension or content type
    const extension = fileUrl.split('.').pop()?.toLowerCase();
    
    try {
        let extractedText = "";

        if (extension === 'pdf') {
            const data = await pdf(buffer);
            extractedText = data.text;
        } else if (extension === 'docx') {
            const result = await mammoth.extractRawText({ buffer });
            extractedText = result.value;
        } else {
            // Default to TXT
            extractedText = buffer.toString('utf-8');
        }

        // Clean up excessive whitespace and limit size to prevent context overflow
        // Gemini 1.5 Pro has a large context window, but this prevents passing megabytes of purely empty spaces
        const cleanedText = extractedText.replace(/\s+/g, ' ').trim();
        
        if (cleanedText.length === 0) {
            throw new Error("Extracted document is empty.");
        }

        return cleanedText;
    } catch (error) {
        console.error("[Extractor] Failed to extract text:", error);
        throw new Error("Could not extract text. Please ensure the file is a valid PDF, DOCX, or TXT document.");
    }
}
