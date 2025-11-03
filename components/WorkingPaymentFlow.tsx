import * as React from 'react';
import { SubscriptionPlan, BillingCycle, PaymentProvider, User } from '../types';
import { getPrice } from '../config/subscriptionPlans';

interface WorkingPaymentFlowProps {
  user: User;
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  onSuccess: (paymentData: any) => void;
  onCancel: () => void;
}

// Razorpay configuration
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_R7dfHLEHcCCibm';

const WorkingPaymentFlow: React.FC<WorkingPaymentFlowProps> = ({
  user,
  plan,
  billingCycle,
  onSuccess,
  onCancel,
}) => {
  const [paymentProvider, setPaymentProvider] = React.useState<PaymentProvider>(PaymentProvider.Razorpay);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = React.useState('');

  const isYearly = billingCycle === BillingCycle.Yearly;
  const currency = paymentProvider === PaymentProvider.Razorpay ? 'INR' : 'USD';
  const price = getPrice(plan, isYearly, currency);
  const symbol = currency === 'USD' ? '$' : '₹';

  // Load Razorpay SDK
  const loadRazorpaySDK = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if ((window as any).Razorpay) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        console.log('✅ Razorpay SDK loaded successfully');
        resolve();
      };
      script.onerror = () => {
        console.error('❌ Failed to load Razorpay SDK');
        reject(new Error('Failed to load Razorpay SDK'));
      };
      document.head.appendChild(script);
    });
  };

  // Handle Razorpay payment
  const handleRazorpayPayment = async () => {
    setIsProcessing(true);
    setError(null);
    setLoadingMessage('Loading payment gateway...');

    try {
      // Load Razorpay SDK
      await loadRazorpaySDK();
      
      setLoadingMessage('Preparing payment...');
      
      const amount = price * 100; // Convert to paise
      
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: amount,
        currency: 'INR',
        name: 'ComplyGuard AI',
        description: `${plan.name} Plan - AI-Powered Compliance Platform`,
        prefill: {
          name: user.email.split('@')[0],
          email: user.email,
        },
        theme: {
          color: '#2563eb'
        },
        handler: function (response: any) {
          console.log('✅ Payment successful:', response);
          setLoadingMessage('Payment successful! Activating subscription...');
          
          // Simulate subscription activation
          setTimeout(() => {
            onSuccess({
              provider: PaymentProvider.Razorpay,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              amount: price,
              currency: 'INR',
              subscription: {
                user_id: user.id,
                plan_id: plan.id,
                billing_cycle: billingCycle,
                status: 'active',
                created_at: new Date()
              }
            });
          }, 1000);
        },
        modal: {
          ondismiss: function () {
            console.log('❌ Payment cancelled by user');
            setIsProcessing(false);
            setError('Payment was cancelled. You can try again when ready.');
          }
        }
      };

      setLoadingMessage('Opening payment gateway...');
      
      const rzp = new (window as any).Razorpay(options);
      
      rzp.on('payment.failed', function (response: any) {
        console.error('❌ Payment failed:', response.error);
        setIsProcessing(false);
        setError(`Payment failed: ${response.error.description || 'Please try again with a different payment method.'}`);
      });

      rzp.open();
      
    } catch (error) {
      console.error('❌ Payment initialization failed:', error);
      setIsProcessing(false);
      setError('Failed to initialize payment. Please refresh the page and try again.');
    }
  };

  // Handle PayPal payment (simplified version)
  const handlePayPalPayment = async () => {
    setIsProcessing(true);
    setError(null);
    setLoadingMessage('Initializing PayPal...');

    // For now, show a message that PayPal is coming soon
    setTimeout(() => {
      setIsProcessing(false);
      setError('PayPal integration is being finalized. Please use Razorpay for now, which supports all payment methods including international cards.');
    }, 2000);
  };

  const handlePayment = () => {
    if (paymentProvider === PaymentProvider.Razorpay) {
      handleRazorpayPayment();
    } else {
      handlePayPalPayment();
    }
  };

  const getSavings = () => {
    if (!isYearly) return null;
    const monthlyPrice = getPrice(plan, false, currency);
    const yearlyPrice = getPrice(plan, true, currency);
    const monthlyCost = monthlyPrice * 12;
    const savings = monthlyCost - yearlyPrice;
    return savings;
  };

  const savings = getSavings();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Complete Purchase</h2>
              <p className="text-blue-100 text-sm mt-1">Secure checkout with Razorpay</p>
            </div>
            <button
              onClick={onCancel}
              className="text-white hover:text-gray-200 transition-colors"
              disabled={isProcessing}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress Indicator */}
        {isProcessing && (
          <div className="px-6 py-4 bg-blue-50 border-b">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-blue-700 font-medium">{loadingMessage}</span>
            </div>
          </div>
        )}

        <div className="p-6">
          {/* Plan Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-900">{plan.name} Plan</span>
              <span className="text-2xl font-bold text-gray-900">
                {symbol}{price.toLocaleString()}
                <span className="text-sm text-gray-500">/{isYearly ? 'year' : 'month'}</span>
              </span>
            </div>
            
            {savings && savings > 0 && (
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium inline-block mb-3">
                Save {symbol}{savings.toLocaleString()} per year!
              </div>
            )}
            
            <div className="text-sm text-gray-600 space-y-1">
              <p>✅ {plan.scan_limit === -1 ? 'Unlimited' : plan.scan_limit} scans per month</p>
              <p>✅ AI-powered compliance analysis</p>
              <p>✅ Professional dashboard & reports</p>
              {plan.tier !== 'free' && <p>✅ Priority support</p>}
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Payment Method</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentProvider(PaymentProvider.Razorpay)}
                disabled={isProcessing}
                className={`p-3 rounded-lg border-2 transition-all ${
                  paymentProvider === PaymentProvider.Razorpay
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                } disabled:opacity-50`}
              >
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">🇮🇳</div>
                  <div className="text-xs font-medium">Razorpay</div>
                  <div className="text-xs text-gray-500">All Payment Methods</div>
                </div>
              </button>
              
              <button
                onClick={() => setPaymentProvider(PaymentProvider.PayPal)}
                disabled={isProcessing}
                className={`p-3 rounded-lg border-2 transition-all ${
                  paymentProvider === PaymentProvider.PayPal
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                } disabled:opacity-50`}
              >
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">🌍</div>
                  <div className="text-xs font-medium">PayPal</div>
                  <div className="text-xs text-gray-500">Coming Soon</div>
                </div>
              </button>
            </div>
          </div>

          {/* Payment Methods Info */}
          {paymentProvider === PaymentProvider.Razorpay && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="text-sm font-medium text-green-800 mb-2">Razorpay Payment Options:</h4>
              <div className="text-xs text-green-700 space-y-1">
                <p>💳 Credit & Debit Cards (Visa, Mastercard, Rupay)</p>
                <p>📱 UPI (Google Pay, PhonePe, Paytm, etc.)</p>
                <p>🏦 Net Banking (All major banks)</p>
                <p>💰 Digital Wallets (Paytm, Mobikwik, etc.)</p>
                <p>🌍 International Cards Accepted</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-800">Payment Error</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Button */}
          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className={`w-full py-4 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${
              paymentProvider === PaymentProvider.Razorpay
                ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Processing...
              </div>
            ) : (
              <div>
                <div className="text-lg">
                  Pay {symbol}{price.toLocaleString()} with {paymentProvider === PaymentProvider.Razorpay ? 'Razorpay' : 'PayPal'}
                </div>
                <div className="text-sm opacity-90">
                  {paymentProvider === PaymentProvider.Razorpay 
                    ? 'Cards • UPI • Net Banking • Wallets • International Cards'
                    : 'PayPal integration coming soon'
                  }
                </div>
              </div>
            )}
          </button>

          {/* Security Notice */}
          <div className="mt-4 text-center">
            <div className="flex items-center justify-center text-xs text-gray-500">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Secured by Razorpay with 256-bit SSL encryption
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-4 text-center text-xs text-gray-500">
            <p>Need help? Contact support at support@complyguard.ai</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkingPaymentFlow;