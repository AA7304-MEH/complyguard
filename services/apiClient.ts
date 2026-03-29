import { AuditScan, AuditStatus, User, SubscriptionTier, SubscriptionStatus, FindingSeverity } from '../types';
import { supabase } from '../lib/supabase';

/**
 * Fetch application user data from Supabase/Usage table
 */
export const getAppUser = async (clerkUserId: string): Promise<User> => {
    const { data: usage, error } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', clerkUserId)
        .single();

    // Default user skeleton (clerk integration provides email/company via props in App.tsx)
    const defaultUser: User = {
        id: clerkUserId,
        email: '', 
        company_name: 'Your Company',
        subscription_tier: SubscriptionTier.Free,
        subscription_status: SubscriptionStatus.Active,
        documents_scanned_this_month: usage?.scan_count_monthly || 0,
        scan_limit_this_month: 2, // Default free limit
    };

    return defaultUser;
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
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to initiate scan');
    }

    return response.json();
};

export const enableAdminMode = async (clerkUserId: string): Promise<User> => {
    // In production, this would be a secure admin-only update.
    // For trial/demo, we allow it to mock enterprise access.
    return {
        id: clerkUserId,
        email: '',
        company_name: 'Admin Enterprise',
        subscription_tier: SubscriptionTier.Enterprise,
        subscription_status: SubscriptionStatus.Active,
        documents_scanned_this_month: 0,
        scan_limit_this_month: -1,
    };
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