
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

    const { userId, email, deviceId, action } = req.body;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Define standard mock profile fallback
    const mockProfile = {
        user_id: userId,
        email: email || 'demo.user@complyguard.ai',
        company_name: 'Acme Corp (Demo Mode)',
        subscription_tier: 'free',
        subscription_status: 'active',
        credits: 10,
        free_credits_used: false,
        created_at: new Date().toISOString()
    };

    // If Supabase keys are not set, immediately return mock profile with warning
    if (!supabaseUrl || !supabaseKey) {
        console.warn("⚠️ Supabase credentials missing. Running in resilient mock mode.");
        return res.status(200).json(mockProfile);
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        if (action === 'get_or_init') {
            try {
                // 1. Get or create user profile
                let { data: profile, error: profileError } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('user_id', userId)
                    .single();

                if (!profile || profileError) {
                    // If profile doesn't exist, try to create it
                    // New user - check device tracking
                    let initialCredits = 1;
                    let freeCreditsUsed = false;

                    try {
                        const { data: deviceData } = await supabase
                            .from('device_tracking')
                            .select('*')
                            .eq('device_id', deviceId)
                            .single();

                        if (deviceData) {
                            initialCredits = 0;
                            freeCreditsUsed = true;
                        } else {
                            // Record device usage
                            await supabase.from('device_tracking').insert([{ 
                                device_id: deviceId, 
                                user_id: userId,
                                granted_at: new Date().toISOString() 
                            }]);
                        }
                    } catch (deviceErr) {
                        console.warn("⚠️ Device tracking failed (non-fatal):", deviceErr);
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
            } catch (dbErr: any) {
                console.error("⚠️ Supabase Database Query Error, falling back to mock profile:", dbErr);
                // Return mock profile to keep the app working for the user!
                return res.status(200).json({
                    ...mockProfile,
                    company_name: 'Acme Corp (Offline Mode)'
                });
            }
        }

        if (action === 'add_credits') {
            const { amount } = req.body;
            if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

            try {
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('credits')
                    .eq('user_id', userId)
                    .single();

                const currentCredits = profile ? profile.credits : 0;
                const { data: updatedProfile, error: updateError } = await supabase
                    .from('user_profiles')
                    .update({ credits: currentCredits + amount })
                    .eq('user_id', userId)
                    .select()
                    .single();

                if (updateError) throw updateError;
                return res.status(200).json(updatedProfile);
            } catch (dbErr) {
                console.error("⚠️ Supabase Add Credits Error, falling back to mock update:", dbErr);
                return res.status(200).json({
                    ...mockProfile,
                    credits: mockProfile.credits + amount,
                    company_name: 'Acme Corp (Offline Mode)'
                });
            }
        }

        if (action === 'consume') {
            try {
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('credits, subscription_tier')
                    .eq('user_id', userId)
                    .single();

                if (!profile || profile.credits <= 0) {
                    return res.status(403).json({ error: 'Insufficient credits', needsPricing: true });
                }

                const updateData: any = { credits: profile.credits - 1 };
                if (profile.subscription_tier === 'free' && updateData.credits <= 0) {
                    updateData.free_credits_used = true;
                }

                const { data: updatedProfile, error: updateError } = await supabase
                    .from('user_profiles')
                    .update(updateData)
                    .eq('user_id', userId)
                    .select()
                    .single();

                if (updateError) throw updateError;
                return res.status(200).json(updatedProfile);
            } catch (dbErr) {
                console.error("⚠️ Supabase Consume Error, falling back to mock consume:", dbErr);
                return res.status(200).json({
                    ...mockProfile,
                    credits: Math.max(0, mockProfile.credits - 1),
                    company_name: 'Acme Corp (Offline Mode)'
                });
            }
        }

        return res.status(400).json({ error: 'Invalid action' });

    } catch (error: any) {
        console.error('❌ Critical handler profile error, falling back to mock profile:', error);
        return res.status(200).json(mockProfile);
    }
}
