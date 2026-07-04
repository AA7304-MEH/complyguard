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
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

    // Get scanId from dynamic route or query param
    const scanId = (req.query.scanId as string) || (req.query.id as string);
    if (!scanId) {
        return res.status(400).json({ error: 'Missing scanId parameter' });
    }

    if (!supabaseUrl || !supabaseKey) {
        return res.status(200).json({ 
            success: true, 
            evidence: [], 
            comments: [], 
            overrides: [], 
            audit_trail: [], 
            mode: 'fallback' 
        });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Fetch evidence
        const { data: evidence, error: evError } = await supabase
            .from('evidence')
            .select('*')
            .eq('scan_id', scanId);

        // Fetch comments
        const { data: comments, error: comError } = await supabase
            .from('comments')
            .select('*')
            .eq('scan_id', scanId)
            .order('created_at', { ascending: true });

        // Fetch overrides
        const { data: overrides, error: ovError } = await supabase
            .from('severity_overrides')
            .select('*')
            .eq('scan_id', scanId);

        // Fetch audit trail
        const { data: auditTrail, error: auditError } = await supabase
            .from('audit_trail')
            .select('*')
            .eq('scan_id', scanId)
            .order('created_at', { ascending: false });

        return res.status(200).json({
            success: true,
            evidence: evError ? [] : (evidence || []),
            comments: comError ? [] : (comments || []),
            overrides: ovError ? [] : (overrides || []),
            audit_trail: auditError ? [] : (auditTrail || []),
            mode: 'supabase'
        });
    } catch (err: any) {
        console.warn("⚠️ Fetch evidence exception, returning empty arrays:", err.message);
        return res.status(200).json({
            success: true,
            evidence: [],
            comments: [],
            overrides: [],
            audit_trail: [],
            mode: 'fallback_exception'
        });
    }
}
