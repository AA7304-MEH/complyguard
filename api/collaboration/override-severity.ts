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

    const { scanId, findingId, userId, userEmail, oldSeverity, newSeverity, justification } = req.body;
    if (!scanId || !findingId || !oldSeverity || !newSeverity || !justification) {
        return res.status(400).json({ error: 'Missing required parameters for severity override' });
    }

    const overrideItem = {
        id: `ov_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        scan_id: scanId,
        finding_id: findingId,
        user_id: userId || 'system',
        user_email: userEmail || 'user@company.com',
        old_severity: oldSeverity,
        new_severity: newSeverity,
        justification: justification,
        created_at: new Date().toISOString()
    };

    const auditEntry = {
        id: `at_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        scan_id: scanId,
        finding_id: findingId,
        user_id: userId || 'system',
        user_email: userEmail || 'user@company.com',
        action: `Severity adjusted from ${oldSeverity} to ${newSeverity}`,
        details: `Justification: "${justification}"`,
        created_at: new Date().toISOString()
    };

    if (!supabaseUrl || !supabaseKey) {
        return res.status(200).json({ success: true, override: overrideItem, audit_entry: auditEntry, mode: 'fallback' });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Insert into severity_overrides
        const { data: ovData, error: ovError } = await supabase
            .from('severity_overrides')
            .insert([overrideItem])
            .select()
            .single();

        // Insert into audit trail
        const { error: atError } = await supabase.from('audit_trail').insert([auditEntry]);
        if (atError) console.warn("Audit trail insert failed:", atError.message);

        return res.status(200).json({ success: true, override: ovData || overrideItem, audit_entry: auditEntry, mode: 'supabase' });
    } catch (err: any) {
        console.warn("⚠️ Severity override exception:", err.message);
        return res.status(200).json({ success: true, override: overrideItem, audit_entry: auditEntry, mode: 'fallback_exception' });
    }
}
