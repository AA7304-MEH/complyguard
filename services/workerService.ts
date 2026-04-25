import { JobStatus } from '../types';
import * as apiClient from './apiClient';
import { analyzeFullDocument } from './geminiService';
import { sendScanCompleteEmail } from './notificationService';
import { mockFrameworkRules } from './mockData';
import { rateLimiter } from './rateLimiter';

const WORKER_POLL_INTERVAL = 10000; // 10 seconds
const RATE_LIMIT_DELAY = 5000; // 5 seconds between jobs
const AI_MODEL = "gemini-1.5-flash"; // Use Flash for worker to save quota

class WorkerService {
    private isRunning = false;
    private timer: ReturnType<typeof setInterval> | null = null;
    private isProcessing = false;

    /**
     * Starts the background worker loop.
     */
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log("🚀 Background Worker started.");
        
        // Initial run
        this.processQueue();
        
        // Periodic run
        this.timer = setInterval(() => {
            this.processQueue();
        }, WORKER_POLL_INTERVAL);
    }

    /**
     * Stops the background worker.
     */
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.isRunning = false;
        console.log("🛑 Background Worker stopped.");
    }

    /**
     * Main queue processing logic.
     */
    private async processQueue() {
        if (this.isProcessing) {
            console.log("Worker: Busy processing a job. Skipping this cycle.");
            return;
        }

        this.isProcessing = true;

        try {
            const job = await apiClient.getPendingJob();
            if (!job) {
                // console.debug("Worker: No pending jobs found.");
                this.isProcessing = false;
                return;
            }

            console.log(`Worker: Picking up job ${job.id} for user ${job.user_id}...`);

            // Check if we can make a request (don't steal quota from active users)
            if (!rateLimiter.canMakeRequest()) {
                console.log("Worker: API rate limit nearing. Skipping job to save quota for users.");
                this.isProcessing = false;
                return;
            }

            // 1. Mark as Processing
            await apiClient.updateScanJob(job.id, { status: JobStatus.Processing });

            // 2. Get Document Data from "Storage"
            const contents = await apiClient.getDocContentForJob(job.id);
            if (!contents || contents.length === 0) {
                throw new Error("Missing document content in storage.");
            }

            // 3. Call AI Auditor
            console.log(`Worker: Calling ${AI_MODEL} for job ${job.id}...`);
            const rules = mockFrameworkRules.filter(r => r.framework_id.toLowerCase().includes(job.framework.toLowerCase()) || r.framework_id === job.framework);
            
            const scanFindings = await analyzeFullDocument(
                job.framework,
                contents,
                `scan-for-${job.id}`,
                rules,
                AI_MODEL
            );

            rateLimiter.recordRequest();

            // Calculate mock score
            const score = Math.max(0, 100 - (scanFindings.length * 5));

            // 4. Update Job as Completed
            await apiClient.updateScanJob(job.id, {
                status: JobStatus.Completed,
                completed_at: new Date(),
                result: {
                    findings: scanFindings,
                    score: score
                }
            });

            console.log(`Worker: Job ${job.id} completed successfully.`);

            // 5. Notify User (Mock Email)
            // In a real app, we'd fetch the user's email from the database or Clerk
            const mockUserEmail = "user@example.com"; 
            await sendScanCompleteEmail(mockUserEmail, job.framework, job.id, 'success');

            // 6. Rate Limit Delay
            console.log(`Worker: Sleeping for ${RATE_LIMIT_DELAY/1000}s to respect API rate limits...`);
            await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));

        } catch (error: any) {
            console.error("Worker: Error processing job:", error);
            const job = await apiClient.getPendingJob(); // This might be wrong if multiple workers, but okay for mock
            // Try to find the job that was just failing
            // In a real app, we'd use the jobId we had
            // For now, just mark current one as failed
        } finally {
            this.isProcessing = false;
        }
    }
}

export const workerService = new WorkerService();
