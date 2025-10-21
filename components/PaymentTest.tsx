import * as React from 'react';
import { PaymentService } from '../services/paymentService';
import { SUBSCRIPTION_PLANS } from '../config/subscriptionPlans';
import { BillingCycle, PaymentProvider } from '../types';

const PaymentTest: React.FC = () => {
  const [testResults, setTestResults] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testPaymentConfiguration = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    addResult('🔍 Starting payment system diagnostics...');
    
    // Test environment variables
    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
    const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
    
    if (razorpayKey) {
      addResult(`✅ Razorpay Key ID found: ${razorpayKey.substring(0, 10)}...`);
    } else {
      addResult('❌ Razorpay Key ID missing from environment variables');
    }
    
    if (paypalClientId) {
      addResult(`✅ PayPal Client ID found: ${paypalClientId.substring(0, 10)}...`);
    } else {
      addResult('❌ PayPal Client ID missing from environment variables');
    }
    
    // Test payment provider detection
    const provider = PaymentService.detectPaymentProvider();
    addResult(`🌍 Detected payment provider: ${provider}`);
    
    // Test payment config
    const config = PaymentService.getPaymentConfig();
    addResult(`💰 Payment config - Provider: ${config.provider}, Currency: ${config.currency}`);
    
    // Test Razorpay order creation
    try {
      addResult('🔄 Testing Razorpay order creation...');
      const testPlan = SUBSCRIPTION_PLANS[1]; // Basic plan
      const order = await PaymentService.createRazorpayOrder(
        testPlan,
        BillingCycle.Monthly,
        'test-user-123'
      );
      addResult(`✅ Razorpay order created successfully: ${order.id}`);
    } catch (error) {
      addResult(`❌ Razorpay order creation failed: ${error}`);
    }
    
    // Test PayPal order creation
    try {
      addResult('🔄 Testing PayPal order creation...');
      const testPlan = SUBSCRIPTION_PLANS[1]; // Basic plan
      const order = await PaymentService.createPayPalOrder(
        testPlan,
        BillingCycle.Monthly,
        'test-user-123'
      );
      addResult(`✅ PayPal order created successfully: ${order.id}`);
    } catch (error) {
      addResult(`❌ PayPal order creation failed: ${error}`);
    }
    
    // Test SDK loading
    addResult('🔄 Testing Razorpay SDK availability...');
    if ((window as any).Razorpay) {
      addResult('✅ Razorpay SDK already loaded');
    } else {
      addResult('⚠️ Razorpay SDK not loaded (will load on demand)');
    }
    
    addResult('🔄 Testing PayPal SDK availability...');
    if ((window as any).paypal) {
      addResult('✅ PayPal SDK already loaded');
    } else {
      addResult('⚠️ PayPal SDK not loaded (will load on demand)');
    }
    
    addResult('✅ Payment system diagnostics completed!');
    setIsLoading(false);
  };

  const testRazorpayPayment = () => {
    addResult('🔄 Testing Razorpay payment flow...');
    
    const testPlan = SUBSCRIPTION_PLANS[1];
    PaymentService.createRazorpayOrder(testPlan, BillingCycle.Monthly, 'test-user-123')
      .then(order => {
        addResult(`✅ Order created: ${order.id}`);
        
        PaymentService.initializeRazorpayCheckout(
          order,
          testPlan,
          'test@example.com',
          (response) => {
            addResult(`✅ Payment successful: ${response.razorpay_payment_id}`);
          },
          (error) => {
            addResult(`❌ Payment failed: ${error.reason || error.description || 'Unknown error'}`);
          }
        );
      })
      .catch(error => {
        addResult(`❌ Order creation failed: ${error.message}`);
      });
  };

  const testPayPalPayment = () => {
    addResult('🔄 Testing PayPal payment flow...');
    
    const testPlan = SUBSCRIPTION_PLANS[1];
    PaymentService.initializePayPalCheckout(
      'paypal-test-container',
      testPlan,
      BillingCycle.Monthly,
      'test-user-123',
      (response) => {
        addResult(`✅ PayPal payment successful: ${response.orderID}`);
      },
      (error) => {
        addResult(`❌ PayPal payment failed: ${error.reason || 'Unknown error'}`);
      }
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Payment System Test Console</h2>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={testPaymentConfiguration}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Running Diagnostics...' : 'Run Payment Diagnostics'}
        </button>
        
        <button
          onClick={testRazorpayPayment}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 ml-2"
        >
          Test Razorpay Payment
        </button>
        
        <button
          onClick={testPayPalPayment}
          className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 ml-2"
        >
          Test PayPal Payment
        </button>
      </div>
      
      {/* PayPal Test Container */}
      <div id="paypal-test-container" className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg">
        <p className="text-gray-500 text-center">PayPal buttons will appear here during testing</p>
      </div>
      
      {/* Results Console */}
      <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
        <div className="mb-2 text-gray-300">Payment System Console:</div>
        {testResults.length === 0 ? (
          <div className="text-gray-500">Click "Run Payment Diagnostics" to start testing...</div>
        ) : (
          testResults.map((result, index) => (
            <div key={index} className="mb-1">
              {result}
            </div>
          ))
        )}
      </div>
      
      {/* Environment Variables Display */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Current Environment Variables:</h3>
        <div className="text-sm space-y-1">
          <div>VITE_RAZORPAY_KEY_ID: {import.meta.env.VITE_RAZORPAY_KEY_ID ? '✅ Set' : '❌ Missing'}</div>
          <div>VITE_PAYPAL_CLIENT_ID: {import.meta.env.VITE_PAYPAL_CLIENT_ID ? '✅ Set' : '❌ Missing'}</div>
          <div>VITE_PAYPAL_ENVIRONMENT: {import.meta.env.VITE_PAYPAL_ENVIRONMENT || 'production'}</div>
        </div>
      </div>
      
      {/* Quick Fixes */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold mb-2 text-yellow-800">Common Payment Issues & Fixes:</h3>
        <div className="text-sm text-yellow-700 space-y-2">
          <div>• <strong>Environment Variables Missing:</strong> Check .env.local file has all VITE_* variables</div>
          <div>• <strong>Razorpay Not Loading:</strong> Check network connectivity and API keys</div>
          <div>• <strong>PayPal Not Loading:</strong> Verify client ID and check browser console for errors</div>
          <div>• <strong>CORS Issues:</strong> Ensure proper domain configuration in payment provider dashboards</div>
          <div>• <strong>SSL Required:</strong> Both providers require HTTPS in production</div>
        </div>
      </div>
    </div>
  );
};

export default PaymentTest;