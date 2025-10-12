import { SubscriptionPlan, SubscriptionTier } from '../types';

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    tier: SubscriptionTier.Free,
    description: 'Perfect for trying out ComplyGuard',
    features: [
      '5 document scans per month',
      'Basic compliance frameworks',
      'Email support',
      'Standard reporting',
      'Basic document templates',
      'Compliance calendar'
    ],
    scan_limit: 5,
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
      '50 document scans per month',
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
    price_monthly_usd: 29,
    price_yearly_usd: 290, // 2 months free
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
      '200 document scans per month',
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
    price_monthly_usd: 99,
    price_yearly_usd: 990, // 2 months free
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
    price_monthly_usd: 499,
    price_yearly_usd: 4990, // 2 months free
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
  if (currency === 'USD') {
    return isYearly ? plan.price_yearly_usd : plan.price_monthly_usd;
  }
  return isYearly ? plan.price_yearly_inr : plan.price_monthly_inr;
};