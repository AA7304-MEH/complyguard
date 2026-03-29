import { supabase } from '../lib/supabase';
import { analyzeWithGemini } from '../lib/gemini';
import { rateLimiter } from '../lib/rateLimiter';
import { extractTextFromUrl } from '../lib/extractor';
import { sendReportEmail } from '../lib/email';

export default async function handler(req: any, res: any) {
    // 1. Security Check (Vercel Cron Secret)
    const authHeader = req.headers['authorization'];
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized: Protocol violation' });
    }

    try {
        // 2. Fetch oldest pending job
        const { data: job, error: fetchError } = await supabase
            .from('scan_jobs')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: true })
            .limit(1)
            .single();

        if (fetchError || !job) {
            return res.status(200).json({ message: 'No pending jobs found.' });
        }

        // 3. Rate Limit Check
        if (!rateLimiter.canMakeRequest()) {
            return res.status(429).json({ message: 'Rate limit active. Retrying next cycle.' });
        }

        console.log(`[Worker] Processing Job: ${job.id} for User: ${job.user_id}`);

        // 4. Mark as processing
        await supabase.from('scan_jobs').update({ status: 'processing' }).eq('id', job.id);

        // 5. Extraction & Analysis
        let text = job.pasted_text;
        if (!text && job.file_url) {
            text = await extractTextFromUrl(job.file_url);
        }

        if (!text) throw new Error("No text content found to analyze.");

        rateLimiter.recordRequest();
        const result = await analyzeWithGemini(text, job.framework);

        // 6. Update Job Success
        await supabase.from('scan_jobs').update({
            status: 'completed',
            result: result.findings,
            updated_at: new Date()
        }).eq('id', job.id);

        // 7. Increment Usage
        await supabase.rpc('increment_usage', { x_id: job.user_id });

        // 8. Notify User (Fire and forget email)
        // Note: In production, you might need a user email in the scan_jobs table or fetch from Clerk
        // For now, assume we have it or can fetch it if needed.
        if (job.user_email) {
            await sendReportEmail(job.user_email, job.id, `Audit found ${result.findings.length} findings.`);
        }

        return res.status(200).json({ status: 'success', jobId: job.id });

    } catch (error: any) {
        console.error('[Worker] Fatal Error:', error);
        
        // Mark job as failed if needed, or implement retry logic
        if (req.query.jobId) { // If it was a forced retry
             await supabase.from('scan_jobs').update({ 
                status: 'failed', 
                error_message: error.message 
            }).eq('id', req.query.jobId);
        }

        return res.status(500).json({ error: error.message });
    }
}
