import * as React from 'react';
import { SubscriptionPlan, BillingCycle, PaymentProvider, User } from '../types';
import { PaymentService } from '../services/paymentService';
import { getPrice } from '../config/subscriptionPlans';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import PaymentProgress from './PaymentProgress';
import PaymentMethodSelector from './PaymentMethodSelector';
import PaymentSummary from './PaymentSummary';

interface PaymentCheckoutProps {
  user: User;
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  onSuccess: (paymentData: any) => void;
  onCancel: () => void;
}

const PaymentCheckout: React.FC<PaymentCheckoutProps> = ({
  user,
  plan,
  billingCycle,
  onSuccess,
  onCancel,
}) => {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = React.useState<string>('');
  const [currentStep, setCurrentStep] = React.useState(1);
  const [paymentProvider, setPaymentProvider] = React.useState<PaymentProvider>(
    PaymentService.detectPaymentProvider()
  );
  const [showProgress, setShowProgress] = React.useState(false);

  const isYearly = billingCycle === BillingCycle.Yearly;
  const currency = paymentProvider === PaymentProvider.Razorpay ? 'INR' : 'USD';
  const price = getPrice(plan, isYearly, currency);
  const symbol = currency === 'USD' ? '$' : '₹';

  // Enhanced progress tracking
  const updateProgress = (step: number, message: string) => {
    setCurrentStep(step);
    setLoadingMessage(message);
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    setShowProgress(true);
    setError(null);
    
    // Use enhanced payment processing with retry logic
    await PaymentService.processPaymentWithRetry(
      paymentProvider,
      plan,
      billingCycle,
      user.id,
      user.email,
      (message) => {
        setLoadingMessage(message);
        // Update step based on message content
        if (message.includes('Initializing') || message.includes('Creating')) {
          setCurrentStep(1);
        } else if (message.includes('Processing') || message.includes('Opening')) {
          setCurrentStep(2);
        } else if (message.includes('Activating')) {
          setCurrentStep(3);
        } else if (message.includes('Success')) {
          setCurrentStep(4);
        }
      },
      async (result) => {
        updateProgress(4, 'Payment successful! Redirecting...');
        
        // Create subscription
        try {
          const subscription = await PaymentService.createSubscription(
            user.id,
            plan.id,
            billingCycle,
            paymentProvider,
            result.paymentId || result.paymentID
          );
          
          setTimeout(() => {
            setShowProgress(false);
            onSuccess({
              ...result,
              subscription,
            });
          }, 1500);
        } catch (error) {
          setError(`Payment successful but subscription activation failed. Please contact support with your payment ID: ${result.paymentId || result.paymentID}`);
          setIsProcessing(false);
          setShowProgress(false);
        }
      },
      (error) => {
        setError(error.reason || 'Payment failed. Please try again.');
        setIsProcessing(false);
        setShowProgress(false);
      }
    );
  };

  // Handle payment provider change
  const handleProviderChange = (provider: PaymentProvider) => {
    if (!isProcessing) {
      setPaymentProvider(provider);
      setError(null);
    }
  };

  // Handle retry payment
  const handleRetry = () => {
    setError(null);
    setShowProgress(false);
    setCurrentStep(1);
    handlePayment();
  };

  // Handle cancel payment
  const handleCancelPayment = () => {
    setShowProgress(false);
    setIsProcessing(false);
    setError(null);
    onCancel();
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
    <>
      {/* Payment Progress Modal */}
      <PaymentProgress
        isVisible={showProgress}
        currentStep={currentStep}
        message={loadingMessage}
        error={error}
        paymentProvider={paymentProvider}
        onRetry={handleRetry}
        onSwitchProvider={handleProviderChange}
        onCancel={handleCancelPayment}
      />
      
      {/* Main Payment Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
        <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            
            {/* Left Panel - Payment Form */}
            <div className="flex-1 p-6 lg:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Complete Your Purchase</h2>
                <button
                  onClick={onCancel}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isProcessing}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Payment Method Selection */}
              <PaymentMethodSelector
                selectedProvider={paymentProvider}
                onProviderChange={handleProviderChange}
                plan={plan}
                billingCycle={billingCycle}
                isProcessing={isProcessing}
              />

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <AlertTriangleIcon className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800 mb-1">Payment Error</p>
                      <p className="text-sm text-red-700 mb-3">{error}</p>
                      
                      {/* Error Recovery Options */}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-red-800">Try these solutions:</p>
                        <div className="text-xs text-red-700 space-y-1">
                          <p>• Switch to {paymentProvider === PaymentProvider.PayPal ? 'Razorpay' : 'PayPal'} payment method above</p>
                          <p>• Try a different credit/debit card</p>
                          <p>• Contact support: support@complyguard.ai</p>
                        </div>
                        
                        <div className="flex space-x-2 mt-3">
                          <button
                            onClick={() => {
                              setError(null);
                              setPaymentProvider(paymentProvider === PaymentProvider.PayPal ? PaymentProvider.Razorpay : PaymentProvider.PayPal);
                            }}
                            className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                          >
                            Switch Payment Method
                          </button>
                          <button
                            onClick={handleRetry}
                            className="px-3 py-1 text-xs border border-red-600 text-red-600 rounded hover:bg-red-50 transition-colors"
                          >
                            Try Again
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Button */}
              <div className="space-y-4">
                <button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing Payment...
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <span className="text-lg">💳 Pay {symbol}{price.toLocaleString()}</span>
                      <span className="text-sm opacity-90">
                        {paymentProvider === PaymentProvider.Razorpay ? 'Razorpay' : 'PayPal'} • No account needed
                      </span>
                    </div>
                  )}
                </button>
                
                {/* PayPal Container for dynamic buttons */}
                {paymentProvider === PaymentProvider.PayPal && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                    <div id="paypal-button-container" className="min-h-[50px]">
                      <div className="text-center text-gray-500 text-sm">
                        PayPal buttons will appear here after clicking "Pay" above
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="text-center space-y-1">
                  <p className="text-xs text-gray-600 font-medium">
                    ✅ Guest checkout • ✅ All cards accepted • ✅ Secure processing
                  </p>
                  <p className="text-xs text-gray-500">
                    Powered by {paymentProvider === PaymentProvider.Razorpay ? 'Razorpay' : 'PayPal'} - Bank-level security
                  </p>
                </div>
              </div>

              {/* Help Section */}
              <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Having trouble with payment?</h4>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>• Try switching between Razorpay and PayPal above</p>
                  <p>• Both support guest checkout - no account required</p>
                  <p>• Contact our support team for help</p>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-300">
                  <p className="text-xs text-gray-500">
                    📧 Need help? Email us at <span className="font-medium text-blue-600">support@complyguard.ai</span>
                  </p>
                </div>
              </div>

              {/* Security Notice */}
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start">
                  <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <div className="text-sm text-green-800">
                    <p className="font-medium mb-1">🔒 Bank-Level Security</p>
                    <p>Your payment is protected by 256-bit SSL encryption. We never store your card details.</p>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <p className="text-xs text-gray-500 mt-4 text-center">
                By completing this purchase, you agree to our{' '}
                <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a> and{' '}
                <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>.
              </p>
            </div>
            
            {/* Right Panel - Order Summary */}
            <div className="lg:w-96 bg-gray-50 p-6 lg:p-8 border-l border-gray-200">
              <PaymentSummary
                plan={plan}
                billingCycle={billingCycle}
                paymentProvider={paymentProvider}
                userEmail={user.email}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentCheckout;