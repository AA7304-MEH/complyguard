import * as React from 'react';
import { SubscriptionPlan, BillingCycle, PaymentProvider, User } from '../types';
import { SmoothPaymentService } from '../services/smoothPaymentService';
import { getPrice } from '../config/subscriptionPlans';

interface SmoothPaymentFlowProps {
  user: User;
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  onSuccess: (paymentData: any) => void;
  onCancel: () => void;
}

const SmoothPaymentFlow: React.FC<SmoothPaymentFlowProps> = ({
  user,
  plan,
  billingCycle,
  onSuccess,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [paymentProvider, setPaymentProvider] = React.useState<PaymentProvider>(PaymentProvider.Razorpay);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = React.useState('');

  const isYearly = billingCycle === BillingCycle.Yearly;
  const currency = paymentProvider === PaymentProvider.Razorpay ? 'INR' : 'USD';
  const price = getPrice(plan, isYearly, currency);
  const symbol = currency === 'USD' ? '$' : '₹';

  // Auto-detect optimal payment provider
  React.useEffect(() => {
    const detectProvider = async () => {
      const optimalProvider = await SmoothPaymentService.detectOptimalProvider();
      setPaymentProvider(optimalProvider);
    };
    detectProvider();
  }, []);

  // Auto-initialize PayPal when selected
  React.useEffect(() => {
    if (paymentProvider === PaymentProvider.PayPal && !isProcessing) {
      const container = document.getElementById('smooth-paypal-container');
      if (container) {
        container.innerHTML = `
          <div class="text-center py-4">
            <div class="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p class="text-sm text-blue-600">Loading PayPal...</p>
          </div>
        `;
        
        // Auto-initialize PayPal buttons
        handlePayPalPayment();
      }
    }
  }, [paymentProvider]);

  const updateProgress = (step: number, message: string) => {
    setCurrentStep(step);
    setLoadingMessage(message);
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      if (paymentProvider === PaymentProvider.Razorpay) {
        await handleRazorpayPayment();
      } else {
        await handlePayPalPayment();
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError('Payment initialization failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleRazorpayPayment = async () => {
    try {
      const result = await SmoothPaymentService.processRazorpayPayment(
        plan,
        billingCycle,
        user.id,
        user.email,
        updateProgress
      );
      
      if (result.success) {
        updateProgress('Activating subscription...');
        
        const subscription = await SmoothPaymentService.createSubscription(
          user.id,
          plan.id,
          billingCycle,
          PaymentProvider.Razorpay,
          result.paymentId
        );
        
        updateProgress('Success! Redirecting...');
        
        setTimeout(() => {
          onSuccess({
            provider: PaymentProvider.Razorpay,
            paymentId: result.paymentId,
            orderId: result.orderId,
            subscription,
          });
        }, 1000);
      }
    } catch (error: any) {
      setError(error.error || 'Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const handlePayPalPayment = async () => {
    try {
      const result = await SmoothPaymentService.processPayPalPayment(
        plan,
        billingCycle,
        user.id,
        'smooth-paypal-container',
        updateProgress
      );
      
      if (result.success) {
        updateProgress('Activating subscription...');
        
        const subscription = await SmoothPaymentService.createSubscription(
          user.id,
          plan.id,
          billingCycle,
          PaymentProvider.PayPal,
          result.paymentId
        );
        
        updateProgress('Success! Redirecting...');
        
        setTimeout(() => {
          onSuccess({
            provider: PaymentProvider.PayPal,
            paymentId: result.paymentId,
            orderId: result.orderId,
            subscription,
          });
        }, 1000);
      }
    } catch (error: any) {
      if (!error.error?.includes('cancelled')) {
        setError(error.error || 'PayPal payment failed. Please try Razorpay instead.');
      }
      setIsProcessing(false);
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
              <p className="text-blue-100 text-sm mt-1">Secure checkout in seconds</p>
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

        {/* Progress Steps */}
        {isProcessing && (
          <div className="px-6 py-4 bg-blue-50 border-b">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      step <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
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
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium inline-block">
                Save {symbol}{savings.toLocaleString()} per year!
              </div>
            )}
            
            <div className="mt-3 text-sm text-gray-600">
              <p>✅ {plan.scan_limit === -1 ? 'Unlimited' : plan.scan_limit} scans per month</p>
              <p>✅ AI-powered compliance analysis</p>
              <p>✅ Professional dashboard & reports</p>
              {plan.tier !== 'free' && <p>✅ Priority support</p>}
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Choose Payment Method</h3>
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
                  <div className="text-xs text-gray-500">Cards, UPI, Wallets</div>
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
                  <div className="text-xs text-gray-500">Global Cards</div>
                </div>
              </button>
            </div>
          </div>

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
                  <button
                    onClick={switchProvider}
                    className="text-xs text-red-600 hover:text-red-800 underline mt-2"
                  >
                    Try {paymentProvider === PaymentProvider.Razorpay ? 'PayPal' : 'Razorpay'} instead
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Payment Button */}
          {paymentProvider === PaymentProvider.Razorpay ? (
            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Processing...
                </div>
              ) : (
                <div>
                  <div className="text-lg">Pay ₹{price.toLocaleString()} with Razorpay</div>
                  <div className="text-sm opacity-90">Cards • UPI • Net Banking • Wallets</div>
                </div>
              )}
            </button>
          ) : (
            <div>
              <div className="text-center mb-3">
                <p className="text-sm font-medium text-gray-700">Pay ${price.toLocaleString()} with PayPal</p>
                <p className="text-xs text-gray-500">Credit cards, PayPal balance, or buy now pay later</p>
              </div>
              <div id="smooth-paypal-container" className="min-h-[60px]">
                <div className="text-center py-4">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm text-blue-600">Loading PayPal...</p>
                </div>
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="mt-4 text-center">
            <div className="flex items-center justify-center text-xs text-gray-500">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Secured by 256-bit SSL encryption
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmoothPaymentFlow;