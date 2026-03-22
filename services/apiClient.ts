import * as mammoth from 'mammoth';
import { AuditFinding, AuditScan, AuditStatus, Framework, User } from '../types';
import { mockScans, mockFrameworks, mockAppUser, mockFrameworkRules } from './mockData';
import { analyzeCompliance, MultimodalContent } from './geminiService';

// ===================================================================================
// NOTE TO DEVELOPER:
// This file simulates a client for a backend API. In a real-world application,
// this is where you would make `fetch` calls to your server.
//
// The server would be responsible for connecting to your Neon database using the
// connection string you provided. You should NEVER expose your database connection
// string in the frontend code.
// ===================================================================================

const MOCK_API_LATENCY = 500; // ms

// Keys for LocalStorage
const STORAGE_KEY_SCANS = 'complyguard_scans';
const STORAGE_KEY_USER = 'complyguard_user';

// Helper to get data from LocalStorage
const getStoredScans = (): AuditScan[] => {
    const stored = localStorage.getItem(STORAGE_KEY_SCANS);
    if (stored) {
        // We need to revive dates because JSON.stringify converts them to strings
        return JSON.parse(stored, (key, value) => {
            if (key === 'created_at' || key === 'subscription_start_date' || key === 'subscription_end_date') {
                return new Date(value);
            }
            return value;
        });
    }
    return [];
};

const saveStoredScans = (scans: AuditScan[]) => {
    localStorage.setItem(STORAGE_KEY_SCANS, JSON.stringify(scans));
};

const getStoredUser = (): User | null => {
    const stored = localStorage.getItem(STORAGE_KEY_USER);
    if (stored) {
        return JSON.parse(stored, (key, value) => {
            if (key === 'subscription_start_date' || key === 'subscription_end_date') {
                return new Date(value);
            }
            return value;
        });
    }
    return null;
};

const saveStoredUser = (user: User) => {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
};


const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            } else {
                reject(new Error("Failed to read file as base64 string"));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const readDocxAsText = async (file: File): Promise<string> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value || "";
    } catch (error) {
        console.error("Error extracting text from DOCX:", error);
        return "";
    }
};

const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
    });
};

/**
 * Simulates fetching application-specific user data from your database.
 */
export const getAppUser = async (clerkUserId: string): Promise<User> => {
    console.log("Fetching app user data for Clerk user:", clerkUserId);
    await new Promise(resolve => setTimeout(resolve, MOCK_API_LATENCY));

    let user = getStoredUser();
    if (!user) {
        console.log("No user found in storage, initializing with default mock data");
        user = { ...mockAppUser, id: clerkUserId }; // Use the real Clerk ID
        saveStoredUser(user);
    }

    return Promise.resolve(user);
};

/**
 * Simulates fetching all audit scans for the current user.
 */
export const getScans = async (): Promise<AuditScan[]> => {
    console.log('API Client: Fetching scans...');
    await new Promise(resolve => setTimeout(resolve, MOCK_API_LATENCY));

    let scans = getStoredScans();
    if (scans.length === 0) {
        // Optional: Load some initial sample data if empty
        // scans = [...mockScans];
        // saveStoredScans(scans);
    }

    const sortedScans = [...scans].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return Promise.resolve(sortedScans);
};

/**
 * Simulates fetching the available compliance frameworks.
 */
export const getFrameworks = async (): Promise<Framework[]> => {
    await new Promise(resolve => setTimeout(resolve, 100)); // Faster as it's static
    return Promise.resolve(mockFrameworks);
}

/**
 * Creates a new scan record, returns it immediately with 'processing' status,
 * and then kicks off the actual analysis in the background. This provides a
 * responsive UI experience.
 */
export const createScan = async (file: File, frameworkId: string): Promise<AuditScan> => {
    console.log(`API Client: Creating scan for ${file.name} with framework ${frameworkId}`);

    const selectedFramework = mockFrameworks.find(f => f.id === frameworkId);
    const newScan: AuditScan = {
        id: `scan-${crypto.randomUUID()}`,
        user_id: 'user-123', // In a real app, this would be the actual user ID
        framework_id: frameworkId,
        framework_name: selectedFramework?.name || 'Unknown',
        document_name: file.name,
        status: AuditStatus.Processing,
        findings_count: 0,
        findings: [],
        score: 0,
        created_at: new Date(),
    };

    // Get current user to check limits
    const user = getStoredUser();
    if (user) {
        // -1 means unlimited
        if (user.scan_limit_this_month !== -1 && user.documents_scanned_this_month >= user.scan_limit_this_month) {
            throw new Error("SCAN_LIMIT_REACHED");
        }

        // Increment usage count immediately and persist it
        // This simulates the backend updating the record transactionally
        user.documents_scanned_this_month += 1;
        saveStoredUser(user);
        console.log(`API Client: Scan limit updated. ${user.documents_scanned_this_month}/${user.scan_limit_this_month}`);
    }

    // Save initial state
    let currentScans = getStoredScans();
    currentScans = [newScan, ...currentScans];
    saveStoredScans(currentScans);

    // --- Start Real Analysis (async, non-blocking) ---
    const runAnalysisTask = async () => {
        try {
            console.log(`Starting analysis for scan: ${newScan.id}`);
            
            let content: MultimodalContent;
            let documentTextForExcerpt = "";
            const ext = file.name.split('.').pop()?.toLowerCase();

            if (ext === 'pdf') {
                const base64 = await readFileAsBase64(file);
                content = { data: base64, mimeType: 'application/pdf' };
                documentTextForExcerpt = "[PDF Document]";
            } else if (ext === 'docx' || ext === 'doc') {
                documentTextForExcerpt = await readDocxAsText(file);
                content = documentTextForExcerpt;
            } else {
                documentTextForExcerpt = await readFileAsText(file);
                content = documentTextForExcerpt;
            }

            const rules = mockFrameworkRules.filter(r => r.framework_id === frameworkId);
            const allFindings: AuditFinding[] = [];

            if (typeof content !== 'string') {
                // PDF Mode: Process whole document against each rule
                for (const rule of rules) {
                    const finding = await analyzeCompliance(rule, content, 1, newScan.id);
                    if (finding) allFindings.push(finding);
                }
            } else {
                // Text Mode: Process in paragraphs
                let paragraphs = documentTextForExcerpt.split(/\n\s*\n/).filter(p => p.trim().length > 5);
                if (paragraphs.length === 0) {
                    paragraphs = documentTextForExcerpt.split('\n').filter(p => p.trim().length > 5);
                }
                if (paragraphs.length === 0 && documentTextForExcerpt.trim().length > 0) {
                    paragraphs = [documentTextForExcerpt.trim()];
                }
                
                // Process paragraphs (limited to first 10 for performance in this demo)
                const processedParagraphs = paragraphs.slice(0, 10);
                for (let i = 0; i < processedParagraphs.length; i++) {
                    const paragraph = processedParagraphs[i];
                    const analysisPromises = rules.map(rule =>
                        analyzeCompliance(rule, paragraph, i + 1, newScan.id)
                    );

                    const results = await Promise.all(analysisPromises);
                    const findingsForParagraph = results.filter((finding): finding is AuditFinding => finding !== null);
                    allFindings.push(...findingsForParagraph);
                }
            }
            
            // Once all analysis is complete, update the scan record
            const completedScan: AuditScan = {
                ...newScan,
                status: AuditStatus.Completed,
                findings: allFindings,
                findings_count: allFindings.length,
                score: Math.max(0, 100 - (allFindings.length * 5))
            };

            // Update in storage
            currentScans = getStoredScans();
            const index = currentScans.findIndex(s => s.id === newScan.id);
            if (index !== -1) {
                currentScans[index] = completedScan;
                saveStoredScans(currentScans);
                console.log(`API Client: Scan ${newScan.id} processing finished. Found ${allFindings.length} findings.`);
            }
        } catch (error) {
            console.error("Error during scan analysis:", error);
            // Update scan to 'Failed' status if an error occurs
            currentScans = getStoredScans();
            const index = currentScans.findIndex(s => s.id === newScan.id);
            if (index !== -1) {
                currentScans[index].status = AuditStatus.Failed;
                saveStoredScans(currentScans);
            }
        }
    };

    runAnalysisTask(); // Fire and forget
    // --- End Real Analysis ---

    await new Promise(resolve => setTimeout(resolve, MOCK_API_LATENCY));
    return Promise.resolve(newScan); // Return the 'processing' scan immediately
}

export const updateUser = async (user: User): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_API_LATENCY));
    saveStoredUser(user);
    return Promise.resolve(user);
}