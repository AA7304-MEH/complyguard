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
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('SUPABASE_ANON_KEY');

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
