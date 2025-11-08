import * as React from 'react';
import { SubscriptionPlan, BillingCycle, PaymentProvider, User } from '../types';
import { FunctionalPaymentService, PaymentResult } from '../services/functionalPaymentService';
import { getPrice } from '../config/subscriptionPlans';

interface FunctionalPaymentFlowProps {
  user: User;
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  onSuccess: (paymentData: any) => void;
  onCancel: () => void;
}

const FunctionalPaymentFlow: React.FC<FunctionalPaymentFlowProps> = ({
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
  const [currentStep, setCurrentStep] = React.useState(1);

  const isYearly = billingCycle === BillingCycle.Yearly;
  const currency = paymentProvider === PaymentProvider.Razorpay ? 'INR' : 'USD';
  const price = getPrice(plan, isYearly, currency);
  const symbol = currency === 'USD' ? '$' : '₹';

  const [detectedLocation, setDetectedLocation] = React.useState<string>('');
  const [isDetecting, setIsDetecting] = React.useState(true);

  // Auto-detect optimal payment provider on mount
  React.useEffect(() => {
    const detectProvider = async () => {
      setIsDetecting(true);
      try {
        const location = await FunctionalPaymentService.getUserLocation();
        setDetectedLocation(location);
        
        // Smart provider selection based on location
        let optimalProvider: PaymentProvider;
        if (location === 'IN') {
          optimalProvider = PaymentProvider.Razorpay;
        } else {
          optimalProvider = PaymentProvider.PayPal;
        }
        
        setPaymentProvider(optimalProvider);
        console.log(`🎯 Location: ${location}, Provider: ${optimalProvider}`);
      } catch (error) {
        const fallbackProvider = FunctionalPaymentService.detectOptimalProvider();
        setPaymentProvider(fallbackProvider);
        setDetectedLocation('Unknown');
        console.log(`🎯 Using fallback provider: ${fallbackProvider}`);
      } finally {
        setIsDetecting(false);
      }
    };
    
    detectProvider();
  }, []);

  const updateProgress = (step: number, message: string) => {
    setCurrentStep(step);
    setLoadingMessage(message);
  };

  const handleRazorpayPayment = async () => {
    setIsProcessing(true);
    setError(null);
    updateProgress(1, 'Initializing Razorpay payment...');

    try {
      const paymentResult = await FunctionalPaymentService.processRazorpayPayment(
        plan,
        billingCycle,
        user.email,
        (message) => updateProgress(2, message)
      );

      updateProgress(3, 'Payment successful! Creating subscription...');

      const subscription = await FunctionalPaymentService.createSubscription(
        user.id,
        plan.id,
        billingCycle,
        paymentResult
      );

      updateProgress(4, 'Success! Redirecting to dashboard...');

      setTimeout(() => {
        onSuccess({
          provider: PaymentProvider.Razorpay,
          paymentId: paymentResult.paymentId,
          orderId: paymentResult.orderId,
          amount: paymentResult.amount,
          currency: paymentResult.currency,
          subscription
        });
      }, 1500);

    } catch (error: any) {
      console.error('❌ Razorpay payment error:', error);
      setError(error.error || 'Payment failed. Please try again.');
      setIsProcessing(false);
      setCurrentStep(1);
    }
  };

  const handlePayPalPayment = async () => {
    setIsProcessing(true);
    setError(null);
    updateProgress(1, 'Initializing PayPal payment...');

    try {
      const paymentResult = await FunctionalPaymentService.processPayPalPayment(
        plan,
        billingCycle,
        'paypal-button-container',
        (message) => updateProgress(2, message)
      );

      updateProgress(3, 'Payment successful! Creating subscription...');

      const subscription = await FunctionalPaymentService.createSubscription(
        user.id,
        plan.id,
        billingCycle,
        paymentResult
      );

      updateProgress(4, 'Success! Redirecting to dashboard...');

      setTimeout(() => {
        onSuccess({
          provider: PaymentProvider.PayPal,
          paymentId: paymentResult.paymentId,
          orderId: paymentResult.orderId,
          amount: paymentResult.amount,
          currency: paymentResult.currency,
          subscription
        });
      }, 1500);

    } catch (error: any) {
      console.error('❌ PayPal payment error:', error);
      setError(error.error || 'PayPal payment failed. Please try Razorpay instead.');
      setIsProcessing(false);
      setCurrentStep(1);
    }
  };

  const handlePayment = () => {
    if (paymentProvider === PaymentProvider.Razorpay) {
      handleRazorpayPayment();
    } else {
      handlePayPalPayment();
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
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Complete Your Purchase</h2>
              <p className="text-blue-100 text-sm mt-1">Secure payment processing</p>
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
            <div className="flex items-center space-x-3">
              <div className="flex space-x-1">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      step <= currentStep 
                        ? 'bg-blue-600 scale-110' 
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                <span className="text-sm text-blue-700 font-medium">{loadingMessage}</span>
              </div>
            </div>
          </div>
        )}

        <div className="p-6">
          {/* Plan Summary */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-5 mb-6 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{plan.name} Plan</h3>
                <p className="text-sm text-gray-600">{billingCycle} billing</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">
                  {symbol}{price.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">
                  /{isYearly ? 'year' : 'month'}
                </div>
              </div>
            </div>
            
            {savings && savings > 0 && (
              <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm font-medium inline-block mb-3">
                💰 Save {symbol}{savings.toLocaleString()} per year!
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
              <div className="flex items-center">
                <span className="text-green-600 mr-2">✅</span>
                {plan.scan_limit === -1 ? 'Unlimited' : plan.scan_limit} scans/month
              </div>
              <div className="flex items-center">
                <span className="text-green-600 mr-2">✅</span>
                AI-powered analysis
              </div>
              <div className="flex items-center">
                <span className="text-green-600 mr-2">✅</span>
                Professional reports
              </div>
              <div className="flex items-center">
                <span className="text-green-600 mr-2">✅</span>
                {plan.tier !== 'free' ? 'Priority support' : 'Email support'}
              </div>
            </div>
          </div>

          {/* Auto-Detection Indicator */}
          {detectedLocation && !isDetecting && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center text-sm text-blue-800">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>
                  <strong>Auto-detected location:</strong> {detectedLocation === 'IN' ? '🇮🇳 India' : detectedLocation === 'US' ? '🇺🇸 United States' : `🌍 ${detectedLocation}`}
                  {' • '}
                  <strong>Recommended:</strong> {paymentProvider === PaymentProvider.Razorpay ? 'Razorpay' : 'PayPal'}
                </span>
              </div>
            </div>
          )}

          {/* Payment Method Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Payment Method</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setPaymentProvider(PaymentProvider.Razorpay)}
                disabled={isProcessing}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  paymentProvider === PaymentProvider.Razorpay
                    ? 'border-green-500 bg-green-50 shadow-md'
                    : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                } disabled:opacity-50`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">🇮🇳</div>
                  <div className="font-semibold text-gray-900">Razorpay</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Cards • UPI • Wallets • Net Banking
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setPaymentProvider(PaymentProvider.PayPal)}
                disabled={isProcessing}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  paymentProvider === PaymentProvider.PayPal
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                } disabled:opacity-50`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">🌍</div>
                  <div className="font-semibold text-gray-900">PayPal</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Global Cards • PayPal Balance
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Payment Method Details */}
          {paymentProvider === PaymentProvider.Razorpay && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">🇮🇳 Razorpay Payment Options:</h4>
              <div className="text-sm text-green-700 space-y-1">
                <p>💳 All Credit & Debit Cards (Visa, Mastercard, RuPay)</p>
                <p>📱 UPI (Google Pay, PhonePe, Paytm, BHIM)</p>
                <p>🏦 Net Banking (All major Indian banks)</p>
                <p>💰 Digital Wallets (Paytm, Mobikwik, Freecharge)</p>
                <p>🌍 International Cards Accepted</p>
                <p>📊 EMI Options Available</p>
              </div>
            </div>
          )}

          {paymentProvider === PaymentProvider.PayPal && (
            <div className="mb-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                <h4 className="font-semibold text-blue-800 mb-2">🌍 PayPal Payment Options:</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>💳 Credit & Debit Cards (No PayPal account needed)</p>
                  <p>💰 PayPal Balance (If you have an account)</p>
                  <p>🛒 Buy Now, Pay Later Options</p>
                  <p>🌍 Accepted Worldwide</p>
                </div>
              </div>
              
              {/* PayPal Buttons Container */}
              <div id="paypal-button-container" className="min-h-[100px] border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center">
                <div className="text-center text-blue-600">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm">PayPal buttons will appear here</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-red-800 mb-1">Payment Error</h4>
                  <p className="text-sm text-red-700 mb-3">{error}</p>
                  
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={switchProvider}
                      className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      Try {paymentProvider === PaymentProvider.Razorpay ? 'PayPal' : 'Razorpay'}
                    </button>
                    <button
                      onClick={() => setError(null)}
                      className="px-3 py-1 text-xs border border-red-600 text-red-600 rounded hover:bg-red-50 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Button */}
          {paymentProvider === PaymentProvider.Razorpay && (
            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-bold text-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                  Processing Payment...
                </div>
              ) : (
                <div>
                  <div className="text-xl">Pay {symbol}{price.toLocaleString()} with Razorpay</div>
                  <div className="text-sm opacity-90 mt-1">
                    Secure payment • All methods supported
                  </div>
                </div>
              )}
            </button>
          )}

          {paymentProvider === PaymentProvider.PayPal && !isProcessing && (
            <button
              onClick={handlePayment}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <div>
                <div className="text-xl">Pay ${price.toLocaleString()} with PayPal</div>
                <div className="text-sm opacity-90 mt-1">
                  Secure global payment • No account required
                </div>
              </div>
            </button>
          )}

          {/* Security & Trust Indicators */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Secured by 256-bit SSL encryption
            </div>
            
            <div className="text-center text-xs text-gray-500">
              <p>Your payment information is processed securely.</p>
              <p>We do not store credit card details.</p>
            </div>
            
            <div className="text-center text-xs text-gray-500">
              Need help? Contact us at{' '}
              <a href="mailto:support@complyguard.ai" className="text-blue-600 hover:underline">
                support@complyguard.ai
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FunctionalPaymentFlow;