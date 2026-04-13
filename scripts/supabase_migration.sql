-- Supabase SQL Migrations for ComplyGuard AI
-- Run this ONCE in the Supabase SQL Editor

-- 1. Scan Jobs Table
CREATE TABLE IF NOT EXISTS public.scan_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    user_email TEXT,
    file_url TEXT,
    pasted_text TEXT,
    framework TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    result JSONB DEFAULT '[]'::jsonb,
    score INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for background worker performance
CREATE INDEX IF NOT EXISTS idx_scan_jobs_status_created ON public.scan_jobs (status, created_at);

-- 2. User Usage Table
CREATE TABLE IF NOT EXISTS public.user_usage (
    user_id TEXT PRIMARY KEY,
    scan_count_monthly INTEGER DEFAULT 0,
    last_scan_date DATE DEFAULT CURRENT_DATE,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. RPC Function: Increment Usage
CREATE OR REPLACE FUNCTION public.increment_usage(x_id TEXT)
RETURNS void AS $$
BEGIN
    INSERT INTO public.user_usage (user_id, scan_count_monthly, last_scan_date)
    VALUES (x_id, 1, CURRENT_DATE)
    ON CONFLICT (user_id)
    DO UPDATE SET 
        scan_count_monthly = public.user_usage.scan_count_monthly + 1,
        last_scan_date = CURRENT_DATE,
        updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- 4. Updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Triggers (safe to re-run)
DROP TRIGGER IF EXISTS tr_scan_jobs_updated_at ON public.scan_jobs;
CREATE TRIGGER tr_scan_jobs_updated_at
BEFORE UPDATE ON public.scan_jobs
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_user_usage_updated_at ON public.user_usage;
CREATE TRIGGER tr_user_usage_updated_at
BEFORE UPDATE ON public.user_usage
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. Add missing columns if upgrading (safe to re-run)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scan_jobs' AND column_name = 'pasted_text') THEN
        ALTER TABLE public.scan_jobs ADD COLUMN pasted_text TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scan_jobs' AND column_name = 'score') THEN
        ALTER TABLE public.scan_jobs ADD COLUMN score INTEGER DEFAULT 0;
    END IF;
END $$;
