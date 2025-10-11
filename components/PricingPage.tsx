import * as React from 'react';
import { SubscriptionPlan, BillingCycle, PaymentProvider } from '../types';
import { SUBSCRIPTION_PLANS, getPrice } from '../config/subscriptionPlans';
import { PaymentService } from '../services/paymentService';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ZapIcon } from './icons/ZapIcon';

interface PricingPageProps {
  currentPlan?: SubscriptionPlan;
  onPlanSelect: (plan: SubscriptionPlan, billingCycle: BillingCycle) => void;
  userLocation?: string;
}

const PricingPage: React.FC<PricingPageProps> = ({ 
  currentPlan, 
  onPlanSelect, 
  userLocation 
}) => {
  const [billingCycle, setBillingCycle] = React.useState<BillingCycle>(BillingCycle.Monthly);
  const [paymentConfig, setPaymentConfig] = React.useState(() => 
    PaymentService.getPaymentConfig(userLocation)
  );

  const isYearly = billingCycle === BillingCycle.Yearly;
  const currency = paymentConfig.currency;

  const formatPrice = (plan: SubscriptionPlan) => {
    const price = getPrice(plan, isYearly, currency);
    if (price === 0) return 'Free';
    
    const symbol = currency === 'USD' ? '$' : '₹';
    const period = isYearly ? 'year' : 'month';
    
    return `${symbol}${price.toLocaleString()}/${period}`;
  };

  const getSavings = (plan: SubscriptionPlan) => {
    if (!isYearly || plan.tier === 'free') return null;
    
    const monthlyPrice = getPrice(plan, false, currency);
    const yearlyPrice = getPrice(plan, true, currency);
    const monthlyCost = monthlyPrice * 12;
    const savings = monthlyCost - yearlyPrice;
    const savingsPercent = Math.round((savings / monthlyCost) * 100);
    
    return { amount: savings, percent: savingsPercent };
  };

  return (
    <div className="min-h-screen bg-secondary py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Scale your compliance operations with the right plan for your needs
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-8">
            <span className={`mr-3 ${!isYearly ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(isYearly ? BillingCycle.Monthly : BillingCycle.Yearly)}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isYearly ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`ml-3 ${isYearly ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
              Yearly
            </span>
            {isYearly && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Save up to 17%
              </span>
            )}
          </div>

          {/* Currency Info */}
          <div className="text-sm text-muted-foreground mb-8">
            Prices shown in {currency} • {paymentConfig.provider === PaymentProvider.Razorpay ? 'Indian' : 'International'} pricing
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const savings = getSavings(plan);
            const isCurrentPlan = currentPlan?.id === plan.id;
            const isPopular = plan.is_popular;
            
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 p-8 ${
                  isPopular
                    ? 'border-accent bg-white shadow-xl scale-105'
                    : 'border-gray-200 bg-white'
                } ${isCurrentPlan ? 'ring-2 ring-accent' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="inline-flex items-center px-4 py-1 rounded-full text-sm font-medium bg-accent text-accent-foreground">
                      <ZapIcon className="w-4 h-4 mr-1" />
                      Most Popular
                    </span>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-4 right-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Current Plan
                    </span>
                  </div>
                )}

                <div className="text-center">
                  <h3 className="text-2xl font-bold text-primary mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground mb-6">{plan.description}</p>
                  
                  <div className="mb-6">
                    <div className="text-4xl font-bold text-primary mb-2">
                      {formatPrice(plan)}
                    </div>
                    {savings && (
                      <div className="text-sm text-green-600 font-medium">
                        Save {currency === 'USD' ? '$' : '₹'}{savings.amount.toLocaleString()} ({savings.percent}%)
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => onPlanSelect(plan, billingCycle)}
                    disabled={isCurrentPlan}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                      isCurrentPlan
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : isPopular
                        ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}
                  >
                    {isCurrentPlan ? 'Current Plan' : plan.tier === 'free' ? 'Get Started' : 'Upgrade Now'}
                  </button>
                </div>

                <div className="mt-8">
                  <h4 className="text-sm font-semibold text-primary mb-4">Features included:</h4>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {plan.is_enterprise && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-muted-foreground text-center">
                      Contact our sales team for custom pricing and enterprise features
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-primary mb-8">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left max-w-4xl mx-auto">
            <div>
              <h3 className="font-semibold text-primary mb-2">Can I change plans anytime?</h3>
              <p className="text-muted-foreground">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
            </div>
            <div>
              <h3 className="font-semibold text-primary mb-2">What payment methods do you accept?</h3>
              <p className="text-muted-foreground">We accept Razorpay for Indian customers and PayPal for international payments.</p>
            </div>
            <div>
              <h3 className="font-semibold text-primary mb-2">Is there a free trial?</h3>
              <p className="text-muted-foreground">Yes, all paid plans come with a 14-day free trial. No credit card required.</p>
            </div>
            <div>
              <h3 className="font-semibold text-primary mb-2">What happens if I exceed my scan limit?</h3>
              <p className="text-muted-foreground">You'll be notified when approaching your limit and can upgrade your plan or wait for the next billing cycle.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;