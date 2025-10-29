import * as React from 'react';
import { PaymentProvider, SubscriptionPlan, BillingCycle } from '../types';
import { getPrice } from '../config/subscriptionPlans';

interface PaymentMethodSelectorProps {
  selectedProvider: PaymentProvider;
  onProviderChange: (provider: PaymentProvider) => void;
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  isProcessing?: boolean;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedProvider,
  onProviderChange,
  plan,
  billingCycle,
  isProcessing = false,
}) => {
  const isYearly = billingCycle === BillingCycle.Yearly;
  
  const paymentMethods = [
    {
      provider: PaymentProvider.Razorpay,
      name: '🇮🇳 Razorpay',
      subtitle: 'Recommended for India',
      currency: 'INR',
      symbol: '₹',
      features: [
        'Any Credit/Debit Card (Visa, Mastercard, RuPay, Amex)',
        'UPI (Google Pay, PhonePe, Paytm, BHIM)',
        'Net Banking (All major banks)',
        'Digital Wallets (Paytm, Mobikwik, Amazon Pay)',
        'EMI options available',
      ],
      benefits: 'Best rates for India • Instant processing',
      color: 'green',
    },
    {
      provider: PaymentProvider.PayPal,
      name: '🌍 PayPal',
      subtitle: 'International',
      currency: 'USD',
      symbol: '$',
      features: [
        'Any Credit/Debit Card (Visa, Mastercard, Amex, Discover)',
        'PayPal Balance (if you have an account)',
        'Bank transfers in supported countries',
        'Buy now, pay later options',
        'Secure guest checkout available',
      ],
      benefits: 'Global acceptance • Buyer protection',
      color: 'blue',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Choose Your Payment Method</h3>
        <div className="text-sm text-blue-600 font-medium animate-pulse">
          ⬇️ Payment button appears below after selection
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paymentMethods.map((method) => {
          const price = getPrice(plan, isYearly, method.currency as 'USD' | 'INR');
          const isSelected = selectedProvider === method.provider;
          
          return (
            <div
              key={method.provider}
              className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                isSelected
                  ? `border-${method.color}-500 bg-${method.color}-50 shadow-md`
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !isProcessing && onProviderChange(method.provider)}
            >
              {/* Selection Indicator */}
              <div className="absolute top-3 right-3">
                <div className={`w-5 h-5 rounded-full border-2 ${
                  isSelected
                    ? `border-${method.color}-500 bg-${method.color}-500`
                    : 'border-gray-300'
                }`}>
                  {isSelected && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Header */}
              <div className="mb-3">
                <div className="font-semibold text-gray-900 mb-1">
                  {method.name}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {method.subtitle}
                </div>
                <div className="flex items-center justify-between">
                  <div className={`text-2xl font-bold text-${method.color}-600`}>
                    {method.symbol}{price.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {method.benefits}
                  </div>
                </div>
              </div>
              
              {/* Features */}
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  💳 Payment Options:
                </div>
                {method.features.slice(0, 3).map((feature, index) => (
                  <div key={index} className="text-xs text-gray-600 flex items-start">
                    <span className="text-green-500 mr-1">•</span>
                    {feature}
                  </div>
                ))}
                {method.features.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{method.features.length - 3} more options
                  </div>
                )}
              </div>
              
              {/* Guest Checkout Notice */}
              <div className={`mt-3 p-2 rounded text-xs ${
                isSelected ? `bg-${method.color}-100 text-${method.color}-800` : 'bg-gray-100 text-gray-600'
              }`}>
                <strong>✅ Guest Checkout:</strong> No {method.provider === PaymentProvider.Razorpay ? 'Razorpay' : 'PayPal'} account needed!
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Additional Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="w-5 h-5 text-blue-600 mr-2 mt-0.5">ℹ️</div>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">💳 Guest Checkout Available</p>
            <p>
              Both payment methods support guest checkout. Simply enter your card details 
              during payment - no need to create accounts with Razorpay or PayPal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodSelector;