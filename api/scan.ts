import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callGeminiWithRotation } from '../lib/geminiKeyRotator.js';

const SUPPORTED_FRAMEWORKS = [
  'GDPR', 'SOC2', 'HIPAA', 'ISO27001', 'PCI-DSS',
  'RBI_KYC',
  'RBI_AML',
  'RBI_IT',
  'RBI_CYBER',
  'RBI_PA',
  'RBI_PPI',
  'PMLA',
  'FEMA',
  'IRDAI_DATA',
  'IRDAI_CYBER',
  'SEBI_CYBER',
  'DPDP',
];

// Inlined FRAMEWORKS
const FRAMEWORKS: Record<string, string> = {
    GDPR: "Lawful basis, Data subject rights, DPO contact, Retention period, International transfers, Breach notification, Security measures.",
    HIPAA: "Privacy Rule, Security Rule, Breach Notification, BAAs, Documentation retention.",
    SOC2: "Communication of objectives, Risk assessment, Control activities, Logical access, Physical security, Encryption, Change management.",
    ISO27001: "Information security policy, Access control, Authentication, Privacy & PII protection, Secure coding.",
    'PCI-DSS': "Cardholder data protection, encryption, access controls, network security, regular testing.",
    RBI_IT: "IT governance, information security policy, business continuity planning, outsourcing risk management.",
    RBI_PPI: "PPI issuance requirements, KYC compliance for PPIs, escrow account management, customer protection.",
    PMLA: "Prevention of money laundering controls, customer identification, transaction reporting, compliance officer responsibilities.",
    FEMA: "Foreign exchange transactions, reporting compliance, inbound/outbound remittance controls.",
    IRDAI_DATA: "Data localization, policyholder data storage in India, retention and security measures."
};

const FRAMEWORK_PROMPTS: Record<string, string> = {
  RBI_KYC: `
    Analyze this document against RBI Master Directions on KYC 2016.
    Check for:
    1. Customer identification and verification procedures (OVDs)
    2. Risk categorization of customers (Low/Medium/High)
    3. Periodic KYC updation procedures
    4. Enhanced Due Diligence for high-risk customers
    5. Simplified KYC for low-risk customers
    6. Non-face-to-face customer onboarding procedures
    7. KYC for legal entities and beneficial ownership
    8. Central KYC Registry (CKYCR) integration mention
    9. Video based Customer Identification Process (V-CIP)
    10. Record keeping and retention (minimum 5 years)
    
    Cite violations as "RBI KYC Master Directions Section X"
  `,
  
  RBI_AML: `
    Analyze this document against RBI Master Directions on AML/CFT.
    Check for:
    1. AML policy and compliance program documentation
    2. Transaction monitoring procedures
    3. Suspicious Transaction Report (STR) filing process
    4. Cash Transaction Report (CTR) filing for transactions above ₹10 lakhs
    5. Cross-border wire transfer monitoring
    6. Politically Exposed Persons (PEP) screening
    7. Sanctions screening procedures (UN, OFAC)
    8. Principal Officer appointment and responsibilities
    9. AML training program for employees
    10. Record keeping requirements (10 years)
    11. Non-Profit Organisation (NPO) monitoring
    12. FIU-IND reporting obligations
    
    Cite violations as "RBI AML Master Directions Section X" or "PMLA Section X"
  `,
  
  RBI_CYBER: `
    Analyze this document against RBI Cybersecurity Framework 2016 
    and RBI IT Framework for Banks.
    Check for:
    1. Cybersecurity policy and governance framework
    2. Board-level IT/Cyber oversight mechanism
    3. CISO appointment and responsibilities
    4. Cyber crisis management plan
    5. Security Operations Centre (SOC) mention
    6. Vulnerability Assessment and Penetration Testing (VAPT) schedule
    7. Patch management procedures
    8. Incident response and reporting to RBI (within 2-6 hours)
    9. Customer awareness and education program
    10. Third-party vendor risk management
    11. Data backup and recovery procedures
    12. Network security architecture documentation
    13. Forensic capability and tools
    14. Cyber insurance mention
    
    Cite violations as "RBI Cybersecurity Framework Section X"
  `,
  
  RBI_PA: `
    Analyze this document against RBI Payment Aggregator Guidelines 2020.
    Check for:
    1. Net worth requirements documentation (₹25 crore)
    2. Escrow account management procedures
    3. Merchant onboarding due diligence process
    4. Transaction data storage and security (PCI-DSS)
    5. Grievance redressal mechanism and Nodal Officer
    6. Settlement timelines compliance (T+1)
    7. Prohibited merchant categories list
    8. AML/CFT compliance for payment flows
    9. Data localization — all payment data in India
    10. Annual system audit requirements
    11. Customer dispute resolution process
    12. Prohibited business activities list
    
    Cite violations as "RBI PA Guidelines 2020 Section X"
  `,
  
  DPDP: `
    Analyze this document against India's Digital Personal Data 
    Protection Act 2023 (DPDP Act).
    Check for:
    1. Lawful basis for processing personal data
    2. Consent mechanism — free, specific, informed, unambiguous
    3. Notice to data principals before/at time of collection
    4. Purpose limitation — data used only for stated purpose
    5. Data minimization principles
    6. Data principal rights:
       - Right to access information
       - Right to correction and erasure
       - Right to grievance redressal
       - Right to nominate
    7. Data Fiduciary obligations
    8. Significant Data Fiduciary additional obligations
    9. Cross-border data transfer restrictions
    10. Data Protection Board complaint mechanism
    11. Children's data protection (under 18)
    12. Data breach notification obligations
    13. Data retention limitation
    14. Consent Manager integration (if applicable)
    
    Cite violations as "DPDP Act 2023 Section X"
  `,
  
  IRDAI_CYBER: `
    Analyze this document against IRDAI Information and 
    Cyber Security Guidelines.
    Check for:
    1. Information Security policy board approval
    2. CISO designation and reporting structure
    3. Information Security Committee constitution
    4. Data classification framework (Public/Internal/Confidential/Secret)
    5. Third-party/outsourcing security requirements
    6. Business continuity and disaster recovery plan
    7. Cyber incident reporting to IRDAI (within 6 hours)
    8. Annual cyber security audit requirement
    9. Policyholder data protection measures
    10. Cloud security policy
    11. Mobile and remote access security
    12. Vendor risk assessment procedures
    
    Cite violations as "IRDAI Cyber Security Guidelines Section X"
  `,
  
  SEBI_CYBER: `
    Analyze this document against SEBI Cybersecurity and 
    Cyber Resilience Framework.
    Check for:
    1. Cybersecurity governance structure
    2. Cyber crisis management plan
    3. Periodic risk assessment (minimum annual)
    4. VAPT requirements (bi-annual)
    5. SOC implementation
    6. Incident response and reporting to SEBI
    7. Investor data protection measures
    8. Third-party risk management
    9. Business continuity plan for market operations
    10. Cyber insurance requirements
    11. Employee awareness training
    12. Dark web monitoring mention
    
    Cite violations as "SEBI Cyber Resilience Framework Section X"
  `
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

        const frameworkPrompt = FRAMEWORK_PROMPTS[framework] || `
            Analyze the document against ${framework}.
            Checklist: ${checklist}
        `;

        const prompt = `
            You are a compliance auditor. ${frameworkPrompt}
            For every finding, you MUST cite the specific regulatory article or control number. 
            For GDPR: cite "GDPR Article X" 
            For SOC2: cite "SOC2 Trust Service Criteria CC X.X"
            For HIPAA: cite "HIPAA § 164.XXX"
            For ISO27001: cite "ISO 27001 Annex A X.X"
            For PCI-DSS: cite "PCI-DSS Requirement X.X"
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
