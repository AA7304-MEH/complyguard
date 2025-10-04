
export enum SubscriptionTier {
  Basic = 'basic',
  Professional = 'professional',
  Enterprise = 'enterprise',
}

export enum AuditStatus {
  Processing = 'processing',
  Completed = 'completed',
  Failed = 'failed',
}

export enum FindingSeverity {
  High = 'high',
  Medium = 'medium',
  Low = 'low',
}

export interface User {
  id: string;
  email: string;
  company_name: string;
  subscription_tier: SubscriptionTier;
  documents_scanned_this_month: number;
  scan_limit_this_month: number;
}

export interface Framework {
  id: string;
  name: string;
  version: string;
  description: string;
}

export interface FrameworkRule {
  id: string;
  framework_id: string;
  article: string;
  title: string;
  requirement_text: string;
}

export interface AuditFinding {
  id: string;
  audit_scan_id: string;
  framework_rule: FrameworkRule;
  severity: FindingSeverity;
  excerpt_from_document: string;
  remediation_advice: string;
  paragraph_number: number;
}

export interface AuditScan {
  id: string;
  user_id: string;
  framework_id: string;
  framework_name: string;
  document_name: string;
  status: AuditStatus;
  findings_count: number;
  findings: AuditFinding[];
  created_at: Date;
}
