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

// Robust URL fix: If only project ID is provided, expand it
if (supabaseUrl && !supabaseUrl.startsWith('http')) {
    supabaseUrl = `https://${supabaseUrl}.supabase.co`;
}

// Safety: If Supabase is broken, don't crash the whole app
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('xyzcompany')) {
    console.warn("⚠️ Supabase credentials missing or invalid. Using local mock mode.");
}

export const supabase = createClient(
    supabaseUrl || 'https://mock-project.supabase.co', 
    supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-key'
);
