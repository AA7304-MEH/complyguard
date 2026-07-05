// Secure consolidated collaboration handler
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

    const { action } = req.body;

    // --- ACTION: ASSIGN ---
    if (action === 'assign') {
        const { scanId, findingId, userId, assignedToEmail } = req.body;
        if (!scanId || !findingId || !assignedToEmail) {
            return res.status(400).json({ error: 'Missing required assignment parameters' });
        }

        const auditEntry = {
            id: `at_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            scan_id: scanId,
            finding_id: findingId,
            user_id: userId || 'system',
            action: `Assigned finding to ${assignedToEmail}`,
            details: `Assigned team member: ${assignedToEmail}`,
            created_at: new Date().toISOString()
        };

        if (!supabaseUrl || !supabaseKey) {
            return res.status(200).json({ success: true, assignedTo: assignedToEmail, audit_entry: auditEntry, mode: 'fallback' });
        }

        try {
            const supabase = createClient(supabaseUrl, supabaseKey);
            const { error: atError } = await supabase.from('audit_trail').insert([auditEntry]);
            if (atError) console.warn("Audit trail insert failed:", atError.message);

            return res.status(200).json({ success: true, assignedTo: assignedToEmail, audit_entry: auditEntry, mode: 'supabase' });
        } catch (err: any) {
            console.warn("⚠️ Assign finding exception:", err.message);
            return res.status(200).json({ success: true, assignedTo: assignedToEmail, audit_entry: auditEntry, mode: 'fallback_exception' });
        }
    }

    // --- ACTION: COMMENT ---
    if (action === 'comment') {
        const { scanId, findingId, userId, userEmail, commentText } = req.body;
        if (!scanId || !findingId || !commentText) {
            return res.status(400).json({ error: 'Missing required comment parameters' });
        }

        const commentItem = {
            id: `com_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            scan_id: scanId,
            finding_id: findingId,
            user_id: userId || 'system',
            user_email: userEmail || 'user@company.com',
            comment_text: commentText,
            created_at: new Date().toISOString()
        };

        if (!supabaseUrl || !supabaseKey) {
            return res.status(200).json({ success: true, comment: commentItem, mode: 'fallback' });
        }

        try {
            const supabase = createClient(supabaseUrl, supabaseKey);
            const { data, error } = await supabase
                .from('comments')
                .insert([commentItem])
                .select()
                .single();

            if (error) {
                console.warn("⚠️ Comment insert failed in DB, returning fallback:", error.message);
                return res.status(200).json({ success: true, comment: commentItem, mode: 'fallback_db_error' });
            }

            return res.status(200).json({ success: true, comment: data || commentItem, mode: 'supabase' });
        } catch (err: any) {
            console.warn("⚠️ Comment upload exception:", err.message);
            return res.status(200).json({ success: true, comment: commentItem, mode: 'fallback_exception' });
        }
    }

    // --- ACTION: OVERRIDE-SEVERITY ---
    if (action === 'override-severity') {
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
            const { data: ovData, error: ovError } = await supabase
                .from('severity_overrides')
                .insert([overrideItem])
                .select()
                .single();

            const { error: atError } = await supabase.from('audit_trail').insert([auditEntry]);
            if (atError) console.warn("Audit trail insert failed:", atError.message);

            return res.status(200).json({ success: true, override: ovData || overrideItem, audit_entry: auditEntry, mode: 'supabase' });
        } catch (err: any) {
            console.warn("⚠️ Severity override exception:", err.message);
            return res.status(200).json({ success: true, override: overrideItem, audit_entry: auditEntry, mode: 'fallback_exception' });
        }
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
}
