
export enum SubscriptionTier {
  Free = 'free',
  Basic = 'basic',
  Professional = 'professional',
  Enterprise = 'enterprise',
}

export enum PaymentProvider {
  Razorpay = 'razorpay',
  PayPal = 'paypal',
}

export enum SubscriptionStatus {
  Active = 'active',
  Inactive = 'inactive',
  Cancelled = 'cancelled',
  PastDue = 'past_due',
  Trialing = 'trialing',
}

export enum BillingCycle {
  Monthly = 'monthly',
  Yearly = 'yearly',
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
  subscription_status: SubscriptionStatus;
  documents_scanned_this_month: number;
  scan_limit_this_month: number;
  subscription_start_date?: Date;
  subscription_end_date?: Date;
  trial_end_date?: Date;
  payment_provider?: PaymentProvider;
  customer_id?: string; // Razorpay/PayPal customer ID
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
export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  description: string;
  features: string[];
  scan_limit: number;
  price_monthly_usd: number;
  price_yearly_usd: number;
  price_monthly_inr: number;
  price_yearly_inr: number;
  razorpay_plan_id_monthly?: string;
  razorpay_plan_id_yearly?: string;
  paypal_plan_id_monthly?: string;
  paypal_plan_id_yearly?: string;
  is_popular?: boolean;
  is_enterprise?: boolean;
}

export interface PaymentIntent {
  id: string;
  user_id: string;
  plan_id: string;
  billing_cycle: BillingCycle;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  provider_payment_id?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  created_at: Date;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  current_period_start: Date;
  current_period_end: Date;
  trial_end?: Date;
  provider: PaymentProvider;
  provider_subscription_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Invoice {
  id: string;
  user_id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  invoice_date: Date;
  due_date: Date;
  paid_at?: Date;
  provider_invoice_id?: string;
}

// Enhanced Features Types
export interface ComplianceTemplate {
  id: string;
  name: string;
  description: string;
  framework_id: string;
  category: 'policy' | 'procedure' | 'contract' | 'assessment';
  content: string;
  variables: TemplateVariable[];
  is_premium: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TemplateVariable {
  name: string;
  type: 'text' | 'date' | 'number' | 'select';
  required: boolean;
  options?: string[];
  default_value?: string;
}

export interface Team {
  id: string;
  name: string;
  owner_id: string;
  members: TeamMember[];
  subscription_id: string;
  created_at: Date;
}

export interface TeamMember {
  user_id: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  permissions: Permission[];
  joined_at: Date;
}

export interface Permission {
  resource: 'scans' | 'templates' | 'reports' | 'settings' | 'billing';
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

export interface ComplianceDeadline {
  id: string;
  user_id: string;
  title: string;
  description: string;
  framework_id: string;
  due_date: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigned_to?: string;
  created_at: Date;
}

export interface AnalyticsData {
  user_id: string;
  period: 'week' | 'month' | 'quarter' | 'year';
  total_scans: number;
  compliance_score: number;
  findings_by_severity: {
    high: number;
    medium: number;
    low: number;
  };
  frameworks_used: string[];
  improvement_trend: number;
  generated_at: Date;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'scan_complete' | 'deadline_approaching' | 'payment_due' | 'team_invite' | 'system_update';
  title: string;
  message: string;
  is_read: boolean;
  action_url?: string;
  created_at: Date;
}

export interface APIKey {
  id: string;
  user_id: string;
  name: string;
  key: string;
  permissions: string[];
  last_used?: Date;
  is_active: boolean;
  created_at: Date;
  expires_at?: Date;
}