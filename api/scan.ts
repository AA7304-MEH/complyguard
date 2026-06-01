import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callGeminiWithRotation } from '../lib/geminiKeyRotator.js';

// Inlined FRAMEWORKS
const FRAMEWORKS: Record<string, string> = {
    GDPR: "Lawful basis, Data subject rights, DPO contact, Retention period, International transfers, Breach notification, Security measures.",
    HIPAA: "Privacy Rule, Security Rule, Breach Notification, BAAs, Documentation retention.",
    SOC2: "Communication of objectives, Risk assessment, Control activities, Logical access, Physical security, Encryption, Change management.",
    ISO27001: "Information security policy, Access control, Authentication, Privacy & PII protection, Secure coding."
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const { framework, pastedText, userId, email, base64File, fileName } = req.body;
        if (!userId) return res.status(401).json({ error: 'Unauthorized: Missing User ID' });

        // Lazy load heavy dependencies
        const { createClient } = await import('@supabase/supabase-js');

        const checklist = FRAMEWORKS[framework] || FRAMEWORKS.GDPR;

        // --- CREDIT ENFORCEMENT ---
        let supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
        if (supabaseUrl && !supabaseUrl.startsWith('http')) {
            supabaseUrl = `https://${supabaseUrl}.supabase.co`;
        }
        const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
        
        let profile = { credits: 10, subscription_tier: 'free' };
        let isDbConnected = false;

        if (supabaseUrl && supabaseKey) {
            try {
                const supabase = createClient(supabaseUrl, supabaseKey);
                const { data, error: profileError } = await supabase
                    .from('user_profiles')
                    .select('credits, subscription_tier')
                    .eq('user_id', userId)
                    .single();

                if (data && !profileError) {
                    profile = data;
                    isDbConnected = true;

                    // Consume credit in DB
                    const updateData: any = { credits: profile.credits - 1 };
                    if (profile.subscription_tier === 'free' && updateData.credits <= 0) {
                        updateData.free_credits_used = true;
                    }
                    await supabase.from('user_profiles').update(updateData).eq('user_id', userId);
                } else {
                    console.warn("⚠️ Supabase profile not found or query error, using resilient fallback credits:", profileError);
                }
            } catch (dbErr: any) {
                console.error("⚠️ Supabase connection failed in scan API, using resilient fallback credits:", dbErr.message);
            }
        } else {
            console.warn("⚠️ Supabase credentials missing in scan API, using resilient fallback credits.");
        }

        if (profile.credits <= 0 && isDbConnected) {
            return res.status(403).json({ 
                error: 'Insufficient credits', 
                message: 'You have used all your credits. Please upgrade to continue.',
                needsPricing: true 
            });
        }
        // --- END CREDIT ENFORCEMENT ---

        const prompt = `
            You are a compliance auditor. Analyze the document against ${framework}.
            Checklist: ${checklist}
            Return JSON with a 'findings' array. Each finding must have 'requirement', 'description', 'severity', and 'remediation'.
        `;

        const parts: any[] = [{ text: prompt }];
        if (pastedText) parts.push({ text: `Document Text: """${pastedText}"""` });
        
        if (base64File && fileName) {
            const ext = fileName.split('.').pop()?.toLowerCase();
            let mimeType = 'application/pdf';
            if (ext === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            if (ext === 'doc') mimeType = 'application/msword';
            if (ext === 'txt') mimeType = 'text/plain';
            if (['png', 'jpg', 'jpeg'].includes(ext || '')) mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
            parts.push({ inlineData: { data: base64File, mimeType } });
        }

        
        
        const response = await callGeminiWithRotation(parts);
        const jsonResult = JSON.parse(response.text());
        const findings = jsonResult.findings || [];

        const deductions: Record<string, number> = { Critical: 25, High: 15, Medium: 7, Low: 2 };
        const score = Math.max(0, 100 - findings.reduce((acc: number, f: any) => acc + (deductions[f.severity] || 5), 0));

        if (supabaseUrl && supabaseKey) {
            try {
                await supabase.from('scan_jobs').insert([{
                    user_id: userId,
                    framework,
                    status: 'completed',
                    result: findings,
                    score,
                    file_url: fileName || null,
                    user_email: email || null
                }]);
            } catch (dbErr: any) {
                console.error('[DB Error] Non-fatal:', dbErr.message);
            }
        }

        return res.status(200).json({
            id: 'scan-' + Date.now().toString(36),
            user_id: userId,
            framework,
            status: 'completed',
            result: findings,
            score,
            created_at: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('❌ API Error:', error);
        return res.status(500).json({ 
            error: 'AI Analysis Failed', 
            message: error.message || 'Unknown AI error',
            details: error.toString()
        });
    }
}





