
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { userId, email, deviceId, action } = req.body;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        if (action === 'get_or_init') {
            // 1. Get or create user profile
            let { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (!profile || profileError) {
                // If profile doesn't exist, create it
                // New user - check device tracking
                const { data: deviceData } = await supabase
                    .from('device_tracking')
                    .select('*')
                    .eq('device_id', deviceId)
                    .single();

                let initialCredits = 0;
                let freeCreditsUsed = false;

                if (!deviceData) {
                    // Device is clean, give 1 free credit
                    initialCredits = 1;
                    freeCreditsUsed = true;
                    
                    // Record device usage
                    await supabase.from('device_tracking').insert([{ 
                        device_id: deviceId, 
                        user_id: userId,
                        granted_at: new Date().toISOString() 
                    }]);
                }

                const { data: newProfile, error: createError } = await supabase
                    .from('user_profiles')
                    .upsert([{ 
                        user_id: userId, 
                        email: email, 
                        credits: initialCredits,
                        free_credits_used: freeCreditsUsed
                    }])
                    .select()
                    .single();
                
                if (createError) throw createError;
                profile = newProfile;
            }

            return res.status(200).json(profile);
        }

        if (action === 'consume') {
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('credits')
                .eq('user_id', userId)
                .single();

            if (!profile || profile.credits <= 0) {
                return res.status(403).json({ error: 'Insufficient credits', needsPricing: true });
            }

            const { data: updatedProfile, error: updateError } = await supabase
                .from('user_profiles')
                .update({ credits: profile.credits - 1 })
                .eq('user_id', userId)
                .select()
                .single();

            if (updateError) throw updateError;
            return res.status(200).json(updatedProfile);
        }

        return res.status(400).json({ error: 'Invalid action' });

    } catch (error: any) {
        console.error('❌ Profile Error:', error);
        return res.status(500).json({ error: 'Database operation failed', message: error.message });
    }
}
