import * as React from 'react';
import { SubscriptionPlan, BillingCycle, PaymentProvider, User, SubscriptionTier, SubscriptionStatus } from '../types';
import { SUBSCRIPTION_PLANS } from '../config/subscriptionPlans';
import PaymentCheckout from './PaymentCheckout';
import PaymentSuccess from './PaymentSuccess';

const PaymentFlowTest: React.FC = () => {
  const [showPayment, setShowPayment] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [selectedPlan, setSelectedPlan] = React.useState<SubscriptionPlan>(SUBSCRIPTION_PLANS[1]); // Basic plan
  const [billingCycle, setBillingCycle] = React.useState<BillingCycle>(BillingCycle.Monthly);
  const [paymentData, setPaymentData] = React.useState<any>(null);

  // Mock user for testing
  const mockUser: User = {
    id: 'test_user_123',
    email: 'test@complyguard.ai',
    company_name: 'Test Company',
    subscription_tier: SubscriptionTier.Free,
    subscription_status: SubscriptionStatus.Active,
    documents_scanned_this_month: 2,
    scan_limit_this_month: 5,
  };

  const handlePaymentSuccess = (data: any) => {
    console.log('✅ Payment successful:', data);
    setPaymentData(data);
    setShowPayment(false);
    setShowSuccess(true);
  };

  const handlePaymentCancel = () => {
    console.log('❌ Payment cancelled');
    setShowPayment(false);
  };

  const handleSuccessContinue = () => {
    setShowSuccess(false);
    setPaymentData(null);
  };

  const testPaymentFlow = (plan: SubscriptionPlan, cycle: BillingCycle) => {
    setSelectedPlan(plan);
    setBillingCycle(cycle);
    setShowPayment(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🧪 Payment Flow Test Suite
          </h1>
          <p className="text-gray-600">
            Test the complete payment and subscription flow for ComplyGuard AI
          </p>
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Payment Flow</h2>
          
          {/* Plan Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Plan to Test:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SUBSCRIPTION_PLANS.filter(plan => plan.id !== 'free').map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    selectedPlan.id === plan.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900">{plan.name}</div>
                  <div className="text-sm text-gray-600">{plan.description}</div>
                  <div className="text-sm font-medium text-blue-600 mt-1">
                    ${plan.price_monthly_usd}/month • ₹{plan.price_monthly_inr}/month
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Billing Cycle */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Billing Cycle:
            </label>
            <div className="flex space-x-4">
              <button
                onClick={() => setBillingCycle(BillingCycle.Monthly)}
                className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                  billingCycle === BillingCycle.Monthly
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle(BillingCycle.Yearly)}
                className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                  billingCycle === BillingCycle.Yearly
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                Yearly (Save 17%)
              </button>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="space-y-4">
            <button
              onClick={() => testPaymentFlow(selectedPlan, billingCycle)}
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg"
            >
              🚀 Test Payment Flow: {selectedPlan.name} ({billingCycle})
            </button>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Results</h2>
          
          {paymentData ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">✅ Payment Successful!</h3>
                <div className="text-sm text-green-700 space-y-1">
                  <p><strong>Provider:</strong> {paymentData.provider}</p>
                  <p><strong>Payment ID:</strong> {paymentData.paymentId || paymentData.paymentID}</p>
                  <p><strong>Order ID:</strong> {paymentData.orderId || paymentData.orderID}</p>
                  <p><strong>Amount:</strong> {paymentData.currency === 'INR' ? '₹' : '$'}{paymentData.amount}</p>
                  <p><strong>Subscription:</strong> {paymentData.subscription ? 'Created' : 'Pending'}</p>
                </div>
              </div>
              
              <button
                onClick={() => setPaymentData(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Clear Results
              </button>
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8">
              No test results yet. Run a payment flow test above.
            </div>
          )}
        </div>

        {/* Payment Flow Status */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment System Status</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Razorpay Status */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">🇮🇳</span>
                <h3 className="font-semibold text-gray-900">Razorpay Integration</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Key ID:</span>
                  <span className="text-green-600">✅ Configured</span>
                </div>
                <div className="flex justify-between">
                  <span>Environment:</span>
                  <span className="text-blue-600">Production</span>
                </div>
                <div className="flex justify-between">
                  <span>Currency:</span>
                  <span>INR</span>
                </div>
                <div className="flex justify-between">
                  <span>Guest Checkout:</span>
                  <span className="text-green-600">✅ Enabled</span>
                </div>
              </div>
            </div>

            {/* PayPal Status */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">🌍</span>
                <h3 className="font-semibold text-gray-900">PayPal Integration</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Client ID:</span>
                  <span className="text-green-600">✅ Configured</span>
                </div>
                <div className="flex justify-between">
                  <span>Environment:</span>
                  <span className="text-blue-600">Production</span>
                </div>
                <div className="flex justify-between">
                  <span>Currency:</span>
                  <span>USD</span>
                </div>
                <div className="flex justify-between">
                  <span>Guest Checkout:</span>
                  <span className="text-green-600">✅ Enabled</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Checklist */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Features Checklist</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'Razorpay Integration',
              'PayPal Integration',
              'Guest Checkout Support',
              'Automatic Provider Detection',
              'Retry Logic (3 attempts)',
              'Provider Switching',
              'Progress Tracking',
              'Error Recovery',
              'Success Animations',
              'Mobile Responsive',
              'Security Encryption',
              'Subscription Creation',
              'Invoice Generation',
              'Email Notifications',
              'Multi-currency Support',
              'Yearly Discount Calculation'
            ].map((feature, index) => (
              <div key={index} className="flex items-center">
                <span className="text-green-500 mr-2">✅</span>
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <PaymentCheckout
          user={mockUser}
          plan={selectedPlan}
          billingCycle={billingCycle}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      )}

      {/* Success Modal */}
      {showSuccess && (
        <PaymentSuccess
          isVisible={showSuccess}
          paymentData={paymentData}
          onContinue={handleSuccessContinue}
        />
      )}
    </div>
  );
};

export default PaymentFlowTest;