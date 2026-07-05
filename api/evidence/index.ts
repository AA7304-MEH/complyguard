// Secure consolidated evidence management handler
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
    // ----------------------------------------------------
    // GET: Fetch all scan data (evidence, comments, etc.)
    // ----------------------------------------------------
    if (req.method === 'GET') {
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

            const { data: evidence, error: evError } = await supabase
                .from('evidence')
                .select('*')
                .eq('scan_id', scanId);

            const { data: comments, error: comError } = await supabase
                .from('comments')
                .select('*')
                .eq('scan_id', scanId)
                .order('created_at', { ascending: true });

            const { data: overrides, error: ovError } = await supabase
                .from('severity_overrides')
                .select('*')
                .eq('scan_id', scanId);

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

    // ----------------------------------------------------
    // POST: Route actions (upload, accept-risk, status)
    // ----------------------------------------------------
    if (req.method === 'POST') {
        const { action } = req.body;
        
        // --- ACTION: UPLOAD ---
        if (action === 'upload') {
            const { scanId, findingId, userId, fileName, fileData, fileType, evidenceType, description, expiryDate } = req.body;
            if (!scanId || !findingId || !userId || !fileName) {
                return res.status(400).json({ error: 'Missing required upload parameters' });
            }

            const evidenceItem = {
                id: `ev_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                scan_id: scanId,
                finding_id: findingId,
                user_id: userId,
                file_name: fileName,
                file_url: fileData || `https://storage.complyguard.ai/evidence/${fileName}`,
                file_type: fileType || 'pdf',
                evidence_type: evidenceType || 'policy_doc',
                description: description || 'Evidence attached for finding',
                uploaded_at: new Date().toISOString(),
                expiry_date: expiryDate || null,
                status: 'pending_review',
                reviewer_notes: ''
            };

            if (!supabaseUrl || !supabaseKey) {
                return res.status(200).json({ success: true, evidence: evidenceItem, mode: 'fallback' });
            }

            try {
                const supabase = createClient(supabaseUrl, supabaseKey);
                let fileUrl = evidenceItem.file_url;

                if (fileData && fileData.startsWith('data:')) {
                    try {
                        const base64Data = fileData.split(',')[1];
                        const buffer = Buffer.from(base64Data, 'base64');
                        const filePath = `${userId}/${scanId}/${evidenceItem.id}_${fileName}`;
                        const { data: uploadData, error: uploadError } = await supabase
                            .storage
                            .from('compliance-evidence')
                            .upload(filePath, buffer, {
                                contentType: fileData.split(';')[0].split(':')[1] || 'application/octet-stream',
                                upsert: true
                            });
                        
                        if (!uploadError && uploadData) {
                            const { data: { publicUrl } } = supabase.storage.from('compliance-evidence').getPublicUrl(filePath);
                            fileUrl = publicUrl;
                            evidenceItem.file_url = fileUrl;
                        }
                    } catch (storageErr) {
                        console.warn("Storage upload failed, using direct link:", storageErr);
                    }
                }

                const { data, error } = await supabase
                    .from('evidence')
                    .insert([evidenceItem])
                    .select()
                    .single();

                if (error) {
                    console.warn("⚠️ Evidence table insert failed:", error.message);
                    return res.status(200).json({ success: true, evidence: evidenceItem, mode: 'fallback_db_error' });
                }

                // Insert into audit trail
                const { error: atError } = await supabase.from('audit_trail').insert([{
                    scan_id: scanId,
                    finding_id: findingId,
                    user_id: userId,
                    action: 'EVIDENCE_UPLOADED',
                    details: `Uploaded evidence: ${fileName} (${evidenceType}) - Expires: ${expiryDate || 'No expiry'}`
                }]);
                if (atError) console.warn("Audit trail insert failed:", atError.message);

                return res.status(200).json({ success: true, evidence: data || evidenceItem, mode: 'supabase' });
            } catch (err: any) {
                console.warn("⚠️ Evidence upload exception:", err.message);
                return res.status(200).json({ success: true, evidence: evidenceItem, mode: 'fallback_exception' });
            }
        }

        // --- ACTION: ACCEPT-RISK ---
        if (action === 'accept-risk') {
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
                const { data: auditData, error: auditError } = await supabase
                    .from('audit_trail')
                    .insert([auditEntry])
                    .select()
                    .single();

                if (auditError) {
                    console.warn("⚠️ Audit trail insert failed:", auditError.message);
                    return res.status(200).json({ success: true, audit_entry: auditEntry, mode: 'fallback_db_error' });
                }

                return res.status(200).json({ success: true, audit_entry: auditData || auditEntry, mode: 'supabase' });
            } catch (err: any) {
                console.warn("⚠️ Accept risk exception:", err.message);
                return res.status(200).json({ success: true, audit_entry: auditEntry, mode: 'fallback_exception' });
            }
        }

        // --- ACTION: STATUS ---
        if (action === 'status') {
            const { evidenceId, status, reviewerNotes, userId, scanId, findingId } = req.body;
            if (!evidenceId || !status) {
                return res.status(400).json({ error: 'Missing required parameters for status update' });
            }

            if (!supabaseUrl || !supabaseKey) {
                return res.status(200).json({ success: true, evidenceId, status, mode: 'fallback' });
            }

            try {
                const supabase = createClient(supabaseUrl, supabaseKey);
                const { data, error } = await supabase
                    .from('evidence')
                    .update({ status, reviewer_notes: reviewerNotes })
                    .eq('id', evidenceId)
                    .select()
                    .single();

                if (error) {
                    console.warn("⚠️ Update evidence status failed:", error.message);
                    return res.status(200).json({ success: true, evidenceId, status, mode: 'fallback_db_error' });
                }

                if (scanId && userId) {
                    const { error: atError } = await supabase.from('audit_trail').insert([{
                        id: `at_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                        scan_id: scanId,
                        finding_id: findingId || null,
                        user_id: userId,
                        action: `Evidence review status updated to "${status}"`,
                        details: reviewerNotes || `Status changed to ${status}`,
                        created_at: new Date().toISOString()
                    }]);
                    if (atError) console.warn("Audit trail insert failed:", atError.message);
                }

                return res.status(200).json({ success: true, evidence: data || { id: evidenceId, status }, mode: 'supabase' });
            } catch (err: any) {
                console.warn("⚠️ Update evidence status exception:", err.message);
                return res.status(200).json({ success: true, evidenceId, status, mode: 'fallback_exception' });
            }
        }

        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
}
