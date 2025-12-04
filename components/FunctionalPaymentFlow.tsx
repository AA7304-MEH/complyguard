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
  // Always default to Razorpay for instant loading
  const [paymentProvider, setPaymentProvider] = React.useState<PaymentProvider>(PaymentProvider.Razorpay);
  const [showPayPalOption, setShowPayPalOption] = React.useState(true); // Show PayPal option by default
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
  const [paypalButtonsRendered, setPaypalButtonsRendered] = React.useState(false);

  // Always use Razorpay for instant loading - detect location for display only
  React.useEffect(() => {
    const detectProvider = async () => {
      setIsDetecting(true);
      try {
        const location = await FunctionalPaymentService.getUserLocation();
        setDetectedLocation(location);
        // Always use Razorpay for instant experience
        setPaymentProvider(PaymentProvider.Razorpay);
        console.log(`🎯 Location: ${location}, Using Razorpay for instant loading`);
      } catch (error) {
        setDetectedLocation('Unknown');
        // Still use Razorpay as default
        setPaymentProvider(PaymentProvider.Razorpay);
        console.log(`🎯 Using Razorpay for instant loading`);
      } finally {
        setIsDetecting(false);
      }
    };

    detectProvider();
  }, []);

  // Reset buttons rendered state when provider changes
  React.useEffect(() => {
    if (paymentProvider !== PaymentProvider.PayPal) {
      setPaypalButtonsRendered(false);
    }
  }, [paymentProvider]);

  // Render PayPal buttons IMMEDIATELY when PayPal is selected
  React.useEffect(() => {
    if (paymentProvider === PaymentProvider.PayPal && !isProcessing && !paypalButtonsRendered) {
      // Start rendering immediately without delay
      renderPayPalButtons();
    }
  }, [paymentProvider, isProcessing, paypalButtonsRendered]);

  const renderPayPalButtons = async () => {
    try {
      console.log('🎨 Starting PayPal button render...');

      const container = document.getElementById('paypal-button-container');
      if (!container) {
        console.error('❌ PayPal container not found');
        return;
      }

      // Show placeholder button immediately for better UX
      container.innerHTML = `
        <div class="space-y-3">
          <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4 text-center cursor-wait opacity-75">
            <div class="flex items-center justify-center space-x-2">
              <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span class="font-semibold">Loading PayPal...</span>
            </div>
            <p class="text-xs mt-2 opacity-90">Connecting to PayPal servers</p>
          </div>
          <div class="text-center text-xs text-gray-500">
            <p>💡 Tip: Razorpay loads instantly if you prefer faster checkout</p>
          </div>
        </div>
      `;

      // Check if PayPal SDK is available (loaded in head)
      if (typeof (window as any).paypal !== 'undefined') {
        console.log('✅ PayPal SDK available, rendering immediately');
        renderButtons(container);
        return;
      }

      // Quick check with very short intervals
      let attempts = 0;
      const checkInterval = setInterval(() => {
        attempts++;
        if (typeof (window as any).paypal !== 'undefined') {
          clearInterval(checkInterval);
          console.log('✅ PayPal SDK loaded, rendering buttons');
          renderButtons(container);
        } else if (attempts > 20) { // 2 seconds max
          clearInterval(checkInterval);
          console.error('❌ PayPal SDK timeout - showing alternative');
          container.innerHTML = `
            <div class="space-y-4">
              <div class="text-center py-6 px-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                <div class="text-4xl mb-3">⚠️</div>
                <p class="text-sm font-semibold text-yellow-900 mb-2">PayPal is taking longer than usual</p>
                <p class="text-xs text-yellow-800 mb-4">This might be due to network conditions or PayPal server load</p>
                <button onclick="window.location.reload()" class="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700 mr-2">
                  🔄 Retry PayPal
                </button>
                <button onclick="document.querySelectorAll('button').forEach(b => { if(b.textContent.includes('Razorpay')) b.click() })" class="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                  ⚡ Use Razorpay (Instant)
                </button>
              </div>
              <div class="text-center text-xs text-gray-600">
                <p>💳 Razorpay accepts all cards, UPI, and wallets</p>
                <p class="mt-1">✅ Loads instantly with no waiting</p>
              </div>
            </div>
          `;
        }
      }, 100);

    } catch (error) {
      console.error('❌ PayPal initialization error:', error);
    }
  };

  const renderButtons = (container: HTMLElement) => {
    try {
      const paypal = (window as any).paypal;
      if (!paypal || !paypal.Buttons) {
        console.error('❌ PayPal SDK not available');
        setError('PayPal is not available. Please try Razorpay or refresh the page.');
        return;
      }

      const isYearly = billingCycle === BillingCycle.Yearly;
      const amount = getPrice(plan, isYearly, 'USD');

      paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'paypal',
          height: 50,
          tagline: false
        },
        createOrder: (data: any, actions: any) => {
          console.log('💰 Creating PayPal order for $' + amount);
          return actions.order.create({
            intent: 'CAPTURE',
            purchase_units: [{
              reference_id: `CG_${Date.now()}`,
              amount: {
                currency_code: 'USD',
                value: amount.toFixed(2)
              },
              description: `ComplyGuard AI - ${plan.name} Plan (${billingCycle})`,
            }],
            application_context: {
              brand_name: 'ComplyGuard AI',
              locale: 'en-US',
              landing_page: 'BILLING',
              shipping_preference: 'NO_SHIPPING',
              user_action: 'PAY_NOW'
            }
          });
        },
        onApprove: async (data: any, actions: any) => {
          try {
            setIsProcessing(true);
            updateProgress(2, 'Processing payment...');

            const orderDetails = await actions.order.capture();
            console.log('✅ PayPal payment captured:', orderDetails);

            if (orderDetails.status !== 'COMPLETED') {
              throw new Error(`Payment not completed. Status: ${orderDetails.status}`);
            }

            updateProgress(3, 'Creating subscription...');

            const subscription = await FunctionalPaymentService.createSubscription(
              user.id,
              plan.id,
              billingCycle,
              {
                success: true,
                paymentId: orderDetails.id,
                orderId: data.orderID,
                amount: amount,
                currency: 'USD',
                provider: PaymentProvider.PayPal
              }
            );

            updateProgress(4, 'Success! Redirecting...');

            setTimeout(() => {
              onSuccess({
                provider: PaymentProvider.PayPal,
                paymentId: orderDetails.id,
                orderId: data.orderID,
                amount: amount,
                currency: 'USD',
                subscription
              });
            }, 1500);

          } catch (error: any) {
            console.error('❌ PayPal capture error:', error);
            setError('Payment processing failed. Please try again.');
            setIsProcessing(false);
          }
        },
        onError: (error: any) => {
          console.error('❌ PayPal error:', error);
          setError('PayPal error occurred. Please try Razorpay instead.');
        },
        onCancel: () => {
          console.log('⚠️ PayPal payment cancelled');
          setError('Payment cancelled. You can try again or use Razorpay.');
        }
      }).render('#paypal-button-container')
        .then(() => {
          console.log('✅ PayPal buttons rendered successfully');
          setPaypalButtonsRendered(true);
        })
        .catch((error: any) => {
          console.error('❌ PayPal button render error:', error);
          setError('Failed to load PayPal buttons. Please try Razorpay or refresh the page.');
        });

    } catch (error) {
      console.error('❌ PayPal initialization error:', error);
      setError('Failed to initialize PayPal. Please try Razorpay instead.');
    }
  };

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl my-8 max-h-[90vh] flex flex-col">

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
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${step <= currentStep
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

        <div className="p-6 overflow-y-auto flex-1" style={{ maxHeight: 'calc(90vh - 200px)' }}>
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

          {/* Payment Method Selection - Razorpay Prominent */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Payment Method</h3>

            {/* Razorpay - Primary Option (Instant) */}
            <button
              onClick={() => setPaymentProvider(PaymentProvider.Razorpay)}
              disabled={isProcessing}
              className={`w-full p-5 rounded-xl border-3 transition-all duration-200 mb-4 relative ${paymentProvider === PaymentProvider.Razorpay
                  ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg scale-105'
                  : 'border-green-300 bg-green-50 hover:shadow-md hover:scale-102'
                } disabled:opacity-50`}
            >
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-600 text-white px-4 py-1 rounded-full text-xs font-bold shadow-md">
                  ⚡ INSTANT - RECOMMENDED
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-4xl">🇮🇳</div>
                  <div className="text-left">
                    <div className="font-bold text-gray-900 text-lg">Razorpay</div>
                    <div className="text-sm text-gray-700 mt-1">
                      💳 All Cards • 📱 UPI • 💰 Wallets • 🏦 Net Banking
                    </div>
                    <div className="text-xs text-green-700 font-semibold mt-1">
                      ✅ Loads instantly • No waiting
                    </div>
                  </div>
                </div>
                {paymentProvider === PaymentProvider.Razorpay && (
                  <div className="text-green-600">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </button>

            {/* PayPal - Secondary Option (Show More) */}
            {!showPayPalOption ? (
              <button
                onClick={() => setShowPayPalOption(true)}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all text-sm"
              >
                <span className="font-medium">+ Show PayPal Option</span>
                <span className="text-xs ml-2">(May take 1-2 seconds to load)</span>
              </button>
            ) : (
              <button
                onClick={() => setPaymentProvider(PaymentProvider.PayPal)}
                disabled={isProcessing}
                className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${paymentProvider === PaymentProvider.PayPal
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                  } disabled:opacity-50`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">💳</div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">Cards & PayPal</div>
                      <div className="text-xs text-gray-600 mt-1">
                        No account needed • All cards accepted
                      </div>
                      <div className="text-xs text-yellow-700 mt-1">
                        ⚠️ May take 1-2 seconds to load
                      </div>
                    </div>
                  </div>
                  {paymentProvider === PaymentProvider.PayPal && (
                    <div className="text-blue-600">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            )}
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
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                  <span className="text-2xl mr-2">💳</span>
                  Pay Without PayPal Account!
                </h4>
                <div className="text-sm text-blue-700 space-y-2">
                  <p className="font-semibold">✅ No PayPal account required - Pay with:</p>
                  <div className="ml-4 space-y-1">
                    <p>💳 <strong>Debit/Credit Cards</strong> (Visa, Mastercard, Amex, Discover)</p>
                    <p>💰 <strong>PayPal Balance</strong> (if you have an account - optional)</p>
                    <p>📱 <strong>Venmo</strong> (US users)</p>
                    <p>🛒 <strong>Buy Now, Pay Later</strong> (PayPal Credit, Pay in 4)</p>
                  </div>
                  <p className="mt-2 text-xs text-blue-600 bg-blue-100 p-2 rounded">
                    💡 <strong>Tip:</strong> Click the button below and select "Pay with Debit or Credit Card" - no account signup needed!
                  </p>
                </div>
              </div>

              {/* PayPal Buttons Container */}
              <div id="paypal-button-container" className="min-h-[120px] border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center bg-white">
                <div className="text-center text-blue-600 p-4">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm font-medium">Loading payment options...</p>
                  <p className="text-xs text-gray-500 mt-1">Cards, PayPal, Venmo & more</p>
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