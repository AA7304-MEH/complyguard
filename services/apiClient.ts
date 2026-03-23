import * as mammoth from 'mammoth';
import { AuditFinding, AuditScan, AuditStatus, Framework, User, SubscriptionTier, SubscriptionStatus, ScanJob, JobStatus } from '../types';
import { mockScans, mockFrameworks, mockAppUser, mockFrameworkRules } from './mockData';
import { analyzeFullDocument, MultimodalContent } from './geminiService';

const MOCK_API_LATENCY = 500;
const STORAGE_KEY_SCANS = 'complyguard_scans';
const STORAGE_KEY_USER = 'complyguard_user';
const STORAGE_KEY_JOBS = 'complyguard_jobs';

// --- Mock "Cloud Storage" for Files ---
// In a real app, this would be S3, Supabase Storage, or Netlify Blobs.
// We use a singleton Map to persist multi-file content in memory between "API" calls.
const MOCK_FILE_STORAGE = new Map<string, MultimodalContent[]>();

// --- Storage Helpers ---
const getStoredScans = (): AuditScan[] => {
    const stored = localStorage.getItem(STORAGE_KEY_SCANS);
    if (stored) {
        return JSON.parse(stored, (key, value) => {
            if (key === 'created_at') return new Date(value);
            return value;
        });
    }
    return [];
};

const saveStoredScans = (scans: AuditScan[]) => {
    localStorage.setItem(STORAGE_KEY_SCANS, JSON.stringify(scans));
};

const getStoredJobs = (): ScanJob[] => {
    const stored = localStorage.getItem(STORAGE_KEY_JOBS);
    if (stored) {
        return JSON.parse(stored, (key, value) => {
            if (key === 'created_at' || key === 'completed_at') return new Date(value);
            return value;
        });
    }
    return [];
};

const saveStoredJobs = (jobs: ScanJob[]) => {
    localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(jobs));
};

const getStoredUser = (): User | null => {
    const stored = localStorage.getItem(STORAGE_KEY_USER);
    if (stored) {
        return JSON.parse(stored, (key, value) => {
            if (key === 'subscription_start_date' || key === 'subscription_end_date') return new Date(value);
            return value;
        });
    }
    return null;
};

const saveStoredUser = (user: User) => {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
};

// --- File Handling Helpers ---
const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result.split(',')[1]);
            } else reject(new Error("Failed to read as base64"));
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const readDocxAsText = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value || "";
};

const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
    });
};

import { rateLimiter } from './rateLimiter';

// --- API Functions ---

export const getAppUser = async (clerkUserId: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_API_LATENCY));
    let user = getStoredUser();
    if (!user) {
        user = { ...mockAppUser, id: clerkUserId };
        saveStoredUser(user);
    }
    return user;
};

export const getScans = async (): Promise<AuditScan[]> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_API_LATENCY));
    const scans = getStoredScans();
    return scans.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const getFrameworks = async (): Promise<Framework[]> => {
    return mockFrameworks;
};

/**
 * Creates a scan. Attempts immediate processing if Gemini API is available.
 * Otherwise, queues as a background job.
 */
