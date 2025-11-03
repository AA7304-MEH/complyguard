import * as React from 'react';

const SimplePaymentTest: React.FC = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [result, setResult] = React.useState<string>('');

  const testRazorpay = async () => {
    setIsLoading(true);
    setResult('Loading Razorpay SDK...');

    try {
      // Load Razorpay SDK
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      
      script.onload = () => {
        setResult('✅ Razorpay SDK loaded successfully!');
        
        // Test Razorpay initialization
        const options = {
          key: 'rzp_live_R7dfHLEHcCCibm', // Your live key
          amount: 100, // ₹1 for testing
          currency: 'INR',
          name: 'ComplyGuard AI Test',
          description: 'Test Payment',
          handler: function (response: any) {
            setResult(`✅ Payment successful! Payment ID: ${response.razorpay_payment_id}`);
            setIsLoading(false);
          },
          modal: {
            ondismiss: function () {
              setResult('❌ Payment cancelled by user');
              setIsLoading(false);
            }
          }
        };

        try {
          const rzp = new (window as any).Razorpay(options);
          rzp.open();
          setResult('✅ Razorpay payment gateway opened successfully!');
        } catch (error) {
          setResult(`❌ Error creating Razorpay instance: ${error}`);
          setIsLoading(false);
        }
      };

      script.onerror = () => {
        setResult('❌ Failed to load Razorpay SDK');
        setIsLoading(false);
      };

      document.head.appendChild(script);
    } catch (error) {
      setResult(`❌ Error: ${error}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">🧪 Simple Payment Test</h2>
      
      <div className="mb-6">
        <button
          onClick={testRazorpay}
          disabled={isLoading}
          className="w-full py-3 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Testing...
            </div>
          ) : (
            '🧪 Test Razorpay Payment (₹1)'
          )}
        </button>
      </div>

      {result && (
        <div className={`p-4 rounded-lg ${
          result.includes('✅') ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <p className={`text-sm font-medium ${
            result.includes('✅') ? 'text-green-800' : 'text-red-800'
          }`}>
            {result}
          </p>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Test Instructions:</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>1. Click the test button above</p>
          <p>2. Razorpay payment gateway should open</p>
          <p>3. Use test card: 4111 1111 1111 1111</p>
          <p>4. Any future date for expiry</p>
          <p>5. Any 3-digit CVV</p>
        </div>
      </div>

      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-medium text-yellow-900 mb-2">⚠️ Note:</h3>
        <p className="text-sm text-yellow-800">
          This uses live Razorpay keys, so use small amounts (₹1) for testing. 
          The payment will be processed for real.
        </p>
      </div>
    </div>
  );
};

export default SimplePaymentTest;