import * as React from 'react';
import { SubscriptionPlan, BillingCycle, PaymentProvider } from '../types';
import { getPrice } from '../config/subscriptionPlans';

interface PaymentSummaryProps {
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  paymentProvider: PaymentProvider;
  userEmail?: string;
}

const PaymentSummary: React.FC<PaymentSummaryProps> = ({
  plan,
  billingCycle,
  paymentProvider,
  userEmail,
}) => {
  const isYearly = billingCycle === BillingCycle.Yearly;
  const currency = paymentProvider === PaymentProvider.Razorpay ? 'INR' : 'USD';
  const symbol = currency === 'USD' ? '$' : '₹';
  const price = getPrice(plan, isYearly, currency);
  
  const getSavings = () => {
    if (!isYearly) return null;
    
    const monthlyPrice = getPrice(plan, false, currency);
    const yearlyPrice = getPrice(plan, true, currency);
    const monthlyCost = monthlyPrice * 12;
    const savings = monthlyCost - yearlyPrice;
    const savingsPercent = Math.round((savings / monthlyCost) * 100);
    
    return { amount: savings, percent: savingsPercent };
  };

  const savings = getSavings();
  const nextBillingDate = new Date();
  nextBillingDate.setMonth(nextBillingDate.getMonth() + (isYearly ? 12 : 1));

  return (
    <div className="bg-gray-50 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Order Summary</h3>
        <div className="text-sm text-gray-500">
          {paymentProvider === PaymentProvider.Razorpay ? '🇮🇳 India' : '🌍 International'}
        </div>
      </div>
      
      {/* Plan Details */}
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <div className="font-medium text-gray-900">{plan.name} Plan</div>
            <div className="text-sm text-gray-600">{plan.description}</div>
          </div>
          <div className="text-right">
            <div className="font-semibold text-gray-900">
              {symbol}{price.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 capitalize">
              per {billingCycle.toLowerCase()}
            </div>
          </div>
        </div>
        
        {/* Billing Cycle */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Billing Cycle:</span>
          <span className="font-medium capitalize">{billingCycle}</span>
        </div>
        
        {/* Currency */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Currency:</span>
          <span className="font-medium">{currency}</span>
        </div>
        
        {/* Payment Method */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Payment Method:</span>
          <span className="font-medium">
            {paymentProvider === PaymentProvider.Razorpay ? 'Razorpay' : 'PayPal'}
          </span>
        </div>
        
        {/* Account */}
        {userEmail && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Account:</span>
            <span className="font-medium text-blue-600">{userEmail}</span>
          </div>
        )}
        
        {/* Savings */}
        {savings && (
          <div className="flex justify-between text-sm bg-green-50 p-2 rounded">
            <span className="text-green-700 font-medium">Yearly Savings:</span>
            <span className="font-semibold text-green-700">
              {symbol}{savings.amount.toLocaleString()} ({savings.percent}% off)
            </span>
          </div>
        )}
      </div>
      
      <hr className="border-gray-200" />
      
      {/* Total */}
      <div className="flex justify-between items-center">
        <span className="text-lg font-semibold text-gray-900">Total Today:</span>
        <span className="text-2xl font-bold text-blue-600">
          {symbol}{price.toLocaleString()}
        </span>
      </div>
      
      {/* Next Billing */}
      <div className="text-xs text-gray-500 text-center">
        Next billing: {nextBillingDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </div>
      
      {/* Features Preview */}
      <div className="bg-white rounded p-3 border border-gray-200">
        <div className="text-sm font-medium text-gray-900 mb-2">
          ✨ What you'll get:
        </div>
        <div className="space-y-1">
          {plan.features.slice(0, 3).map((feature, index) => (
            <div key={index} className="text-xs text-gray-600 flex items-start">
              <span className="text-green-500 mr-1">✓</span>
              {feature}
            </div>
          ))}
          {plan.features.length > 3 && (
            <div className="text-xs text-gray-500">
              +{plan.features.length - 3} more features
            </div>
          )}
        </div>
      </div>
      
      {/* Security Notice */}
      <div className="bg-green-50 border border-green-200 rounded p-3">
        <div className="flex items-start">
          <div className="text-green-600 mr-2">🔒</div>
          <div className="text-xs text-green-800">
            <div className="font-medium mb-1">Secure Payment</div>
            <div>256-bit SSL encryption • PCI DSS compliant • No card details stored</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSummary;