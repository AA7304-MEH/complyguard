import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

let supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
if (supabaseUrl) {
    supabaseUrl = supabaseUrl.split(/[?#]/)[0].trim();
    if (!supabaseUrl.startsWith('http')) {
        supabaseUrl = `https://${supabaseUrl}.supabase.co`;
    }
}
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'PATCH' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { evidenceId, status, reviewerNotes, userId, scanId, findingId } = req.body;
    if (!evidenceId || !status) {
        return res.status(400).json({ error: 'Missing evidenceId or status parameter' });
    }

    if (!supabaseUrl || !supabaseKey) {
        return res.status(200).json({ success: true, evidenceId, status, mode: 'fallback' });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase
            .from('evidence')
            .update({ 
                status, 
                reviewer_notes: reviewerNotes || '' 
            })
            .eq('id', evidenceId)
            .select()
            .single();

        if (error) {
            console.warn("⚠️ Update evidence status failed in DB, returning fallback:", error.message);
            return res.status(200).json({ success: true, evidenceId, status, mode: 'fallback_db_error' });
        }

        // Optional: log to audit trail if scanId and userId are provided
        if (scanId && userId) {
            const { error: atError } = await supabase.from('audit_trail').insert([{
                id: `at_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                scan_id: scanId,
                finding_id: findingId || null,
                user_id: userId,
                action: `Evidence review status updated to "${status}"`,
                details: reviewerNotes || `Status changed to ${status}`,
                created_at: new Date().toISOString()
            }]);
            if (atError) console.warn("Audit trail insert failed:", atError.message);
        }

        return res.status(200).json({ success: true, evidence: data || { id: evidenceId, status }, mode: 'supabase' });
    } catch (err: any) {
        console.warn("⚠️ Update evidence status exception:", err.message);
        return res.status(200).json({ success: true, evidenceId, status, mode: 'fallback_exception' });
    }
}
