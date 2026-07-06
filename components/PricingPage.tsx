import * as React from 'react';
import { SubscriptionPlan, BillingCycle } from '../types';
import { SUBSCRIPTION_PLANS, INDIA_PLANS, INTERNATIONAL_PLANS } from '../config/subscriptionPlans';
import { detectUserRegion, GeoInfo } from '../services/geoService';
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
}) => {
  const [billingCycle, setBillingCycle] = React.useState<BillingCycle>(BillingCycle.Monthly);
  
  const [geoInfo, setGeoInfo] = React.useState<GeoInfo | null>(null);
  const [plans, setPlans] = React.useState(INTERNATIONAL_PLANS);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function init() {
      const geo = await detectUserRegion();
      setGeoInfo(geo);
      setPlans(geo.region === 'india' ? INDIA_PLANS : INTERNATIONAL_PLANS);
      setLoading(false);
    }
    init();
  }, []);

  const isYearly = billingCycle === BillingCycle.Yearly;

  const formatPriceVal = (planId: string) => {
    const details = plans[planId as keyof typeof plans];
    const priceVal = isYearly ? details.annual : details.monthly;
    if (priceVal === 0) return 'Free';
    return `${details.symbol}${priceVal.toLocaleString()}`;
  };

  const getSavingsVal = (planId: string) => {
    const details = plans[planId as keyof typeof plans];
    if (planId === 'free') return null;
    
    const monthlyCost = details.monthly * 12;
    const yearlyCost = details.annual * 12;
    const savings = monthlyCost - yearlyCost;
    
    return savings > 0 ? `${details.symbol}${savings.toLocaleString()}` : null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/30 py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Location Banner */}
        {geoInfo && (
          <div style={{
            background: plans === INDIA_PLANS ? '#fef3c7' : '#eff6ff',
            border: `1px solid ${plans === INDIA_PLANS ? '#fcd34d' : '#bfdbfe'}`,
            borderRadius: '8px',
            padding: '10px 20px',
            marginBottom: '24px',
            textAlign: 'center',
            fontSize: '14px'
          }}>
            {plans === INDIA_PLANS ? (
              <>🇮🇳 <strong>India Pricing</strong> — Special rates in ₹ INR • Pay via Razorpay UPI, Cards, NetBanking</>
            ) : (
              <>🌍 <strong>International Pricing</strong> — Prices in USD • Pay via PayPal or Card ({geoInfo.country} detected)</>
            )}
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Scale your compliance operations with the right plan for your team's needs. No hidden fees.
          </p>
          
          {/* Modern Billing Toggle */}
          <div className="flex items-center justify-center mt-10 mb-6">
            <div className="bg-slate-100 p-1 rounded-xl inline-flex items-center border border-slate-200/60 shadow-inner">
              <button
                type="button"
                onClick={() => setBillingCycle(BillingCycle.Monthly)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  !isYearly 
                    ? 'bg-white text-slate-800 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle(BillingCycle.Yearly)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  isYearly 
                    ? 'bg-white text-slate-800 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Yearly Billing
                <span className="px-1.5 py-0.5 rounded-md bg-green-100 text-green-700 text-[9px] font-extrabold uppercase tracking-wide">
                  Save 17%
                </span>
              </button>
            </div>
          </div>

          {/* Currency Info & Switch button */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-4">
              {plans === INDIA_PLANS ? '🇮🇳 India pricing • Razorpay UPI accepted' : '🌍 International pricing • PayPal accepted'}
            </div>
            <div>
              <button 
                onClick={() => setPlans(plans === INDIA_PLANS ? INTERNATIONAL_PLANS : INDIA_PLANS)}
                style={{ fontSize: '12px', color: '#6b7280', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {plans === INDIA_PLANS ? 'Switch to USD pricing' : 'Switch to INR pricing'}
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const activePlanDetails = plans[plan.id as keyof typeof plans];
            const savingsVal = getSavingsVal(plan.id);
            const isCurrentPlan = currentPlan?.id === plan.id;
            const isPopular = plan.is_popular;
            
            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl border-2 flex flex-col justify-between p-8 bg-white transition-all duration-300 ${
                  isPopular
                    ? 'border-blue-600 shadow-xl scale-[1.03] z-10'
                    : 'border-slate-200/80 shadow-sm hover:border-slate-300 hover:shadow-md'
                } ${isCurrentPlan ? 'ring-2 ring-blue-600/20' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="inline-flex items-center px-4 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25">
                      <ZapIcon className="w-3.5 h-3.5 mr-1" />
                      Most Popular
                    </span>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-3.5 right-6">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 border border-green-200 text-green-700">
                      Active Plan
                    </span>
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">{plan.name}</h3>
                    <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">{plan.description}</p>
                  </div>
                  
                  <div className="border-t border-slate-100 pt-6">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                        {plan.id === 'free' ? 'Free' : `${formatPriceVal(plan.id)}/month`}
                      </span>
                    </div>
                    {plan.id !== 'free' && (
                      <p className="text-[11px] text-slate-500 font-bold mt-1.5">
                        {plans === INDIA_PLANS ? (
                          <>🇮🇳 India pricing • Razorpay UPI accepted</>
                        ) : (
                          <>🌍 International pricing • PayPal accepted</>
                        )}
                      </p>
                    )}
                    {savingsVal && (
                      <div className="text-xs text-green-600 font-bold mt-2 flex items-center gap-1">
                        <span>✨</span> Save {savingsVal}/year on annual plan
                      </div>
                    )}
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={() => onPlanSelect(plan, billingCycle)}
                      disabled={isCurrentPlan}
                      className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                        isCurrentPlan
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                          : isPopular
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/10 hover:scale-[1.02] active:scale-98'
                          : 'bg-slate-900 hover:bg-slate-800 text-white hover:scale-[1.02] active:scale-98'
                      }`}
                    >
                      {isCurrentPlan ? 'Current Plan' : plan.tier === 'free' ? 'Get Started' : 'Upgrade Plan'}
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-6 space-y-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Included Features</p>
                    <ul className="space-y-3.5">
                      {activePlanDetails.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2.5 mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-slate-600 leading-relaxed font-medium">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {plan.is_enterprise && (
                  <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100/80">
                    <p className="text-xs text-slate-400 text-center font-medium leading-relaxed">
                      Custom volume, single sign-on & dedicated API endpoints.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-24 max-w-4xl mx-auto border-t border-slate-200/60 pt-16">
          <h2 className="text-3xl font-bold text-center text-slate-900 tracking-tight mb-12">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 text-left">
            <div className="space-y-2">
              <h3 className="font-bold text-slate-800 text-base">Can I change plans anytime?</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-slate-800 text-base">What payment methods do you accept?</h3>
              <p className="text-slate-500 text-sm leading-relaxed">We accept Razorpay for Indian customers and PayPal for international payments.</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-slate-800 text-base">Is there a money-back guarantee?</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Yes, we offer a 7-day money-back guarantee for new users who have not utilized more than 1 scan credit.</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-slate-800 text-base">What happens if I exceed my scan limit?</h3>
              <p className="text-slate-500 text-sm leading-relaxed">You'll be notified when approaching your limit and can upgrade your plan or wait for the next billing cycle.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;