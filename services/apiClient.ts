import { AuditScan, AuditStatus, User, SubscriptionTier, SubscriptionStatus, FindingSeverity } from '../types';
import { supabase } from '../lib/supabase';

/**
 * Fetch application user data from Supabase/Usage table
 */
/**
 * Fetch application user data via the unified profile API
 */
export const getAppUser = async (clerkUserId: string, email?: string, deviceId?: string): Promise<User> => {
    const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            userId: clerkUserId, 
            email: email || '', 
            deviceId: deviceId || 'unknown',
            action: 'get_or_init' 
        })
    });

    if (!response.ok) {
        throw new Error('Failed to fetch user profile');
    }

    const profile = await response.json();

    // Map profile DB fields to Frontend User type
    return {
        id: profile.user_id,
        email: profile.email || '', 
        company_name: profile.company_name || 'Your Company',
        subscription_tier: (profile.subscription_tier as SubscriptionTier) || SubscriptionTier.Free,
        subscription_status: (profile.subscription_status as SubscriptionStatus) || SubscriptionStatus.Active,
        credits: profile.credits || 0,
        free_credits_used: profile.free_credits_used || false,
        documents_scanned_this_month: 0, // Tracked separately if needed
        scan_limit_this_month: profile.credits || 0, // For display
    };
};

/**
 * Top up user credits after payment
 */
export const topUpCredits = async (userId: string, amount: number): Promise<any> => {
    const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            userId, 
            amount,
            action: 'add_credits' 
        })
    });

    if (!response.ok) {
        throw new Error('Failed to top up credits');
    }

    return response.json();
};

/**
 * Fetch audit history for a user from scan_jobs table
 */
export const getScans = async (clerkUserId: string): Promise<AuditScan[]> => {
    const { data: jobs, error } = await supabase
        .from('scan_jobs')
        .select('*')
        .eq('user_id', clerkUserId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Failed to fetch scans:", error);
        return [];
    }

    // Map DB scan_jobs to AuditScan frontend type
    return jobs.map(job => ({
        id: job.id,
        user_id: job.user_id,
        framework: job.framework,
        status: job.status as AuditStatus,
        result: job.result,
        score: job.score || 0, // Fallback if not analyzed yet
        file_url: job.file_url,
        created_at: new Date(job.created_at),
        error_message: job.error_message
    }));
};

/**
 * Trigger a new scan via the serverless /api/scan endpoint
 */
export const createScan = async (
    userId: string, 
    framework: string, 
    pastedText?: string,
    email?: string,
    base64File?: string,
    fileName?: string
): Promise<any> => {
    const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId,
            framework,
            pastedText,
            email,
            base64File,
            fileName
        })
    });

    if (!response.ok) {
        let errorMsg = 'Failed to initiate scan';
        try {
            const errData = await response.json();
            errorMsg = errData.message || errData.error || errorMsg;
            if (errData.details) errorMsg += `: ${errData.details}`;
        } catch (e) {
            // Fallback for non-JSON errors
        }
        throw new Error(errorMsg);
    }


    return response.json();
};



export const updateUser = async (user: User): Promise<User> => {
    // Sync local changes (e.g. settings)
    return user;
};

export const getFrameworks = async (): Promise<any[]> => {
    return [
        { id: 'SOC2', name: 'SOC 2 Type II', version: '2017', description: 'Service Organization Control 2' },
        { id: 'ISO27001', name: 'ISO 27001', version: '2022', description: 'Information Security Management' },
        { id: 'GDPR', name: 'GDPR', version: '2018', description: 'General Data Protection Regulation' },
        { id: 'HIPAA', name: 'HIPAA', version: '1996', description: 'Health Insurance Portability and Accountability Act' }
    ];
};

export const getPendingJob = async (): Promise<any> => { return null; };
export const updateScanJob = async (jobId: string, data: any): Promise<any> => { return null; };
export const getDocContentForJob = async (jobId: string): Promise<any> => { return null; };