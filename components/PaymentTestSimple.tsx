import * as React from 'react';
import { PaymentProvider, BillingCycle } from '../types';
import { PaymentService } from '../services/paymentService';
import { SUBSCRIPTION_PLANS } from '../config/subscriptionPlans';

const PaymentTestSimple: React.FC = () => {
  const [provider, setProvider] = React.useState<PaymentProvider>(PaymentProvider.Razorpay);
  const [result, setResult] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState(false);

  const testPlan = SUBSCRIPTION_PLANS[1]; // Basic plan
  const mockUser = {
    id: 'test_user_123',
    email: 'test@example.com'
  };

  const testRazorpay = async () => {
    setIsLoading(true);
    setResult('Testing Razorpay...');
    
    try {
      // Test order creation
      const order = await PaymentService.createRazorpayOrder(testPlan, BillingCycle.Monthly, mockUser.id);
      setResult(`✅ Razorpay Order Created: ${order.id}`);
      
      // Test checkout initialization
      PaymentService.initializeRazorpayCheckout(
        order,
        testPlan,
        mockUser.email,
        (response) => {
          setResult(`✅ Razorpay Payment Success: ${response.razorpay_payment_id}`);
          setIsLoading(false);
        },
        (error) => {
          setResult(`❌ Razorpay Error: ${error.reason}`);
          setIsLoading(false);
        }
      );
    } catch (error) {
      setResult(`❌ Razorpay Test Failed: ${error}`);
      setIsLoading(false);
    }
  };

  const testPayPal = () => {
    setIsLoading(true);
    setResult('Testing PayPal...');
    
    PaymentService.initializePayPalCheckout(
      'paypal-test-container',
      testPlan,
      BillingCycle.Monthly,
      mockUser.id,
      (details) => {
        setResult(`✅ PayPal Payment Success: ${details.orderID}`);
        setIsLoading(false);
      },
      (error) => {
        setResult(`❌ PayPal Error: ${error.reason}`);
        setIsLoading(false);
      }
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">🧪 Payment Integration Test</h2>
      
      {/* Provider Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Select Payment Provider:</h3>
        <div className="flex space-x-4">
          <button
            onClick={() => setProvider(PaymentProvider.Razorpay)}
            className={`px-4 py-2 rounded-lg border-2 transition-colors ${
              provider === PaymentProvider.Razorpay
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-300 text-gray-700 hover:border-gray-400'
            }`}
          >
            🇮🇳 Razorpay
          </button>
          <button
            onClick={() => setProvider(PaymentProvider.PayPal)}
            className={`px-4 py-2 rounded-lg border-2 transition-colors ${
              provider === PaymentProvider.PayPal
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 text-gray-700 hover:border-gray-400'
            }`}
          >
            🌍 PayPal
          </button>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Test Payment Integration:</h3>
        <div className="space-y-3">
          <button
            onClick={testRazorpay}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {isLoading && provider === PaymentProvider.Razorpay ? 'Testing...' : '🇮🇳 Test Razorpay Payment'}
          </button>
          
          <button
            onClick={testPayPal}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isLoading && provider === PaymentProvider.PayPal ? 'Testing...' : '🌍 Test PayPal Payment'}
          </button>
        </div>
      </div>

      {/* PayPal Container */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">PayPal Buttons:</h3>
        <div 
          id="paypal-test-container" 
          className="min-h-[100px] border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50"
        >
          <div className="text-center text-gray-500">
            PayPal buttons will appear here when testing
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Test Results:</h3>
        <div className="p-4 bg-gray-100 rounded-lg min-h-[100px]">
          <pre className="text-sm whitespace-pre-wrap">{result || 'No tests run yet'}</pre>
        </div>
      </div>

      {/* Configuration Check */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Configuration Status:</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <div>Razorpay Key: {import.meta.env.VITE_RAZORPAY_KEY_ID ? '✅ Present' : '❌ Missing'}</div>
          <div>PayPal Client ID: {import.meta.env.VITE_PAYPAL_CLIENT_ID ? '✅ Present' : '❌ Missing'}</div>
          <div>Environment: Production</div>
        </div>
      </div>
    </div>
  );
};

export default PaymentTestSimple;