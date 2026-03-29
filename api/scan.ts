import { analyzeWithGemini } from '../lib/gemini';
import { rateLimiter } from '../lib/rateLimiter';
import { supabase } from '../lib/supabase';
import { extractTextFromUrl } from '../lib/extractor';

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { framework, pastedText, userId, email, base64File, fileName } = req.body;
    
    // 1. Basic Validation
    if (!userId) return res.status(401).json({ error: 'Unauthorized: Missing User ID' });

    try {
        // 2. Check Subscription Usage (Simple limit enforcement)
        const { data: usage, error: usageError } = await supabase
            .from('user_usage')
            .select('*')
            .eq('user_id', userId)
            .single();

        // (Auto-create usage record if not exists)
        if (usageError && usageError.code === 'PGRST116') {
            await supabase.from('user_usage').insert([{ user_id: userId, scan_count_monthly: 0 }]);
        }

        // 3. Determine Processing Path (Instant vs Queue)
        if (rateLimiter.canMakeRequest()) {
            console.log(`[API] Processing instant scan for ${userId}`);
            
            // Record request in rate limiter
            rateLimiter.recordRequest();

            // Extract text from contents
            let textToAnalyze = pastedText;
            
            if (!textToAnalyze && base64File && fileName) {
                 console.log(`[API] Processing base64 file: ${fileName}`);
                 const buffer = Buffer.from(base64File, 'base64');
                 const extension = fileName.split('.').pop()?.toLowerCase();
                 
                 try {
                     // @ts-ignore
                     const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;
                     // @ts-ignore
                     const mammoth = await import('mammoth');
                     
                     if (extension === 'pdf') {
                         const data = await pdfParse(buffer);
                         textToAnalyze = data.text;
                     } else if (extension === 'docx') {
                         const result = await mammoth.extractRawText({ buffer });
                         textToAnalyze = result.value;
                     } else {
                         textToAnalyze = buffer.toString('utf-8');
                     }
                 } catch (parseErr: any) {
                     return res.status(400).json({ error: `Failed to parse document: ${parseErr.message}` });
                 }
            }
            
            if (!textToAnalyze) {
                 return res.status(400).json({ error: 'No content provided for analysis' });
            }

            const result = await analyzeWithGemini(textToAnalyze, framework);

            // Update usage and store in history
            await supabase.from('scan_jobs').insert([{
                user_id: userId,
                framework,
                status: 'completed',
                result: result.findings,
                file_url: fileName, // just save the name for history since we didn't store it
                pasted_text: pastedText ? "Pasted text" : `Uploaded ${fileName}`
            }]);

            await supabase.rpc('increment_usage', { x_id: userId });

            return res.status(200).json(result);
        } else {
            console.log(`[API] Quota reached. Queueing scan for ${userId}`);
            
            const { data: job, error: jobError } = await supabase
                .from('scan_jobs')
                .insert([{
                    user_id: userId,
                    framework,
                    status: 'pending',
                    file_url: fileName,
                    pasted_text: pastedText || `Pending file: ${fileName}`,
                    user_email: email
                }])
                .select()
                .single();

            if (jobError) throw jobError;

            return res.status(202).json({ 
                status: 'queued', 
                message: 'Your scan is in the queue. We will email you once it is ready.',
                jobId: job.id
            });
        }

    } catch (error: any) {
        console.error('❌ Server-side Error:', error);
        return res.status(500).json({ error: error.message || 'Analysis failed' });
    }
}
