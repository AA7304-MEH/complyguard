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
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { scanId, findingId, userId, userEmail, justification } = req.body;
    if (!scanId || !findingId || !userId || !justification) {
        return res.status(400).json({ error: 'Missing required parameters for accepting risk' });
    }

    const auditEntry = {
        id: `at_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        scan_id: scanId,
        finding_id: findingId,
        user_id: userId,
        user_email: userEmail || '',
        action: `Marked finding as "Accepted Risk"`,
        details: `Justification: "${justification}"`,
        created_at: new Date().toISOString()
    };

    if (!supabaseUrl || !supabaseKey) {
        return res.status(200).json({ success: true, audit_entry: auditEntry, mode: 'fallback' });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Insert into audit trail
        const { data: auditData, error: auditError } = await supabase
            .from('audit_trail')
            .insert([auditEntry])
            .select()
            .single();

        if (auditError) {
            console.warn("⚠️ Audit trail insert failed, returning fallback:", auditError.message);
            return res.status(200).json({ success: true, audit_entry: auditEntry, mode: 'fallback_db_error' });
        }

        return res.status(200).json({ success: true, audit_entry: auditData || auditEntry, mode: 'supabase' });
    } catch (err: any) {
        console.warn("⚠️ Accept risk exception:", err.message);
        return res.status(200).json({ success: true, audit_entry: auditEntry, mode: 'fallback_exception' });
    }
}
