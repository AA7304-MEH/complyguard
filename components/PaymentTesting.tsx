import * as React from 'react';
import { User, SubscriptionPlan, BillingCycle, PaymentProvider } from '../types';
import { SUBSCRIPTION_PLANS } from '../config/subscriptionPlans';
import PaymentCheckout from './PaymentCheckout';

interface PaymentTestingProps {
  user: User;
}

const PaymentTesting: React.FC<PaymentTestingProps> = ({ user }) => {
  const [showCheckout, setShowCheckout] = React.useState(false);
  const [selectedPlan, setSelectedPlan] = React.useState<SubscriptionPlan>(SUBSCRIPTION_PLANS[1]); // Basic plan
  const [billingCycle, setBillingCycle] = React.useState<BillingCycle>(BillingCycle.Monthly);
  const [testResults, setTestResults] = React.useState<any[]>([]);

  const handlePaymentSuccess = (paymentData: any) => {
    const result = {
      timestamp: new Date().toISOString(),
      status: 'SUCCESS',
      provider: paymentData.provider,
      paymentId: paymentData.paymentId,
      plan: selectedPlan.name,
      billingCycle,
      amount: paymentData.amount || 'Test amount',
    };
    
    setTestResults(prev => [result, ...prev]);
    setShowCheckout(false);
    
    // Show success message
    alert(`✅ Payment Test Successful!\n\nProvider: ${paymentData.provider}\nPayment ID: ${paymentData.paymentId}\nPlan: ${selectedPlan.name}`);
  };

  const handlePaymentError = (error: any) => {
    const result = {
      timestamp: new Date().toISOString(),
      status: 'FAILED',
      error: error.reason || 'Unknown error',
      plan: selectedPlan.name,
      billingCycle,
    };
    
    setTestResults(prev => [result, ...prev]);
    console.error('Payment test failed:', error);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">Payment Integration Testing</h2>
          <p className="text-gray-600 mt-1">Test payment flows with different providers and plans</p>
        </div>
      </div>

      {/* Test Configuration */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-primary mb-4">Test Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Plan</label>
            <select
              value={selectedPlan.id}
              onChange={(e) => setSelectedPlan(SUBSCRIPTION_PLANS.find(p => p.id === e.target.value) || SUBSCRIPTION_PLANS[1])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
            >
              {SUBSCRIPTION_PLANS.filter(p => p.tier !== 'free').map(plan => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - ${plan.price_monthly_usd}/month
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Billing Cycle</label>
            <select
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
            >
              <option value={BillingCycle.Monthly}>Monthly</option>
              <option value={BillingCycle.Yearly}>Yearly</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setShowCheckout(true)}
              className="w-full px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
            >
              Test Payment Flow
            </button>
          </div>
        </div>

        {/* Payment Method Support */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-3">🇮🇳 Razorpay (India)</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>✅ Credit/Debit Cards (No account needed)</p>
              <p>✅ UPI (Google Pay, PhonePe, Paytm)</p>
              <p>✅ Net Banking (All major banks)</p>
              <p>✅ Digital Wallets</p>
              <p>✅ EMI Options</p>
              <p>✅ Guest Checkout Available</p>
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-3">🌍 PayPal (International)</h4>
            <div className="text-sm text-green-800 space-y-1">
              <p>✅ Credit/Debit Cards (No account needed)</p>
              <p>✅ PayPal Balance</p>
              <p>✅ Bank Transfers</p>
              <p>✅ Buy Now, Pay Later</p>
              <p>✅ Guest Checkout Available</p>
              <p>✅ Global Currency Support</p>
            </div>
          </div>
        </div>
      </div>

      {/* Test Results */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-primary mb-4">Test Results</h3>
        
        {testResults.length > 0 ? (
          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  result.status === 'SUCCESS' 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`font-medium ${
                      result.status === 'SUCCESS' ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {result.status === 'SUCCESS' ? '✅ SUCCESS' : '❌ FAILED'}
                    </span>
                    <span className="text-gray-600 ml-2">
                      {result.plan} ({result.billingCycle})
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                {result.status === 'SUCCESS' && (
                  <div className="mt-2 text-sm text-gray-600">
                    <p>Provider: {result.provider}</p>
                    <p>Payment ID: {result.paymentId}</p>
                  </div>
                )}
                
                {result.status === 'FAILED' && (
                  <div className="mt-2 text-sm text-red-700">
                    <p>Error: {result.error}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No test results yet. Run a payment test to see results here.</p>
          </div>
        )}
      </div>

      {/* Testing Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-900 mb-3">💡 Testing Instructions</h3>
        <div className="text-sm text-yellow-800 space-y-2">
          <p><strong>For Razorpay Testing:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Use test card: 4111 1111 1111 1111</li>
            <li>Any future expiry date</li>
            <li>Any 3-digit CVV</li>
            <li>Test UPI ID: success@razorpay</li>
          </ul>
          
          <p className="mt-4"><strong>For PayPal Testing:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Use PayPal sandbox account</li>
            <li>Or test with guest checkout</li>
            <li>Test card: 4032 0324 1234 5678</li>
          </ul>
          
          <p className="mt-4"><strong>Production Testing:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Use small amounts (₹1 or $0.01)</li>
            <li>Test both guest checkout and account login</li>
            <li>Verify subscription activation</li>
          </ul>
        </div>
      </div>

      {/* Payment Checkout Modal */}
      {showCheckout && (
        <PaymentCheckout
          user={user}
          plan={selectedPlan}
          billingCycle={billingCycle}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowCheckout(false)}
        />
      )}
    </div>
  );
};

export default PaymentTesting;