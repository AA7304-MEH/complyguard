import * as React from 'react';
import { FunctionalPaymentService } from '../services/functionalPaymentService';
import { PaymentProvider, BillingCycle } from '../types';
import { SUBSCRIPTION_PLANS } from '../config/subscriptionPlans';

const PaymentSystemTest: React.FC = () => {
  const [testResults, setTestResults] = React.useState<string[]>([]);
  const [isTestingRazorpay, setIsTestingRazorpay] = React.useState(false);
  const [isTestingPayPal, setIsTestingPayPal] = React.useState(false);
  const [configStatus, setConfigStatus] = React.useState<any>(null);

  React.useEffect(() => {
    // Check configuration on mount
    const config = FunctionalPaymentService.validateConfiguration();
    setConfigStatus(config);
    
    if (config.valid) {
      addResult('✅ Payment system configuration is valid');
    } else {
      addResult('❌ Payment configuration issues found:');
      config.errors.forEach(error => addResult(`  - ${error}`));
    }
  }, []);

  const addResult = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testRazorpayIntegration = async () => {
    setIsTestingRazorpay(true);
    addResult('🔄 Testing Razorpay integration...');

    try {
      // Test SDK loading
      addResult('Loading Razorpay SDK...');
      await FunctionalPaymentService.loadRazorpaySDK();
      addResult('✅ Razorpay SDK loaded successfully');

      // Test payment processing
      const testPlan = SUBSCRIPTION_PLANS.find(p => p.id === 'basic') || SUBSCRIPTION_PLANS[1];
      addResult(`Testing payment for ${testPlan.name} plan...`);

      const paymentResult = await FunctionalPaymentService.processRazorpayPayment(
        testPlan,
        BillingCycle.Monthly,
        'test@example.com',
        (message) => addResult(`Progress: ${message}`)
      );

      addResult('✅ Razorpay payment test completed successfully!');
      addResult(`Payment ID: ${paymentResult.paymentId}`);
      addResult(`Amount: ₹${paymentResult.amount}`);

    } catch (error: any) {
      addResult(`❌ Razorpay test failed: ${error.error || error.message || 'Unknown error'}`);
    } finally {
      setIsTestingRazorpay(false);
    }
  };

  const testPayPalIntegration = async () => {
    setIsTestingPayPal(true);
    addResult('🔄 Testing PayPal integration...');

    try {
      // Test SDK loading
      addResult('Loading PayPal SDK...');
      await FunctionalPaymentService.loadPayPalSDK();
      addResult('✅ PayPal SDK loaded successfully');

      // Test payment processing
      const testPlan = SUBSCRIPTION_PLANS.find(p => p.id === 'basic') || SUBSCRIPTION_PLANS[1];
      addResult(`Testing payment for ${testPlan.name} plan...`);

      const paymentResult = await FunctionalPaymentService.processPayPalPayment(
        testPlan,
        BillingCycle.Monthly,
        'paypal-test-container',
        (message) => addResult(`Progress: ${message}`)
      );

      addResult('✅ PayPal payment test completed successfully!');
      addResult(`Payment ID: ${paymentResult.paymentId}`);
      addResult(`Amount: $${paymentResult.amount}`);

    } catch (error: any) {
      addResult(`❌ PayPal test failed: ${error.error || error.message || 'Unknown error'}`);
    } finally {
      setIsTestingPayPal(false);
    }
  };

  const testProviderDetection = async () => {
    addResult('🔄 Testing provider detection...');
    
    try {
      const optimalProvider = FunctionalPaymentService.detectOptimalProvider();
      addResult(`✅ Optimal provider detected: ${optimalProvider}`);
      
      const userLocation = await FunctionalPaymentService.getUserLocation();
      addResult(`✅ User location detected: ${userLocation}`);
      
      const recommendedProvider = userLocation === 'IN' ? PaymentProvider.Razorpay : PaymentProvider.PayPal;
      addResult(`✅ Recommended provider: ${recommendedProvider}`);
      
    } catch (error) {
      addResult(`❌ Provider detection failed: ${error}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🧪 Payment System Test Suite</h1>
        <p className="text-gray-600 mb-6">Comprehensive testing for payment integration functionality</p>

        {/* Configuration Status */}
        <div className="mb-6 p-4 rounded-lg border-2 border-dashed border-gray-300">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">⚙️ Configuration Status</h2>
          {configStatus && (
            <div className={`p-3 rounded-lg ${configStatus.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={`font-medium ${configStatus.valid ? 'text-green-800' : 'text-red-800'}`}>
                {configStatus.valid ? '✅ Configuration Valid' : '❌ Configuration Issues'}
              </p>
              {!configStatus.valid && (
                <ul className="mt-2 text-sm text-red-700">
                  {configStatus.errors.map((error: string, index: number) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Test Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <button
            onClick={testRazorpayIntegration}
            disabled={isTestingRazorpay}
            className="p-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isTestingRazorpay ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Testing...
              </div>
            ) : (
              '🇮🇳 Test Razorpay'
            )}
          </button>

          <button
            onClick={testPayPalIntegration}
            disabled={isTestingPayPal}
            className="p-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isTestingPayPal ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Testing...
              </div>
            ) : (
              '🌍 Test PayPal'
            )}
          </button>

          <button
            onClick={testProviderDetection}
            className="p-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            🎯 Test Detection
          </button>

          <button
            onClick={clearResults}
            className="p-4 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            🗑️ Clear Results
          </button>
        </div>

        {/* PayPal Test Container */}
        {isTestingPayPal && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-3">PayPal Test Container:</h3>
            <div id="paypal-test-container" className="min-h-[120px] bg-white rounded border">
              <div className="flex items-center justify-center h-full text-blue-600">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm">PayPal buttons will appear here</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Test Results */}
        <div className="bg-gray-50 rounded-lg border">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">📋 Test Results</h2>
            <span className="text-sm text-gray-500">{testResults.length} entries</span>
          </div>
          <div className="p-4">
            {testResults.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No test results yet. Run a test above to see results.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`text-sm p-3 rounded font-mono ${
                      result.includes('✅') 
                        ? 'bg-green-50 text-green-800 border border-green-200' 
                        : result.includes('❌')
                        ? 'bg-red-50 text-red-800 border border-red-200'
                        : result.includes('🔄')
                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                        : 'bg-gray-50 text-gray-700 border border-gray-200'
                    }`}
                  >
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Environment Information */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-medium text-yellow-900 mb-2">🔧 Environment Information</h3>
          <div className="text-sm text-yellow-800 space-y-1">
            <p><strong>Razorpay:</strong> Live environment (real payments)</p>
            <p><strong>PayPal:</strong> Sandbox environment (test payments)</p>
            <p><strong>Browser:</strong> {navigator.userAgent.split(' ')[0]}</p>
            <p><strong>Timezone:</strong> {Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
            <p><strong>Language:</strong> {navigator.language}</p>
          </div>
        </div>

        {/* Testing Instructions */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">📖 Testing Instructions</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p><strong>Razorpay Test:</strong> Will open real payment gateway - use small amounts for testing</p>
            <p><strong>PayPal Test:</strong> Uses sandbox environment - safe for testing</p>
            <p><strong>Provider Detection:</strong> Tests automatic provider selection based on location</p>
            <p><strong>Configuration:</strong> Validates that all required API keys are present</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSystemTest;