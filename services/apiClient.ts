import { AuditFinding, AuditScan, AuditStatus, Framework, User } from '../types';
import { mockScans, mockFrameworks, mockAppUser, mockFrameworkRules } from './mockData';
import { analyzeCompliance } from './geminiService';

// ===================================================================================
// NOTE TO DEVELOPER:
// This file simulates a client for a backend API. In a real-world application,
// this is where you would make `fetch` calls to your server.
//
// The server would be responsible for connecting to your Neon database using the
// connection string you provided. You should NEVER expose your database connection
// string in the frontend code.
//
// EXAMPLE (on your Node.js backend):
//
// import { Pool } from 'pg';
//
// // Store your Neon connection string in environment variables on the server
// const pool = new Pool({
//   connectionString: process.env.NEON_DATABASE_URL, 
// });
//
// // Your API endpoint to get scans would look something like this:
// app.get('/api/scans', async (req, res) => {
//   const { rows } = await pool.query('SELECT * FROM audit_scans WHERE user_id = $1', [req.user.id]);
//   res.json(rows);
// });
// ===================================================================================

const MOCK_API_LATENCY = 500; // ms

// In-memory store to simulate database changes
let dbScans: AuditScan[] = [...mockScans];

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
  return Promise.resolve(mockAppUser);
};

/**
 * Simulates fetching all audit scans for the current user.
 */
export const getScans = async (): Promise<AuditScan[]> => {
    console.log('API Client: Fetching scans...');
    await new Promise(resolve => setTimeout(resolve, MOCK_API_LATENCY));
    const sortedScans = [...dbScans].sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
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
        user_id: 'user-123',
        framework_id: frameworkId,
        framework_name: selectedFramework?.name || 'Unknown',
        document_name: file.name,
        status: AuditStatus.Processing,
        findings_count: 0,
        findings: [],
        created_at: new Date(),
    };
    
    dbScans = [newScan, ...dbScans];

    // --- Start Real Analysis (async, non-blocking) ---
    const runAnalysis = async () => {
        try {
            console.log(`Starting analysis for scan: ${newScan.id}`);
            const documentText = await readFileAsText(file);
            const paragraphs = documentText.split('\n').filter(p => p.trim().length > 10); // Split by lines and filter out empty ones
            const rules = mockFrameworkRules.filter(r => r.framework_id === frameworkId);
            const allFindings: AuditFinding[] = [];

            // Process paragraphs in chunks to avoid overwhelming the browser or API rate limits
            for (let i = 0; i < paragraphs.length; i++) {
                const paragraph = paragraphs[i];
                console.log(`Analyzing paragraph ${i + 1} of ${paragraphs.length}`);
                
                const analysisPromises = rules.map(rule => 
                    analyzeCompliance(rule, paragraph, i + 1, newScan.id)
                );

                const results = await Promise.all(analysisPromises);
                const findingsForParagraph = results.filter((finding): finding is AuditFinding => finding !== null);
                
                if (findingsForParagraph.length > 0) {
                    allFindings.push(...findingsForParagraph);
                }
            }

            // Once all analysis is complete, update the scan record
            const completedScan: AuditScan = {
                ...newScan,
                status: AuditStatus.Completed,
                findings: allFindings,
                findings_count: allFindings.length,
            };

            const index = dbScans.findIndex(s => s.id === newScan.id);
            if (index !== -1) {
                dbScans[index] = completedScan;
                console.log(`API Client: Scan ${newScan.id} processing finished. Found ${allFindings.length} findings.`);
            }
        } catch (error) {
            console.error("Error during scan analysis:", error);
            // Update scan to 'Failed' status if an error occurs
            const index = dbScans.findIndex(s => s.id === newScan.id);
            if (index !== -1) {
                dbScans[index].status = AuditStatus.Failed;
            }
        }
    };
    
    runAnalysis(); // Fire and forget
    // --- End Real Analysis ---

    await new Promise(resolve => setTimeout(resolve, MOCK_API_LATENCY));
    return Promise.resolve(newScan); // Return the 'processing' scan immediately
}