export const createScan = async (file: File | File[], frameworkId: string): Promise<AuditScan> => {
    const user = getStoredUser();
    if (user && user.subscription_tier !== SubscriptionTier.Enterprise && user.scan_limit_this_month !== -1 && user.documents_scanned_this_month >= user.scan_limit_this_month) {
        throw new Error("SCAN_LIMIT_REACHED");
    }

    const isArray = Array.isArray(file);
    const mainFile = isArray ? file[0] : file;
    const documentName = isArray ? `${file.length} files` : mainFile.name;
    const scanId = `scan-${crypto.randomUUID()}`;
    const selectedFramework = mockFrameworks.find(f => f.id === frameworkId);
    const frameworkName = selectedFramework?.name || 'Unknown';

    // 1. Process files
    const fileArray = isArray ? file : [file];
    const contents: MultimodalContent[] = [];
    for (const f of fileArray) {
        const ext = f.name.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') {
            const base64 = await readFileAsBase64(f);
            contents.push({ data: base64, mimeType: 'application/pdf' });
        } else if (ext === 'docx' || ext === 'doc') {
            const text = await readDocxAsText(f);
            contents.push(text);
        } else {
            const text = await readFileAsText(f);
            contents.push(text);
        }
    }

    // --- CONDITION: Immediate Processing vs Queue ---
    if (rateLimiter.canMakeRequest()) {
        console.log("Smart Queue: API quota available. Processing scan immediately...");
        try {
            rateLimiter.recordRequest();
            
            // Get rules for immediate analysis
            const rules = mockFrameworkRules.filter(r => 
                r.framework_id.toLowerCase().includes(frameworkName.toLowerCase()) || 
                r.framework_id === frameworkName
            );

            // Execute AI Analysis immediately
            const findings = await analyzeFullDocument(
                frameworkName,
                contents,
                scanId,
                rules,
                "gemini-1.5-pro" // Use Pro for immediate requests
            );

            const score = Math.max(0, 100 - (findings.length * 5));

            const completedScan: AuditScan = {
                id: scanId,
                user_id: user?.id || 'unknown',
                framework_id: frameworkId,
                framework_name: frameworkName,
                document_name: documentName,
                status: AuditStatus.Completed,
                findings_count: findings.length,
                findings: findings,
                score: score,
                created_at: new Date()
            };

            const scans = getStoredScans();
            saveStoredScans([completedScan, ...scans]);

            if (user) {
                user.documents_scanned_this_month += 1;
                saveStoredUser(user);
            }

            return completedScan;

        } catch (error) {
            console.error("Immediate processing failed, falling back to queue:", error);
            // Fall through to queueing logic if immediate fails
        }
    }

    // --- FALLBACK: Queue for Background Worker ---
    console.log("Smart Queue: Rate limit nearing or API busy. Queueing for background worker...");
    const jobId = `job-${crypto.randomUUID()}`;
    
    // Save to our mock "Cloud Storage"
    MOCK_FILE_STORAGE.set(jobId, contents);

    // 2. Create the Scan Job
    const newJob: ScanJob = {
        id: jobId,
        user_id: user?.id || 'unknown',
        file_urls: [`store://${jobId}`], 
        framework: frameworkName,
        status: JobStatus.Pending,
        created_at: new Date()
    };

    const jobs = getStoredJobs();
    saveStoredJobs([newJob, ...jobs]);

    // 3. Create the placeholder Audit Scan
    const newScan: AuditScan = {
        id: scanId,
        user_id: user?.id || 'unknown',
        framework_id: frameworkId,
        framework_name: frameworkName,
        document_name: documentName,
        status: AuditStatus.Queued,
        findings_count: 0,
        findings: [],
        score: 0,
        created_at: new Date(),
        job_id: jobId
    };

    const scans = getStoredScans();
    saveStoredScans([newScan, ...scans]);

    // Update user usage
    if (user) {
        user.documents_scanned_this_month += 1;
        saveStoredUser(user);
    }

    return newScan;
};

// --- Job & Worker Helpers ---

export const getScanJob = async (jobId: string): Promise<ScanJob | null> => {
    const jobs = getStoredJobs();
    return jobs.find(j => j.id === jobId) || null;
};

export const getPendingJob = async (): Promise<ScanJob | null> => {
    const jobs = getStoredJobs();
    // Return the oldest pending job
    return jobs.filter(j => j.status === JobStatus.Pending).sort((a, b) => a.created_at.getTime() - b.created_at.getTime())[0] || null;
};

export const updateScanJob = async (jobId: string, updates: Partial<ScanJob>): Promise<void> => {
    const jobs = getStoredJobs();
    const index = jobs.findIndex(j => j.id === jobId);
    if (index !== -1) {
        jobs[index] = { ...jobs[index], ...updates };
        saveStoredJobs(jobs);

        // If job completed, update the linked Scan
        if (updates.status === JobStatus.Completed || updates.status === JobStatus.Failed) {
            const scans = getStoredScans();
            const scanIndex = scans.findIndex(s => s.job_id === jobId);
            if (scanIndex !== -1) {
                scans[scanIndex].status = updates.status === JobStatus.Completed ? AuditStatus.Completed : AuditStatus.Failed;
                if (updates.result && updates.result.findings) {
                    scans[scanIndex].findings = updates.result.findings;
                    scans[scanIndex].findings_count = updates.result.findings.length;
                    scans[scanIndex].score = updates.result.score || 0;
                }
                saveStoredScans(scans);
            }
        }
    }
};

export const getDocContentForJob = (jobId: string): MultimodalContent[] => {
    return MOCK_FILE_STORAGE.get(jobId) || [];
};

export const enableAdminMode = async (clerkUserId: string): Promise<User> => {
    let user = getStoredUser();
    if (!user) user = { ...mockAppUser, id: clerkUserId };
    user.subscription_tier = SubscriptionTier.Enterprise;
    user.subscription_status = SubscriptionStatus.Active;
    user.scan_limit_this_month = -1;
    saveStoredUser(user);
    return user;
};

export const updateUser = async (user: User): Promise<User> => {
    saveStoredUser(user);
    return user;
};