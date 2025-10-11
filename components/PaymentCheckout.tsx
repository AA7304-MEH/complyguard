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

    try {
      // Initialize PayPal checkout
      PaymentService.initializePayPalCheckout(
        'paypal-button-container',
        plan,
        billingCycle,
        user.id,
        async (details) => {
          try {
            // Create subscription
            const subscription = await PaymentService.createSubscription(
              user.id,
              plan.id,
              billingCycle,
              PaymentProvider.PayPal,
              details.id
            );
            
            onSuccess({
              provider: PaymentProvider.PayPal,
              paymentId: details.id,
              subscription,
            });
          } catch (error) {
            setError('Failed to create subscription. Please contact support.');
            console.error('Subscription creation failed:', error);
          } finally {
            setIsProcessing(false);
          }
        },
        (error) => {
          setError('Payment failed. Please try again.');
          console.error('PayPal payment failed:', error);
          setIsProcessing(false);
        }
      );
    } catch (error) {
      setError('Failed to initialize payment. Please try again.');
      console.error('PayPal initialization failed:', error);
      setIsProcessing(false);
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
          <h3 className="font-semibold text-primary mb-3">Payment Method</h3>
          
          <div className="space-y-3">
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="payment-provider"
                value={PaymentProvider.Razorpay}
                checked={paymentProvider === PaymentProvider.Razorpay}
                onChange={(e) => setPaymentProvider(e.target.value as PaymentProvider)}
                className="mr-3"
              />
              <div className="flex-1">
                <div className="font-medium">Razorpay (India)</div>
                <div className="text-sm text-muted-foreground">
                  Credit/Debit Cards, UPI, Net Banking, Wallets
                </div>
              </div>
              <div className="text-sm font-medium">₹{getPrice(plan, isYearly, 'INR').toLocaleString()}</div>
            </label>

            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="payment-provider"
                value={PaymentProvider.PayPal}
                checked={paymentProvider === PaymentProvider.PayPal}
                onChange={(e) => setPaymentProvider(e.target.value as PaymentProvider)}
                className="mr-3"
              />
              <div className="flex-1">
                <div className="font-medium">PayPal (International)</div>
                <div className="text-sm text-muted-foreground">
                  Credit/Debit Cards, PayPal Balance
                </div>
              </div>
              <div className="text-sm font-medium">${getPrice(plan, isYearly, 'USD').toLocaleString()}</div>
            </label>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertTriangleIcon className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800 mb-1">Payment Error</p>
                <p className="text-sm text-red-700">{error}</p>
                <p className="text-xs text-red-600 mt-2">
                  If this issue persists, please contact our support team.
                </p>
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
                  <div className="flex items-center justify-center">
                    <span>Pay {symbol}{price.toLocaleString()} with Razorpay</span>
                  </div>
                )}
              </button>
              <p className="text-xs text-center text-gray-500">
                Secure payment via Razorpay • UPI, Cards, Net Banking supported
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div id="paypal-button-container" className="min-h-[45px]"></div>
              {!isProcessing && (
                <button
                  onClick={handlePayPalPayment}
                  className="w-full py-4 px-4 bg-gradient-to-r from-[#0070ba] to-[#005ea6] text-white rounded-lg font-semibold hover:from-[#005ea6] hover:to-[#004c8a] transition-all duration-200 shadow-lg"
                >
                  <div className="flex items-center justify-center">
                    <span>Pay ${price.toLocaleString()} with PayPal</span>
                  </div>
                </button>
              )}
              <p className="text-xs text-center text-gray-500">
                Secure international payment via PayPal • Credit cards accepted
              </p>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
            <div className="text-sm text-green-800">
              <p className="font-medium mb-1">Secure Payment</p>
              <p>Your payment information is encrypted and secure. You can cancel anytime.</p>
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