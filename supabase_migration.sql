-- Supabase SQL Migrations for ComplyGuard AI

-- 1. Scan Jobs Table
CREATE TABLE IF NOT EXISTS public.scan_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    user_email TEXT, -- Added for worker notifications
    file_url TEXT,
    framework TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    result JSONB DEFAULT '[]'::jsonb,
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
-- Use: supabase.rpc('increment_usage', { x_id: 'user_123' })
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

-- 4. Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER tr_scan_jobs_updated_at
BEFORE UPDATE ON public.scan_jobs
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER tr_user_usage_updated_at
BEFORE UPDATE ON public.user_usage
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
