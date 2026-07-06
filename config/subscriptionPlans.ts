import { SubscriptionPlan, SubscriptionTier } from '../types';

export const INDIA_PLANS = {
  free: {
    monthly: 0,
    annual: 0,
    label: 'Free',
    scans: 2,
    currency: 'INR',
    symbol: '₹',
    features: [
      '2 compliance scans',
      'GDPR & SOC2 frameworks',
      'Basic PDF reports',
      'Email support'
    ]
  },
  basic: {
    monthly: 799,
    annual: 599,
    label: 'Basic',
    scans: 20,
    currency: 'INR',
    symbol: '₹',
    features: [
      '20 scans per month',
      'All compliance frameworks',
      'Evidence management',
      'Priority email support',
      'Advanced PDF reports'
    ]
  },
  professional: {
    monthly: 1999,
    annual: 1599,
    label: 'Professional',
    scans: 100,
    currency: 'INR',
    symbol: '₹',
    features: [
      '100 scans per month',
      'All frameworks',
      'Team collaboration',
      'Executive PDF reports',
      'Audit trail',
      'Priority support + phone',
      'Compliance heatmap'
    ]
  },
  enterprise: {
    monthly: 4999,
    annual: 3999,
    label: 'Enterprise',
    scans: 999999,
    currency: 'INR',
    symbol: '₹',
    features: [
      'Unlimited scans',
      'All frameworks',
      'White-label reports',
      'Dedicated account manager',
      'Team collaboration',
      'Evidence management',
      'API access',
      'Custom integrations',
      'SLA guarantee'
    ]
  }
}

export const INTERNATIONAL_PLANS = {
  free: {
    monthly: 0,
    annual: 0,
    label: 'Free',
    scans: 2,
    currency: 'USD',
    symbol: '$',
    features: [
      '2 compliance scans',
      'GDPR & SOC2 frameworks',
      'Basic PDF reports',
      'Email support'
    ]
  },
  basic: {
    monthly: 9,
    annual: 7,
    label: 'Basic',
    scans: 20,
    currency: 'USD',
    symbol: '$',
    features: [
      '20 scans per month',
      'All compliance frameworks',
      'Evidence management',
      'Priority email support',
      'Advanced PDF reports'
    ]
  },
  professional: {
    monthly: 29,
    annual: 23,
    label: 'Professional',
    scans: 100,
    currency: 'USD',
    symbol: '$',
    features: [
      '100 scans per month',
      'All frameworks',
      'Team collaboration',
      'Executive PDF reports',
      'Audit trail',
      'Priority support + phone',
      'Compliance heatmap'
    ]
  },
  enterprise: {
    monthly: 99,
    annual: 79,
    label: 'Enterprise',
    scans: 999999,
    currency: 'USD',
    symbol: '$',
    features: [
      'Unlimited scans',
      'All frameworks',
      'White-label reports',
      'Dedicated account manager',
      'Team collaboration',
      'Evidence management',
      'API access',
      'Custom integrations',
      'SLA guarantee'
    ]
  }
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    tier: SubscriptionTier.Free,
    description: 'Perfect for trying out ComplyGuard',
    features: [
      '10 scan credits (One-time)',
      'Basic compliance frameworks',
      'Email support',
      'Standard reporting',
      'Basic document templates',
      'Compliance calendar'
    ],
    scan_limit: 10,
    price_monthly_usd: 0,
    price_yearly_usd: 0,
    price_monthly_inr: 0,
    price_yearly_inr: 0,
  },
  {
    id: 'basic',
    name: 'Basic',
    tier: SubscriptionTier.Basic,
    description: 'Great for small teams and startups',
    features: [
      '50 scan credits',
      'All compliance frameworks',
      'Priority email support',
      'Advanced reporting & analytics',
      'All document templates',
      'Compliance calendar with deadlines',
      'Export to PDF/Excel',
      'API access (5,000 requests/month)',
      'Email notifications'
    ],
    scan_limit: 50,
    price_monthly_usd: 9,
    price_yearly_usd: 84, // 2 months free ($7/month)
    price_monthly_inr: 2400,
    price_yearly_inr: 24000,
    razorpay_plan_id_monthly: 'plan_NkYGNJhqJvGvNu', // Replace with your actual Razorpay plan ID
    razorpay_plan_id_yearly: 'plan_NkYGNJhqJvGvNv', // Replace with your actual Razorpay plan ID
    paypal_plan_id_monthly: 'P-basic-monthly-usd',
    paypal_plan_id_yearly: 'P-basic-yearly-usd',
  },
  {
    id: 'professional',
    name: 'Professional',
    tier: SubscriptionTier.Professional,
    description: 'Perfect for growing businesses',
    features: [
      '200 scan credits',
      'All compliance frameworks',
      'Priority support + phone',
      'Advanced analytics dashboard',
      'Premium document templates',
      'Team collaboration (up to 10 users)',
      'Advanced compliance calendar',
      'Custom compliance rules',
      'API access (25,000 requests/month)',
      'Webhook integrations',
      'White-label reports',
      'Real-time notifications',
      'Export automation'
    ],
    scan_limit: 200,
    price_monthly_usd: 29,
    price_yearly_usd: 276, // 2 months free ($23/month)
    price_monthly_inr: 8200,
    price_yearly_inr: 82000,
    razorpay_plan_id_monthly: 'plan_NkYGNJhqJvGvNw', // Replace with your actual Razorpay plan ID
    razorpay_plan_id_yearly: 'plan_NkYGNJhqJvGvNx', // Replace with your actual Razorpay plan ID
    paypal_plan_id_monthly: 'P-pro-monthly-usd',
    paypal_plan_id_yearly: 'P-pro-yearly-usd',
    is_popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tier: SubscriptionTier.Enterprise,
    description: 'For large organizations with custom needs',
    features: [
      'Unlimited document scans',
      'All compliance frameworks',
      'Dedicated account manager',
      'Enterprise analytics & reporting',
      'Unlimited team members',
      'Custom document templates',
      'Advanced compliance automation',
      'Unlimited API access',
      'Custom integrations & webhooks',
      'On-premise deployment option',
      'Advanced security features',
      'Custom SLA (99.9% uptime)',
      'Training & onboarding',
      'Priority feature requests',
      '24/7 phone support'
    ],
    scan_limit: -1, // Unlimited
    price_monthly_usd: 99,
    price_yearly_usd: 948, // 2 months free ($79/month)
    price_monthly_inr: 41500,
    price_yearly_inr: 415000,
    is_enterprise: true,
  }
];

export const getPlanById = (planId: string): SubscriptionPlan | undefined => {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === planId);
};

export const getPlanByTier = (tier: SubscriptionTier): SubscriptionPlan | undefined => {
  return SUBSCRIPTION_PLANS.find(plan => plan.tier === tier);
};

export const getPrice = (plan: SubscriptionPlan, isYearly: boolean, currency: 'USD' | 'INR'): number => {
  const planId = plan.id as 'free' | 'basic' | 'professional' | 'enterprise';
  if (currency === 'INR') {
    const plansInfo = INDIA_PLANS[planId];
    const rate = isYearly ? plansInfo.annual : plansInfo.monthly;
    return isYearly ? rate * 12 : rate;
  } else {
    const plansInfo = INTERNATIONAL_PLANS[planId];
    const rate = isYearly ? plansInfo.annual : plansInfo.monthly;
    return isYearly ? rate * 12 : rate;
  }
};