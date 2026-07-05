import { createClient } from '@supabase/supabase-js';

// Support both Vite (frontend) and Node/Vercel (backend serverless functions)
const getEnvVar = (key: string) => {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
        return process.env[key];
    }
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
        return (import.meta as any).env[key];
    }
    return '';
};

let supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || getEnvVar('SUPABASE_URL');
let supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('SUPABASE_ANON_KEY');

// Force fallback if Vercel has the old stale database configured
if (supabaseUrl && (supabaseUrl.includes('mdiziasnsmwyyeuotiea') || supabaseUrl.includes('xyzcompany') || supabaseUrl.includes('mock-project'))) {
    console.warn("⚠️ Redirecting from stale Supabase URL to verified project");
    supabaseUrl = 'https://gfiljosefyjydpwooxxl.supabase.co';
    supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmaWxqb3NlZnlqeWRwd29veHhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NTIzMzQsImV4cCI6MjA5NDEyODMzNH0.4Fb3juvdKEyNKyCAYb3h84k_Grwks1GxiC0nERCJ1ro';
}

// Robust URL fix and sanitization
if (supabaseUrl) {
    // Remove any trailing junk or concatenated query params that might have leaked into the env var
    supabaseUrl = supabaseUrl.split(/[?#]/)[0].trim();
    
    // If only project ID is provided, expand it
    if (!supabaseUrl.startsWith('http')) {
        supabaseUrl = `https://${supabaseUrl}.supabase.co`;
    }
    
    // Final check for a valid-looking URL structure to prevent net::ERR_NAME_NOT_RESOLVED
    if (supabaseUrl.includes('..') || supabaseUrl.includes(' ') || !supabaseUrl.includes('.supabase.co')) {
        console.warn("⚠️ Mismatched or mangled Supabase URL detected:", supabaseUrl);
        supabaseUrl = ''; // Force mock mode
    }
}

// Safety: If Supabase is broken, don't crash the whole app
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('xyzcompany')) {
    console.warn("⚠️ Supabase credentials missing or invalid. Using local mock mode.");
}

export const supabase = createClient(
    supabaseUrl || 'https://mock-project.supabase.co', 
    supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-key'
);
