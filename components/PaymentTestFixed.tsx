import * as React from 'react';
import { PaymentService } from '../services/paymentService';
import { PaymentProvider, BillingCycle } from '../types';
import { SUBSCRIPTION_PLANS } from '../config/subscriptionPlans';

const PaymentTestFixed: React.FC = () => {
  const [isTestingRazorpay, setIsTestingRazorpay] = React.useState(false);
  const [isTestingPayPal, setIsTestingPayPal] = React.useState(false);
  const [testResults, setTestResults] = React.useState<string[]>([]);
  const [paypalError, setPaypalError] = React.useState<string | null>(null);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testRazorpay = async () => {
    setIsTestingRazorpay(true);
    addResult('🔄 Testing Razorpay integration...');
    
    try {
      const testPlan = SUBSCRIPTION_PLANS.find(p => p.id === 'basic') || SUBSCRIPTION_PLANS[1];
      const order = await PaymentService.createRazorpayOrder(
        testPlan,
        BillingCycle.Monthly,
        'test-user-123'
      );
      
      addResult('✅ Razorpay order created successfully');
      addResult(`Order ID: ${order.id}, Amount: ₹${order.amount / 100}`);
      
      // Test Razorpay checkout initialization
      PaymentService.initializeRazorpayCheckout(
        order,
        testPlan,
        'test@example.com',
        (response) => {
          addResult('✅ Razorpay payment successful!');
          addResult(`Payment ID: ${response.razorpay_payment_id}`);
          setIsTestingRazorpay(false);
        },
        (error) => {
          addResult(`❌ Razorpay error: ${error.reason || 'Unknown error'}`);
          setIsTestingRazorpay(false);
        }
      );
      
    } catch (error) {
      addResult(`❌ Razorpay test failed: ${error}`);
      setIsTestingRazorpay(false);
    }
  };

  const testPayPal = () => {
    setIsTestingPayPal(true);
    setPaypalError(null);
    addResult('🔄 Testing PayPal integration...');
    
    try {
      const testPlan = SUBSCRIPTION_PLANS.find(p => p.id === 'basic') || SUBSCRIPTION_PLANS[1];
      
      PaymentService.initializePayPalCheckout(
        'paypal-test-container',
        testPlan,
        BillingCycle.Monthly,
        'test-user-123',
        (paymentDetails) => {
          addResult('✅ PayPal payment successful!');
          addResult(`Order ID: ${paymentDetails.orderID}, Amount: $${paymentDetails.amount}`);
          setIsTestingPayPal(false);
        },
        (error) => {
          addResult(`❌ PayPal error: ${error.reason || 'Unknown error'}`);
          setPaypalError(error.reason || 'PayPal test failed');
          setIsTestingPayPal(false);
        }
      );
      
    } catch (error) {
      addResult(`❌ PayPal test failed: ${error}`);
      setPaypalError(`PayPal test failed: ${error}`);
      setIsTestingPayPal(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
    setPaypalError(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">🧪 Payment Integration Test</h2>
        <p className="text-gray-600">Test both Razorpay and PayPal payment integrations</p>
      </div>

      {/* Test Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Razorpay Test */}
        <div className="border border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-800 mb-3">🇮🇳 Razorpay Test</h3>
          <p className="text-sm text-gray-600 mb-4">
            Test Razorpay integration with live keys. This will open the actual payment gateway.
          </p>
          <button
            onClick={testRazorpay}
            disabled={isTestingRazorpay}
            className="w-full py-3 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isTestingRazorpay ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Testing Razorpay...
              </div>
            ) : (
              '🧪 Test Razorpay Payment'
            )}
          </button>
        </div>

        {/* PayPal Test */}
        <div className="border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">🌍 PayPal Test</h3>
          <p className="text-sm text-gray-600 mb-4">
            Test PayPal integration with sandbox environment. Safe for testing.
          </p>
          <button
            onClick={testPayPal}
            disabled={isTestingPayPal}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isTestingPayPal ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Testing PayPal...
              </div>
            ) : (
              '🧪 Test PayPal Payment'
            )}
          </button>
        </div>
      </div>

      {/* PayPal Test Container */}
      {isTestingPayPal && (
        <div className="mb-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
          <h4 className="font-medium text-blue-900 mb-3">PayPal Test Buttons:</h4>
          <div id="paypal-test-container" className="min-h-[120px] bg-white rounded border">
            <div className="text-center py-8 text-blue-600">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm">Loading PayPal test buttons...</p>
            </div>
          </div>
          {paypalError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              <strong>Error:</strong> {paypalError}
            </div>
          )}
        </div>
      )}

      {/* Test Results */}
      <div className="border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">📋 Test Results</h3>
          <button
            onClick={clearResults}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            Clear
          </button>
        </div>
        <div className="p-4">
          {testResults.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No test results yet. Click a test button above.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`text-sm p-2 rounded ${
                    result.includes('✅') 
                      ? 'bg-green-50 text-green-800' 
                      : result.includes('❌')
                      ? 'bg-red-50 text-red-800'
                      : 'bg-blue-50 text-blue-800'
                  }`}
                >
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Environment Info */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">🔧 Environment Info</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Razorpay:</strong> Live environment (real payments)</p>
          <p><strong>PayPal:</strong> Sandbox environment (test payments)</p>
          <p><strong>Test Plan:</strong> Basic Plan - $29/month</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-medium text-yellow-800 mb-2">⚠️ Testing Instructions</h4>
        <div className="text-sm text-yellow-700 space-y-1">
          <p><strong>Razorpay:</strong> Will open real payment gateway - use small amounts for testing</p>
          <p><strong>PayPal:</strong> Sandbox environment - use test credentials from PayPal developer dashboard</p>
          <p><strong>Note:</strong> Both integrations are configured and should work properly</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentTestFixed;