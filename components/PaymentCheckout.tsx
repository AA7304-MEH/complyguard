import * as React from 'react';
import { SubscriptionPlan, BillingCycle, PaymentProvider, User } from '../types';
import { PaymentService } from '../services/paymentService';
import { getPrice } from '../config/subscriptionPlans';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';

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
  const [paymentProvider, setPaymentProvider] = React.useState<PaymentProvider>(
    PaymentService.detectPaymentProvider()
  );
  const [paypalRetryCount, setPaypalRetryCount] = React.useState(0);

  const isYearly = billingCycle === BillingCycle.Yearly;
  const currency = paymentProvider === PaymentProvider.Razorpay ? 'INR' : 'USD';
  const price = getPrice(plan, isYearly, currency);
  const symbol = currency === 'USD' ? '$' : '₹';

  const handleRazorpayPayment = async () => {
    setIsProcessing(true);
    setError(null);
    setLoadingMessage('Initializing secure payment...');

    try {
      // Create Razorpay order
      setLoadingMessage('Creating payment order...');
      const order = await PaymentService.createRazorpayOrder(plan, billingCycle, user.id);

      // Initialize Razorpay checkout
      setLoadingMessage('Opening secure payment gateway...');
      PaymentService.initializeRazorpayCheckout(
        order,
        plan,
        user.email,
        async (response) => {
          try {
            setLoadingMessage('Activating your subscription...');
            // Create subscription
            const subscription = await PaymentService.createSubscription(
              user.id,
              plan.id,
              billingCycle,
              PaymentProvider.Razorpay,
              response.razorpay_payment_id
            );
            
            setLoadingMessage('Success! Redirecting...');
            setTimeout(() => {
              onSuccess({
                provider: PaymentProvider.Razorpay,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                subscription,
              });
            }, 1000);
          } catch (error) {
            setError('Payment successful but subscription activation failed. Please contact support with your payment ID: ' + response.razorpay_payment_id);
            console.error('Subscription creation failed:', error);
          } finally {
            setIsProcessing(false);
            setLoadingMessage('');
          }
        },
        (error) => {
          const errorMessage = error.description || error.reason || 'Payment failed. Please try again.';
          setError(errorMessage);
          console.error('Razorpay payment failed:', error);
          setIsProcessing(false);
          setLoadingMessage('');
        }
      );
    } catch (error) {
      setError('Failed to initialize payment. Please try again.');
      console.error('Razorpay order creation failed:', error);
      setIsProcessing(false);
    }
  };

  const handlePayPalPayment = async () => {
    setIsProcessing(true);
    setError(null);
    setLoadingMessage('Initializing PayPal payment...');

    try {
      // Initialize PayPal checkout
      PaymentService.initializePayPalCheckout(
        'paypal-button-container',
        plan,
        billingCycle,
        user.id,
        async (paymentDetails) => {
          try {
            setLoadingMessage('Activating your subscription...');
            
            // Create subscription
            const subscription = await PaymentService.createSubscription(
              user.id,
              plan.id,
              billingCycle,
              PaymentProvider.PayPal,
              paymentDetails.paymentID || paymentDetails.orderID
            );
            
            setLoadingMessage('Success! Redirecting...');
            
            setTimeout(() => {
              onSuccess({
                provider: PaymentProvider.PayPal,
                paymentId: paymentDetails.paymentID || paymentDetails.orderID,
                orderId: paymentDetails.orderID,
                amount: paymentDetails.amount,
                currency: paymentDetails.currency,
                subscription,
                details: paymentDetails,
              });
            }, 1000);
          } catch (error) {
            const errorMsg = `Payment successful but subscription activation failed. Please contact support with your PayPal order ID: ${paymentDetails.orderID}`;
            setError(errorMsg);
            console.error('Subscription creation failed:', error);
          } finally {
            setIsProcessing(false);
            setLoadingMessage('');
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
          console.error('PayPal payment failed:', error);
          setIsProcessing(false);
          setLoadingMessage('');
        }
      );
    } catch (error) {
      setError('Failed to initialize PayPal payment. Please refresh the page and try again.');
      console.error('PayPal initialization failed:', error);
      setIsProcessing(false);
      setLoadingMessage('');
    }
  };

  // Initialize PayPal when component mounts and PayPal is selected
  React.useEffect(() => {
    if (paymentProvider === PaymentProvider.PayPal && !isProcessing) {
      const timer = setTimeout(() => {
        handlePayPalPayment();
      }, 500); // Small delay to ensure DOM is ready
      
      return () => clearTimeout(timer);
    }
  }, [paymentProvider]);

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto relative">
        
        {/* Loading Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center rounded-lg z-10">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-700 font-medium">{loadingMessage}</p>
              <p className="text-sm text-gray-500 mt-2">Please don't close this window</p>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-primary">Complete Your Purchase</h2>
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

        {/* Order Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-primary mb-3">Order Summary</h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan:</span>
              <span className="font-medium">{plan.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Billing:</span>
              <span className="font-medium capitalize">{billingCycle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Currency:</span>
              <span className="font-medium">{currency}</span>
            </div>
            {savings && (
              <div className="flex justify-between text-green-600">
                <span>Yearly Savings:</span>
                <span className="font-medium">{symbol}{savings.toLocaleString()}</span>
              </div>
            )}
            <hr className="my-2" />
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>{symbol}{price.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Payment Provider Selection */}
        <div className="mb-6">
          <h3 className="font-semibold text-primary mb-3">Choose Your Payment Method</h3>
          <p className="text-sm text-gray-600 mb-4">
            No account required! Pay directly with your credit/debit card through either provider.
          </p>
          
          <div className="space-y-3">
            <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="payment-provider"
                value={PaymentProvider.Razorpay}
                checked={paymentProvider === PaymentProvider.Razorpay}
                onChange={(e) => setPaymentProvider(e.target.value as PaymentProvider)}
                className="mr-3 mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900 mb-1">🇮🇳 Razorpay (Recommended for India)</div>
                <div className="text-sm text-gray-600 mb-2">
                  <strong>No Razorpay account needed!</strong> Pay directly with:
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>• Any Credit/Debit Card (Visa, Mastercard, RuPay, Amex)</div>
                  <div>• UPI (Google Pay, PhonePe, Paytm, BHIM)</div>
                  <div>• Net Banking (All major banks)</div>
                  <div>• Digital Wallets (Paytm, Mobikwik, Amazon Pay)</div>
                  <div>• EMI options available</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-600">₹{getPrice(plan, isYearly, 'INR').toLocaleString()}</div>
                <div className="text-xs text-gray-500">Best rates for India</div>
              </div>
            </label>

            <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="payment-provider"
                value={PaymentProvider.PayPal}
                checked={paymentProvider === PaymentProvider.PayPal}
                onChange={(e) => setPaymentProvider(e.target.value as PaymentProvider)}
                className="mr-3 mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900 mb-1">🌍 PayPal (International)</div>
                <div className="text-sm text-gray-600 mb-2">
                  <strong>No PayPal account required!</strong> Pay directly with:
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>• Any Credit/Debit Card (Visa, Mastercard, Amex, Discover)</div>
                  <div>• PayPal Balance (if you have an account)</div>
                  <div>• Bank transfers in supported countries</div>
                  <div>• Buy now, pay later options</div>
                  <div>• Secure guest checkout available</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-600">${getPrice(plan, isYearly, 'USD').toLocaleString()}</div>
                <div className="text-xs text-gray-500">Global acceptance</div>
              </div>
            </label>
          </div>
          
          {/* Payment Method Info */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">💳 Guest Checkout Available</p>
                <p>
                  You don't need a {paymentProvider === PaymentProvider.Razorpay ? 'Razorpay' : 'PayPal'} account. 
                  Simply enter your card details during checkout for instant payment.
                </p>
              </div>
            </div>
          </div>
        </div>

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
                    <p>• Refresh the page and try again</p>
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
                      onClick={() => {
                        setError(null);
                        window.location.reload();
                      }}
                      className="px-3 py-1 text-xs border border-red-600 text-red-600 rounded hover:bg-red-50 transition-colors"
                    >
                      Refresh Page
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Button */}
        <div className="space-y-4">
          {paymentProvider === PaymentProvider.Razorpay ? (
            <div className="space-y-3">
              <button
                onClick={handleRazorpayPayment}
                disabled={isProcessing}
                className="w-full py-4 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing Payment...
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <span className="text-lg">💳 Pay {symbol}{price.toLocaleString()}</span>
                    <span className="text-sm opacity-90">No Razorpay account needed</span>
                  </div>
                )}
              </button>
              <div className="text-center space-y-1">
                <p className="text-xs text-gray-600 font-medium">
                  ✅ Guest checkout • ✅ All cards accepted • ✅ UPI & Net Banking
                </p>
                <p className="text-xs text-gray-500">
                  Powered by Razorpay - India's most trusted payment gateway
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* PayPal Buttons Container */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                <div id="paypal-button-container" className="min-h-[50px]">
                  {!isProcessing && (
                    <div className="text-center text-gray-500 text-sm">
                      Loading PayPal payment options...
                    </div>
                  )}
                </div>
              </div>
              
              {/* Fallback Manual Button */}
              {!isProcessing && (
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-2">
                    PayPal buttons not loading? Click below to retry:
                  </p>
                  <button
                    onClick={handlePayPalPayment}
                    className="w-full py-3 px-4 bg-gradient-to-r from-[#0070ba] to-[#005ea6] text-white rounded-lg font-semibold hover:from-[#005ea6] hover:to-[#004c8a] transition-all duration-200 shadow-lg"
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-lg">💳 Initialize PayPal Payment</span>
                      <span className="text-sm opacity-90">Pay ${price.toLocaleString()} - No account needed</span>
                    </div>
                  </button>
                </div>
              )}
              
              <div className="text-center space-y-1">
                <p className="text-xs text-gray-600 font-medium">
                  ✅ Guest checkout • ✅ All major cards • ✅ Global acceptance
                </p>
                <p className="text-xs text-gray-500">
                  Powered by PayPal - Trusted by millions worldwide
                </p>
              </div>
              
              {/* PayPal Help */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>💡 PayPal Payment Options:</strong><br/>
                  • Pay with any credit/debit card (no PayPal account needed)<br/>
                  • Use your PayPal balance if you have an account<br/>
                  • Buy now, pay later options available
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Alternative Payment Methods */}
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Having trouble with payment?</h4>
          <div className="text-sm text-gray-600 space-y-2">
            <p>• Try switching between Razorpay and PayPal above</p>
            <p>• Both support guest checkout - no account required</p>
            <p>• Contact our support team for alternative payment options</p>
            <p>• We accept bank transfers for enterprise customers</p>
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
        <p className="text-xs text-muted-foreground mt-4 text-center">
          By completing this purchase, you agree to our{' '}
          <a href="/terms" className="text-accent hover:underline">Terms of Service</a> and{' '}
          <a href="/privacy" className="text-accent hover:underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
};

export default PaymentCheckout;