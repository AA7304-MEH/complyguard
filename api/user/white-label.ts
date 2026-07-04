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

    const { userId, companyName, companyLogoUrl } = req.body;
    if (!userId) {
        return res.status(400).json({ error: 'Missing userId parameter' });
    }

    const whiteLabelData = {
        user_id: userId,
        company_name: companyName || 'Your Company',
        company_logo_url: companyLogoUrl || ''
    };

    if (!supabaseUrl || !supabaseKey) {
        return res.status(200).json({ success: true, settings: whiteLabelData, mode: 'fallback' });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase
            .from('user_profiles')
            .update({
                company_name: whiteLabelData.company_name,
                company_logo_url: whiteLabelData.company_logo_url
            })
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            console.warn("⚠️ Update white-label settings failed in DB, returning fallback:", error.message);
            return res.status(200).json({ success: true, settings: whiteLabelData, mode: 'fallback_db_error' });
        }

        return res.status(200).json({ success: true, settings: data || whiteLabelData, mode: 'supabase' });
    } catch (err: any) {
        console.warn("⚠️ White label update exception:", err.message);
        return res.status(200).json({ success: true, settings: whiteLabelData, mode: 'fallback_exception' });
    }
}
