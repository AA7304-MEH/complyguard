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

let supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || getEnvVar('SUPABASE_URL') || '';
let supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('SUPABASE_ANON_KEY') || '';

// Clean and sanitize URL
if (supabaseUrl) {
    supabaseUrl = supabaseUrl.split(/[?#]/)[0].trim();
    if (!supabaseUrl.startsWith('http')) {
        supabaseUrl = `https://${supabaseUrl}.supabase.co`;
    }
}

// Safety check: if URL is unresolvable or missing, fallback to dummy client
const isValidSupabaseUrl = supabaseUrl && supabaseUrl.includes('.supabase.co') && !supabaseUrl.includes('gfiljosefyjydpwooxxl');

export const supabase = isValidSupabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createClient('https://demo.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo-key-fallback');
