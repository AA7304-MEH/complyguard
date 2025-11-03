import * as React from 'react';
import { SubscriptionPlan, BillingCycle, PaymentProvider, User } from '../types';
import { SmoothPaymentService } from '../services/smoothPaymentService';
import { getPrice } from '../config/subscriptionPlans';

interface OneClickPaymentProps {
  user: User;
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  onSuccess: (paymentData: any) => void;
  onCancel: () => void;
}

const OneClickPayment: React.FC<OneClickPaymentProps> = ({
  user,
  plan,
  billingCycle,
  onSuccess,
  onCancel,
}) => {
  const [paymentProvider, setPaymentProvider] = React.useState<PaymentProvider>(PaymentProvider.Razorpay);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const isYearly = billingCycle === BillingCycle.Yearly;
  const currency = paymentProvider === PaymentProvider.Razorpay ? 'INR' : 'USD';
  const price = getPrice(plan, isYearly, currency);
  const symbol = currency === 'USD' ? '$' : '₹';

  // Auto-detect optimal provider
  React.useEffect(() => {
    const detectProvider = async () => {
      const optimal = await SmoothPaymentService.detectOptimalProvider();
      setPaymentProvider(optimal);
    };
    detectProvider();
  }, []);

  const handleOneClickPayment = async () => {
    setIsProcessing(true);
    setError(null);
    setProgress(0);

    try {
      // Step 1: Initialize
      setProgress(25);
      setMessage('Initializing secure payment...');
      
      let result;
      if (paymentProvider === PaymentProvider.Razorpay) {
        result = await SmoothPaymentService.processRazorpayPayment(
          plan,
          billingCycle,
          user.id,
          user.email,
          (msg) => setMessage(msg)
        );
      } else {
        result = await SmoothPaymentService.processPayPalPayment(
          plan,
          billingCycle,
          user.id,
          'one-click-paypal-container',
          (msg) => setMessage(msg)
        );
      }

      if (result.success) {
        // Step 2: Create subscription
        setProgress(75);
        setMessage('Activating your subscription...');
        
        const subscription = await SmoothPaymentService.createSubscription(
          user.id,
          plan.id,
          billingCycle,
          paymentProvider,
          result.paymentId
        );

        // Step 3: Complete
        setProgress(100);
        setMessage('Success! Welcome to ComplyGuard AI!');
        
        setTimeout(() => {
          onSuccess({
            provider: paymentProvider,
            paymentId: result.paymentId,
            orderId: result.orderId,
            subscription,
          });
        }, 1500);
      }
    } catch (error: any) {
      setError(error.error || 'Payment failed. Please try again.');
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const switchProvider = () => {
    if (!isProcessing) {
      setPaymentProvider(
        paymentProvider === PaymentProvider.Razorpay 
          ? PaymentProvider.PayPal 
          : PaymentProvider.Razorpay
      );
      setError(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden transform transition-all">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white p-8 text-center">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">One-Click Checkout</h2>
          <p className="text-blue-100">Secure payment in seconds</p>
        </div>

        <div className="p-8">
          {/* Plan Summary */}
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name} Plan</h3>
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {symbol}{price.toLocaleString()}
              <span className="text-lg text-gray-500">/{isYearly ? 'year' : 'month'}</span>
            </div>
            
            {isYearly && (
              <div className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                🎉 Save {symbol}{(getPrice(plan, false, currency) * 12 - price).toLocaleString()} per year!
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {isProcessing && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700">{message}</span>
                <span className="text-sm text-gray-500">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-800">Payment Failed</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                  <button
                    onClick={switchProvider}
                    className="text-sm text-red-600 hover:text-red-800 underline mt-2"
                  >
                    Try {paymentProvider === PaymentProvider.Razorpay ? 'PayPal' : 'Razorpay'} instead
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Payment Provider Selection */}
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentProvider(PaymentProvider.Razorpay)}
                disabled={isProcessing}
                className={`p-4 rounded-xl border-2 transition-all ${
                  paymentProvider === PaymentProvider.Razorpay
                    ? 'border-green-500 bg-green-50 shadow-md'
                    : 'border-gray-200 hover:border-green-300'
                } disabled:opacity-50`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">🇮🇳</div>
                  <div className="font-semibold text-green-700">Razorpay</div>
                  <div className="text-xs text-gray-600">Cards, UPI, Wallets</div>
                </div>
              </button>
              
              <button
                onClick={() => setPaymentProvider(PaymentProvider.PayPal)}
                disabled={isProcessing}
                className={`p-4 rounded-xl border-2 transition-all ${
                  paymentProvider === PaymentProvider.PayPal
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-blue-300'
                } disabled:opacity-50`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">🌍</div>
                  <div className="font-semibold text-blue-700">PayPal</div>
                  <div className="text-xs text-gray-600">Global Cards</div>
                </div>
              </button>
            </div>
          </div>

          {/* PayPal Container (hidden) */}
          <div id="one-click-paypal-container" className="hidden"></div>

          {/* One-Click Payment Button */}
          <button
            onClick={handleOneClickPayment}
            disabled={isProcessing}
            className="w-full py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-105"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                Processing...
              </div>
            ) : (
              <div>
                <div className="text-xl">🚀 Pay {symbol}{price.toLocaleString()} Now</div>
                <div className="text-sm opacity-90">
                  {paymentProvider === PaymentProvider.Razorpay ? 'Razorpay • All Indian Methods' : 'PayPal • Global Cards'}
                </div>
              </div>
            )}
          </button>

          {/* Cancel Button */}
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="w-full mt-4 py-3 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          {/* Security Notice */}
          <div className="mt-6 text-center">
            <div className="flex items-center justify-center text-xs text-gray-500">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              256-bit SSL encryption • PCI compliant
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OneClickPayment;