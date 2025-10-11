import { User, AuditScan, Framework, FrameworkRule, SubscriptionTier, SubscriptionStatus, AuditStatus, FindingSeverity } from '../types';

// This now represents the application-specific user data.
// User's email and ID will come from Clerk.
export const mockAppUser: User = {
  id: 'user-123', // This would match the clerk user id in a real DB
  email: 'compliance.officer@acmecorp.com', // This would match the clerk user email
  company_name: 'Acme Corp',
  subscription_tier: SubscriptionTier.Free,
  subscription_status: SubscriptionStatus.Active,
  documents_scanned_this_month: 3,
  scan_limit_this_month: 5,
  subscription_start_date: new Date('2024-01-01'),
  subscription_end_date: new Date('2024-12-31'),
};

export const mockFrameworks: Framework[] = [
  { id: 'gdpr', name: 'GDPR', version: '1.0', description: 'General Data Protection Regulation' },
  { id: 'hipaa', name: 'HIPAA', version: '1.0', description: 'Health Insurance Portability and Accountability Act' },
  { id: 'soc2', name: 'SOC 2', version: '1.0', description: 'System and Organization Controls 2' },
];

export const mockFrameworkRules: FrameworkRule[] = [
    // GDPR Rules
    { 
        id: 'gdpr-art-30', 
        framework_id: 'gdpr', 
        article: 'Article 30', 
        title: 'Records of processing activities', 
        requirement_text: 'Each controller shall maintain a record of processing activities. That record shall contain: the name and contact details of the controller and the data protection officer; the purposes of the processing; a description of the categories of data subjects and of personal data; the categories of recipients to whom the personal data have been or will be disclosed.' 
    },
    { 
        id: 'gdpr-art-32', 
        framework_id: 'gdpr', 
        article: 'Article 32', 
        title: 'Security of processing', 
        requirement_text: 'The controller and the processor shall implement appropriate technical and organisational measures to ensure a level of security appropriate to the risk, including: the pseudonymisation and encryption of personal data; the ability to ensure the ongoing confidentiality, integrity, availability and resilience of processing systems and services.' 
    },
    {
        id: 'gdpr-art-15',
        framework_id: 'gdpr',
        article: 'Article 15',
        title: 'Right of access by the data subject',
        requirement_text: 'The data subject shall have the right to obtain from the controller confirmation as to whether or not personal data concerning him or her are being processed, and, where that is the case, access to the personal data. The controller shall provide a copy of the personal data undergoing processing.'
    },
    
    // HIPAA Rules
    {
        id: 'hipaa-sec-164.308-a-1-i',
        framework_id: 'hipaa',
        article: '§ 164.308(a)(1)(i)',
        title: 'Security Management Process',
        requirement_text: 'A covered entity must implement policies and procedures to prevent, detect, contain, and correct security violations. This includes conducting a risk analysis to identify potential risks and vulnerabilities to the confidentiality, integrity, and availability of electronic protected health information (ePHI).'
    },
    {
        id: 'hipaa-sec-164.312-a-2-iv',
        framework_id: 'hipaa',
        article: '§ 164.312(a)(2)(iv)',
        title: 'Encryption and Decryption',
        requirement_text: 'Implement a mechanism to encrypt and decrypt electronic protected health information (ePHI) when it is reasonable and appropriate to do so.'
    },
    {
        id: 'hipaa-privacy-164.502-b',
        framework_id: 'hipaa',
        article: '§ 164.502(b)',
        title: 'Minimum Necessary',
        requirement_text: 'A covered entity must make reasonable efforts to limit protected health information to the minimum necessary to accomplish the intended purpose of the use, disclosure, or request.'
    },

    // SOC 2 Rules
    {
        id: 'soc2-cc6.1',
        framework_id: 'soc2',
        article: 'CC6.1',
        title: 'Logical Access Security',
        requirement_text: 'The entity implements logical access security software, infrastructure, and architectures to protect information assets from security events to meet the entity’s objectives. Procedures are in place to authorize, modify, and remove access to data and systems based on the principle of least privilege.'
    },
    {
        id: 'soc2-cc7.1',
        framework_id: 'soc2',
        article: 'CC7.1',
        title: 'Vulnerability Detection and Monitoring',
        requirement_text: 'To meet its objectives, the entity uses detection and monitoring procedures to identify changes to configurations that result in the introduction of new vulnerabilities, and susceptibilities to newly discovered vulnerabilities. The entity must have a process to remediate vulnerabilities on a timely basis.'
    },
    {
        id: 'soc2-cc5.1',
        framework_id: 'soc2',
        article: 'CC5.1',
        title: 'Incident Management',
        requirement_text: 'The entity designs and implements procedures to respond to security incidents, including a defined incident response plan. The plan should cover incident detection, initial response, containment, eradication, recovery, and post-incident analysis.'
    }
];


export const mockScans: AuditScan[] = [
  {
    id: 'scan-001',
    user_id: 'user-123',
    framework_id: 'gdpr',
    framework_name: 'GDPR',
    document_name: 'Data_Processing_Policy_v2.pdf',
    status: AuditStatus.Completed,
    findings_count: 2,
    findings: [
        {
            id: 'finding-001',
            audit_scan_id: 'scan-001',
            framework_rule: mockFrameworkRules[0],
            severity: FindingSeverity.High,
            excerpt_from_document: 'We collect user data for marketing and analytics...',
            remediation_advice: 'The policy must explicitly state the contact details of the Data Protection Officer (DPO) as required by GDPR Article 30.',
            paragraph_number: 5,
        },
        {
            id: 'finding-002',
            audit_scan_id: 'scan-001',
            framework_rule: mockFrameworkRules[1],
            severity: FindingSeverity.Medium,
            excerpt_from_document: 'Passwords are stored securely in our database...',
            remediation_advice: 'The policy should specify that encryption is used for personal data, both in transit and at rest, to meet the requirements of GDPR Article 32.',
            paragraph_number: 12,
        }
    ],
    created_at: new Date('2023-10-26T10:00:00Z'),
  },
  {
    id: 'scan-002',
    user_id: 'user-123',
    framework_id: 'hipaa',
    framework_name: 'HIPAA',
    document_name: 'Patient_Data_Handling.docx',
    status: AuditStatus.Completed,
    findings_count: 1,
    findings: [
        {
            id: 'finding-003',
            audit_scan_id: 'scan-002',
            framework_rule: mockFrameworkRules[4], // Corresponds to HIPAA Encryption rule
            severity: FindingSeverity.Medium,
            excerpt_from_document: 'Patient records are transferred between departments via our internal network...',
            remediation_advice: 'The policy must specify that all transfers of ePHI, even on the internal network, must be encrypted to comply with HIPAA technical safeguards.',
            paragraph_number: 8,
        }
    ],
    created_at: new Date('2023-10-27T11:30:00Z'),
  },
];