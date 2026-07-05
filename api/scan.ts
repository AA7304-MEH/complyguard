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
        let supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

        // Force fallback if Vercel has the old stale database configured
        if (supabaseUrl && (supabaseUrl.includes('mdiziasnsmwyyeuotiea') || supabaseUrl.includes('xyzcompany'))) {
            supabaseUrl = 'https://gfiljosefyjydpwooxxl.supabase.co';
            supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmaWxqb3NlZnlqeWRwd29veHhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NTIzMzQsImV4cCI6MjA5NDEyODMzNH0.4Fb3juvdKEyNKyCAYb3h84k_Grwks1GxiC0nERCJ1ro';
        }

        if (supabaseUrl && !supabaseUrl.startsWith('http')) {
            supabaseUrl = `https://${supabaseUrl}.supabase.co`;
        }
        
        let userRecord = { scans_used: 0, scan_limit: 10, plan: 'free' };
        let isDbConnected = false;

        if (supabaseUrl && supabaseKey) {
            try {
                const supabase = createClient(supabaseUrl, supabaseKey);
                const { data, error: userError } = await supabase
                    .from('users')
                    .select('scans_used, scan_limit, plan')
                    .eq('id', userId)
                    .single();

                if (data && !userError) {
                    userRecord = data;
                    isDbConnected = true;
                } else {
                    console.warn("⚠️ Supabase user profile not found or query error, using resilient fallback credits:", userError);
                }
            } catch (dbErr: any) {
                console.error("⚠️ Supabase connection failed in scan API, using resilient fallback credits:", dbErr.message);
            }
        } else {
            console.warn("⚠️ Supabase credentials missing in scan API, using resilient fallback credits.");
        }

        if (isDbConnected && userRecord.scans_used >= userRecord.scan_limit) {
            return res.status(403).json({ 
                error: 'Scan limit reached. Please upgrade your plan.',
                scans_used: userRecord.scans_used,
                scan_limit: userRecord.scan_limit
            });
        }
        // --- END CREDIT ENFORCEMENT ---

        const prompt = `
            You are a compliance auditor. Analyze the document against ${framework}.
            Checklist: ${checklist}
            For every finding, you MUST cite the specific regulatory article or control number. 
            For GDPR: cite "GDPR Article X" 
            For SOC2: cite "SOC2 Trust Service Criteria CC X.X"
            For HIPAA: cite "HIPAA § 164.XXX"
            For ISO27001: cite "ISO 27001 Annex A X.X"
            Include the citation in the finding title like: "Data Breach Notification (GDPR Article 33)".
            Scoring rules:
            - Start at 100
            - Deduct 20 points per CRITICAL finding
            - Deduct 10 points per HIGH finding  
            - Deduct 5 points per MEDIUM finding
            - Add back 5 points for each control that IS documented and present
            - Minimum score is 0, maximum is 100
            - A document with strong encryption, MFA, and access controls should score at least 40+ even with other gaps
            Return JSON with a 'findings' array. Each finding must have 'requirement', 'description', 'severity', and 'remediation'.
            Also return a 'score' field in the JSON with the final computed score.
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

        let score = jsonResult.score;
        if (typeof score !== 'number') {
            const deductions: Record<string, number> = { Critical: 20, High: 10, Medium: 5, Low: 0 };
            score = Math.max(0, 100 - findings.reduce((acc: number, f: any) => acc + (deductions[f.severity] || 0), 0));
        }

        if (supabaseUrl && supabaseKey) {
            try {
                const supabase = createClient(supabaseUrl, supabaseKey);
                
                if (isDbConnected) {
                    await supabase
                        .from('users')
                        .update({ scans_used: userRecord.scans_used + 1 })
                        .eq('id', userId);
                }

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
