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

// Create a safe mock client if Supabase URL is not configured to prevent ERR_NAME_NOT_RESOLVED network errors
const createMockSupabaseClient = () => {
    const builder: any = {
        select: () => builder,
        insert: () => builder,
        update: () => builder,
        delete: () => builder,
        upsert: () => builder,
        eq: () => builder,
        order: () => builder,
        limit: () => builder,
        single: () => Promise.resolve({ data: null, error: null }),
        then: (resolve: any) => resolve({ data: [], error: null })
    };

    return {
        from: () => builder,
        auth: {
            getUser: () => Promise.resolve({ data: { user: null }, error: null }),
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
        }
    };
};

const isValidSupabaseUrl = Boolean(supabaseUrl && supabaseUrl.includes('.supabase.co') && !supabaseUrl.includes('gfiljosefyjydpwooxxl') && !supabaseUrl.includes('demo.supabase.co'));

export const supabase: any = (isValidSupabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createMockSupabaseClient();
