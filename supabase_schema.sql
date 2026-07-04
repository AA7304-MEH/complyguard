-- ComplyGuard AI Enterprise Evidence Management & Collaboration Schema
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard)

CREATE TABLE IF NOT EXISTS evidence (
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

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id TEXT NOT NULL,
  scan_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_email TEXT,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS severity_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id TEXT NOT NULL,
  scan_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  old_severity TEXT NOT NULL,
  new_severity TEXT NOT NULL,
  justification TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id TEXT NOT NULL,
  finding_id TEXT,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE severity_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;

-- RLS Policies - users only see their own data
CREATE POLICY "Users see own evidence" ON evidence FOR ALL USING (user_id = auth.uid()::text);
CREATE POLICY "Users see own comments" ON comments FOR ALL USING (user_id = auth.uid()::text);
CREATE POLICY "Users see own overrides" ON severity_overrides FOR ALL USING (user_id = auth.uid()::text);
CREATE POLICY "Users see own audit trail" ON audit_trail FOR ALL USING (user_id = auth.uid()::text);
