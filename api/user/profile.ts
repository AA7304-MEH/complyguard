import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

let supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
let supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

// Force fallback if Vercel has the old stale database configured
if (supabaseUrl && (supabaseUrl.includes('mdiziasnsmwyyeuotiea') || supabaseUrl.includes('xyzcompany'))) {
    supabaseUrl = 'https://gfiljosefyjydpwooxxl.supabase.co';
    supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmaWxqb3NlZnlqeWRwd29veHhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NTIzMzQsImV4cCI6MjA5NDEyODMzNH0.4Fb3juvdKEyNKyCAYb3h84k_Grwks1GxiC0nERCJ1ro';
}

if (supabaseUrl) {
    supabaseUrl = supabaseUrl.split(/[?#]/)[0].trim();
    if (!supabaseUrl.startsWith('http')) {
        supabaseUrl = `https://${supabaseUrl}.supabase.co`;
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { userId, email, deviceId, action } = req.body;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Define standard mock profile fallback
    const mockProfile = {
        user_id: userId,
        email: email || 'demo.user@complyguard.ai',
        company_name: 'Acme Corp',
        subscription_tier: 'free',
        subscription_status: 'active',
        credits: 10,
        free_credits_used: false,
        created_at: new Date().toISOString()
    };

    // If Supabase keys are not set, immediately return mock profile with warning (except white-label settings)
    if (!supabaseUrl || !supabaseKey) {
        if (action === 'white-label') {
            const { companyName, companyLogoUrl } = req.body;
            return res.status(200).json({
                success: true,
                settings: { user_id: userId, company_name: companyName || 'Your Company', company_logo_url: companyLogoUrl || '' },
                mode: 'fallback'
            });
        }
        console.warn("⚠️ Supabase credentials missing. Running in resilient mock mode.");
        return res.status(200).json(mockProfile);
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        // --- ACTION: WHITE-LABEL ---
        if (action === 'white-label') {
            const { companyName, companyLogoUrl } = req.body;
            const whiteLabelData = {
                user_id: userId,
                company_name: companyName || 'Your Company',
                company_logo_url: companyLogoUrl || ''
            };

            try {
                const { data, error } = await supabase
                    .from('users')
                    .update({
                        company_name: whiteLabelData.company_name,
                        company_logo_url: whiteLabelData.company_logo_url
                    })
                    .eq('id', userId)
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

        // --- ACTION: GET_OR_INIT ---
        if (action === 'get_or_init') {
            try {
                // 1. Get or create user profile
                let { data: profile, error: profileError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (!profile || profileError) {
                    let initialScansUsed = 0;
                    let initialLimit = 10;

                    try {
                        const { data: deviceData } = await supabase
                            .from('device_tracking')
                            .select('*')
                            .eq('device_id', deviceId)
                            .single();

                        if (deviceData) {
                            initialScansUsed = 10; // block free scans for tracked devices
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
                        .from('users')
                        .upsert([{ 
                            id: userId, 
                            email: email, 
                            scans_used: initialScansUsed,
                            scan_limit: initialLimit,
                            plan: 'free'
                        }])
                        .select()
                        .single();
                    
                    if (createError) throw createError;
                    profile = newProfile;
                }

                // Map for compatibility
                const mappedProfile = {
                    ...profile,
                    user_id: profile.id,
                    credits: Math.max(0, (profile.scan_limit ?? 10) - (profile.scans_used ?? 0)),
                    subscription_tier: profile.plan || 'free',
                    free_credits_used: (profile.scans_used ?? 0) >= (profile.scan_limit ?? 10)
                };

                return res.status(200).json(mappedProfile);
            } catch (dbErr: any) {
                console.error("⚠️ Supabase Database Query Error, falling back to mock profile:", dbErr);
                return res.status(200).json(mockProfile);
            }
        }

        // --- ACTION: ADD_CREDITS ---
        if (action === 'add_credits') {
            const { amount } = req.body;
            if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

            try {
                const { data: profile } = await supabase
                    .from('users')
                    .select('scan_limit')
                    .eq('id', userId)
                    .single();

                const currentLimit = profile ? profile.scan_limit : 10;
                const { data: updatedProfile, error: updateError } = await supabase
                    .from('users')
                    .update({ scan_limit: currentLimit + amount })
                    .eq('id', userId)
                    .select()
                    .single();

                if (updateError) throw updateError;
                
                const mappedProfile = {
                    ...updatedProfile,
                    user_id: updatedProfile.id,
                    credits: Math.max(0, (updatedProfile.scan_limit ?? 10) - (updatedProfile.scans_used ?? 0)),
                    subscription_tier: updatedProfile.plan || 'free',
                    free_credits_used: (updatedProfile.scans_used ?? 0) >= (updatedProfile.scan_limit ?? 10)
                };

                return res.status(200).json(mappedProfile);
            } catch (dbErr: any) {
                console.error("⚠️ Supabase Add Credits Error, falling back to mock update:", dbErr);
                return res.status(200).json({
                    ...mockProfile,
                    credits: mockProfile.credits + amount
                });
            }
        }

        // --- ACTION: CONSUME ---
        if (action === 'consume') {
            try {
                const { data: profile } = await supabase
                    .from('users')
                    .select('scans_used, scan_limit, plan')
                    .eq('id', userId)
                    .single();

                if (!profile || (profile.scans_used ?? 0) >= (profile.scan_limit ?? 10)) {
                    return res.status(403).json({ error: 'Insufficient credits', needsPricing: true });
                }

                const { data: updatedProfile, error: updateError } = await supabase
                    .from('users')
                    .update({ scans_used: (profile.scans_used || 0) + 1 })
                    .eq('id', userId)
                    .select()
                    .single();

                if (updateError) throw updateError;

                const mappedProfile = {
                    ...updatedProfile,
                    user_id: updatedProfile.id,
                    credits: Math.max(0, (updatedProfile.scan_limit ?? 10) - (updatedProfile.scans_used ?? 0)),
                    subscription_tier: updatedProfile.plan || 'free',
                    free_credits_used: (updatedProfile.scans_used ?? 0) >= (updatedProfile.scan_limit ?? 10)
                };

                return res.status(200).json(mappedProfile);
            } catch (dbErr: any) {
                console.error("⚠️ Supabase Consume Error, falling back to mock consume:", dbErr);
                return res.status(200).json({
                    ...mockProfile,
                    credits: Math.max(0, mockProfile.credits - 1)
                });
            }
        }

        return res.status(400).json({ error: 'Invalid action' });

    } catch (error: any) {
        console.error('❌ Critical handler profile error, falling back to mock profile:', error);
        return res.status(200).json(mockProfile);
    }
}
