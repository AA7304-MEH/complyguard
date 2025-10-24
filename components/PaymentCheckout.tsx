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

  const handleRazorpayPayment = async () => {
    setIsProcessing(true);
    setShowProgress(true);
    setError(null);
    
    try {
      updateProgress(1, 'Creating secure payment order...');
      const order = await PaymentService.createRazorpayOrder(plan, billingCycle, user.id);

      updateProgress(2, 'Opening payment gateway...');
      PaymentService.initializeRazorpayCheckout(
        order,
        plan,
        user.email,
        async (response) => {
          try {
            updateProgress(3, 'Activating your subscription...');
            
            // Create subscription
            const subscription = await PaymentService.createSubscription(
              user.id,
              plan.id,
              billingCycle,
              PaymentProvider.Razorpay,
              response.razorpay_payment_id
            );
            
            updateProgress(4, 'Success! Redirecting...');
            setTimeout(() => {
              setShowProgress(false);
              onSuccess({
                provider: PaymentProvider.Razorpay,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                subscription,
              });
            }, 1500);
          } catch (error) {
            setError('Payment successful but subscription activation failed. Please contact support with your payment ID: ' + response.razorpay_payment_id);
            setIsProcessing(false);
            setShowProgress(false);
          }
        },
        (error) => {
          const errorMessage = error.description || error.reason || 'Payment failed. Please try again.';
          setError(errorMessage);
          setIsProcessing(false);
          setShowProgress(false);
        }
      );
    } catch (error) {
      setError('Failed to initialize payment. Please try again.');
      setIsProcessing(false);
      setShowProgress(false);
    }
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
    if (paymentProvider === PaymentProvider.Razorpay) {
      handleRazorpayPayment();
    }
  };

  // Handle cancel payment
  const handleCancelPayment = () => {
    setShowProgress(false);
    setIsProcessing(false);
    setError(null);
    onCancel();
  };

  // Initialize PayPal buttons when PayPal is selected
  React.useEffect(() => {
    if (paymentProvider === PaymentProvider.PayPal && !isProcessing) {
      const timer = setTimeout(() => {
        PaymentService.initializePayPalCheckout(
          'paypal-button-container',
          plan,
          billingCycle,
          user.id,
          async (paymentDetails) => {
            try {
              setIsProcessing(true);
              setShowProgress(true);
              updateProgress(3, 'Activating your subscription...');
              
              // Create subscription
              const subscription = await PaymentService.createSubscription(
                user.id,
                plan.id,
                billingCycle,
                PaymentProvider.PayPal,
                paymentDetails.paymentID || paymentDetails.orderID
              );
              
              updateProgress(4, 'Success! Redirecting...');
              
              setTimeout(() => {
                setShowProgress(false);
                onSuccess({
                  provider: PaymentProvider.PayPal,
                  paymentId: paymentDetails.paymentID || paymentDetails.orderID,
                  orderId: paymentDetails.orderID,
                  amount: paymentDetails.amount,
                  currency: 'USD',
                  subscription,
                  details: paymentDetails,
                });
              }, 1500);
            } catch (error) {
              const errorMsg = `Payment successful but subscription activation failed. Please contact support with your PayPal order ID: ${paymentDetails.orderID}`;
              setError(errorMsg);
              setIsProcessing(false);
              setShowProgress(false);
            }
          },
          (error) => {
            let errorMessage = 'Payment failed. Please try again.';
            
            if (error.cancelled) {
              errorMessage = 'Payment was cancelled. You can try again when ready.';
            } else if (error.orderID) {
              errorMessage = `Payment processing failed. Order ID: ${error.orderID}. Please contact support.`;
            } else if (error.suggestion) {
              errorMessage = error.reason + ' ' + error.suggestion;
            } else if (error.reason) {
              errorMessage = error.reason;
            }
            
            setError(errorMessage);
            setIsProcessing(false);
            setShowProgress(false);
          }
        );
      }, 1000); // Delay to ensure DOM is ready
      
      return () => clearTimeout(timer);
    }
  }, [paymentProvider, plan, billingCycle, user.id, isProcessing]);

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

              {/* Payment Buttons */}
              <div className="space-y-4">
                {paymentProvider === PaymentProvider.Razorpay ? (
                  // Razorpay Payment Button
                  <div className="space-y-3">
                    <button
                      onClick={handleRazorpayPayment}
                      disabled={isProcessing}
                      className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                      {isProcessing ? (
                        <div className="flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Processing Payment...
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <span className="text-lg">🇮🇳 Pay ₹{price.toLocaleString()} with Razorpay</span>
                          <span className="text-sm opacity-90">Cards • UPI • Net Banking • Wallets</span>
                        </div>
                      )}
                    </button>
                    
                    <div className="text-center space-y-1">
                      <p className="text-xs text-gray-600 font-medium">
                        ✅ No Razorpay account needed • ✅ All Indian payment methods • ✅ Instant processing
                      </p>
                      <p className="text-xs text-gray-500">
                        Powered by Razorpay - India's most trusted payment gateway
                      </p>
                    </div>
                  </div>
                ) : (
                  // PayPal Payment Buttons
                  <div className="space-y-3">
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                      <div className="text-center mb-3">
                        <h3 className="font-semibold text-blue-900 mb-1">🌍 PayPal Payment Options</h3>
                        <p className="text-sm text-blue-700">Choose your preferred payment method below</p>
                      </div>
                      
                      {/* PayPal Buttons Container */}
                      <div id="paypal-button-container" className="min-h-[120px]">
                        <div className="text-center text-blue-600 py-8">
                          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                          <p className="text-sm">Loading PayPal payment options...</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center space-y-1">
                      <p className="text-xs text-gray-600 font-medium">
                        ✅ No PayPal account needed • ✅ All major cards • ✅ Global acceptance
                      </p>
                      <p className="text-xs text-gray-500">
                        Powered by PayPal - Trusted by millions worldwide
                      </p>
                    </div>
                    
                    {/* PayPal Help */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-800">
                        <strong>💡 Payment Options Available:</strong><br/>
                        • Pay with any credit/debit card (no PayPal account needed)<br/>
                        • Use your PayPal balance if you have an account<br/>
                        • Buy now, pay later options available
                      </p>
                    </div>
                  </div>
                )}
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