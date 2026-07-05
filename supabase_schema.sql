-- ComplyGuard AI Complete Supabase Database Schema
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard) to initialize all tables.

-- 1. Users Profile Table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT,
  scans_used INTEGER DEFAULT 0,
  scan_limit INTEGER DEFAULT 10,
  plan TEXT DEFAULT 'free',
  company_name TEXT DEFAULT 'Your Company',
  company_logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Device Tracking (for free credit abuse prevention)
CREATE TABLE IF NOT EXISTS public.device_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Scan Jobs Table
CREATE TABLE IF NOT EXISTS public.scan_jobs (
  id UUID PRIMARY KEY DEFAULT public.gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_email TEXT,
  file_url TEXT,
  pasted_text TEXT,
  framework TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  result JSONB DEFAULT '[]'::jsonb,
  score INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Evidence Management Table
CREATE TABLE IF NOT EXISTS public.evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id TEXT NOT NULL,
  finding_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  evidence_type TEXT NOT NULL,
  description TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expiry_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending_review',
  reviewer_notes TEXT,
  justification TEXT
);

-- 5. Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id TEXT NOT NULL,
  scan_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_email TEXT,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Severity Overrides Table
CREATE TABLE IF NOT EXISTS public.severity_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id TEXT NOT NULL,
  scan_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  old_severity TEXT NOT NULL,
  new_severity TEXT NOT NULL,
  justification TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Audit Trail Table
CREATE TABLE IF NOT EXISTS public.audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id TEXT NOT NULL,
  finding_id TEXT,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_scan_jobs_status ON public.scan_jobs (status, created_at);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.severity_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;

-- Permissive RLS Policies for Anonymous Client Key access (Clerk Auth is handled at API level)
CREATE POLICY "Allow public select on users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public insert on users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on users" ON public.users FOR UPDATE USING (true);

CREATE POLICY "Allow public select on device_tracking" ON public.device_tracking FOR SELECT USING (true);
CREATE POLICY "Allow public insert on device_tracking" ON public.device_tracking FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select on scan_jobs" ON public.scan_jobs FOR SELECT USING (true);
CREATE POLICY "Allow public insert on scan_jobs" ON public.scan_jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on scan_jobs" ON public.scan_jobs FOR UPDATE USING (true);

CREATE POLICY "Allow public select on evidence" ON public.evidence FOR SELECT USING (true);
CREATE POLICY "Allow public insert on evidence" ON public.evidence FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on evidence" ON public.evidence FOR UPDATE USING (true);

CREATE POLICY "Allow public select on comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Allow public insert on comments" ON public.comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on comments" ON public.comments FOR UPDATE USING (true);

CREATE POLICY "Allow public select on severity_overrides" ON public.severity_overrides FOR SELECT USING (true);
CREATE POLICY "Allow public insert on severity_overrides" ON public.severity_overrides FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on severity_overrides" ON public.severity_overrides FOR UPDATE USING (true);

CREATE POLICY "Allow public select on audit_trail" ON public.audit_trail FOR SELECT USING (true);
CREATE POLICY "Allow public insert on audit_trail" ON public.audit_trail FOR INSERT WITH CHECK (true);
