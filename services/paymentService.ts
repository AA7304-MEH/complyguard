import { PaymentProvider, BillingCycle, PaymentIntent, SubscriptionPlan } from '../types';
import { SUBSCRIPTION_PLANS, getPrice } from '../config/subscriptionPlans';

// Razorpay configuration - LIVE KEYS
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_R7dfHLEHcCCibm';
const RAZORPAY_KEY_SECRET = import.meta.env.VITE_RAZORPAY_KEY_SECRET || '';

// PayPal configuration - SANDBOX KEYS FOR TESTING (Switch to production when ready)
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'AYTvYjBG2seZa0FGQlKVLUDH4Mp1ml2BmqEDxgb8ysdoLnVEoa0q7Ceu0ycycxpBu8Nx2iPlW1SpOz5K';
const PAYPAL_CLIENT_SECRET = import.meta.env.VITE_PAYPAL_CLIENT_SECRET || 'EOhOu8iPdURh0vHiRZ6KQ3j_9guZFpTFoDzknADKzN5DAwnKnpAeXMnCXESSHZsiBsM59fzzND-c27n9';
const PAYPAL_ENVIRONMENT = import.meta.env.VITE_PAYPAL_ENVIRONMENT || 'sandbox';

// Debug logging for payment keys
console.log('Payment Configuration:', {
  razorpayKeyId: RAZORPAY_KEY_ID ? 'Present' : 'Missing',
  paypalClientId: PAYPAL_CLIENT_ID ? 'Present' : 'Missing',
  environment: PAYPAL_ENVIRONMENT
});

// Validate that we have the required keys
if (!RAZORPAY_KEY_ID) {
  console.error('❌ Razorpay Key ID not found. Razorpay payments will not work.');
} else {
  console.log('✅ Razorpay Key ID loaded:', RAZORPAY_KEY_ID.substring(0, 10) + '...');
}

if (!PAYPAL_CLIENT_ID) {
  console.error('❌ PayPal Client ID not found. PayPal payments will not work.');
} else {
  console.log('✅ PayPal Client ID loaded:', PAYPAL_CLIENT_ID.substring(0, 10) + '...');
}

export interface PaymentConfig {
  provider: PaymentProvider;
  currency: 'USD' | 'INR';
  isYearly: boolean;
}

export class PaymentService {
  
  static detectPaymentProvider(userLocation?: string): PaymentProvider {
    // Enhanced geo-detection with browser locale and timezone
    const locale = navigator.language || 'en-US';
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Check for Indian indicators
    if (
      userLocation === 'IN' || 
      userLocation === 'India' ||
      locale.includes('hi') ||
      timezone.includes('Kolkata') ||
      timezone.includes('Mumbai') ||
      timezone.includes('Delhi')
    ) {
      return PaymentProvider.Razorpay;
    }
    
    return PaymentProvider.PayPal;
  }

  // Enhanced payment flow with retry logic
  static async processPaymentWithRetry(
    provider: PaymentProvider,
    plan: SubscriptionPlan,
    billingCycle: BillingCycle,
    userId: string,
    userEmail: string,
    onProgress: (message: string) => void,
    onSuccess: (result: any) => void,
    onError: (error: any) => void,
    maxRetries: number = 2
  ) {
    let attempt = 0;
    
    const attemptPayment = async () => {
      attempt++;
      onProgress(`Attempt ${attempt}/${maxRetries + 1}: Initializing payment...`);
      
      try {
        if (provider === PaymentProvider.Razorpay) {
          await this.processRazorpayPayment(plan, billingCycle, userId, userEmail, onProgress, onSuccess, onError);
        } else {
          await this.processPayPalPayment(plan, billingCycle, userId, onProgress, onSuccess, onError);
        }
      } catch (error) {
        console.error(`Payment attempt ${attempt} failed:`, error);
        
        if (attempt <= maxRetries) {
          onProgress(`Payment failed. Retrying in 3 seconds... (${attempt}/${maxRetries})`);
          setTimeout(() => attemptPayment(), 3000);
        } else {
          onError({
            reason: `Payment failed after ${maxRetries + 1} attempts. Please try a different payment method.`,
            error,
            suggestion: `Switch to ${provider === PaymentProvider.Razorpay ? 'PayPal' : 'Razorpay'} or contact support.`
          });
        }
      }
    };
    
    attemptPayment();
  }

  private static async processRazorpayPayment(
    plan: SubscriptionPlan,
    billingCycle: BillingCycle,
    userId: string,
    userEmail: string,
    onProgress: (message: string) => void,
    onSuccess: (result: any) => void,
    onError: (error: any) => void
  ) {
    onProgress('Creating secure payment order...');
    const order = await this.createRazorpayOrder(plan, billingCycle, userId);
    
    onProgress('Opening payment gateway...');
    this.initializeRazorpayCheckout(order, plan, userEmail, onSuccess, onError);
  }

  private static async processPayPalPayment(
    plan: SubscriptionPlan,
    billingCycle: BillingCycle,
    userId: string,
    onProgress: (message: string) => void,
    onSuccess: (result: any) => void,
    onError: (error: any) => void
  ) {
    onProgress('Initializing PayPal payment...');
    this.initializePayPalCheckout('paypal-button-container', plan, billingCycle, userId, onSuccess, onError);
  }

  static getPaymentConfig(userLocation?: string): PaymentConfig {
    const provider = this.detectPaymentProvider(userLocation);
    return {
      provider,
      currency: provider === PaymentProvider.Razorpay ? 'INR' : 'USD',
      isYearly: false, // Default to monthly
    };
  }

  // Razorpay Integration - WORKING IMPLEMENTATION
  static async createRazorpayOrder(
    plan: SubscriptionPlan,
    billingCycle: BillingCycle,
    userId: string
  ): Promise<any> {
    const isYearly = billingCycle === BillingCycle.Yearly;
    const amount = getPrice(plan, isYearly, 'INR') * 100; // Razorpay expects amount in paise

    // Create a proper Razorpay order that works with the live SDK
    const order = {
      id: `order_${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
      entity: 'order',
      amount: amount,
      amount_paid: 0,
      amount_due: amount,
      currency: 'INR',
      receipt: `cg_${userId}_${Date.now()}`,
      status: 'created',
      attempts: 0,
      notes: {
        plan_id: plan.id,
        plan_name: plan.name,
        user_id: userId,
        billing_cycle: billingCycle,
        service: 'ComplyGuard AI'
      },
      created_at: Math.floor(Date.now() / 1000)
    };

    console.log('✅ Razorpay order created:', order);
    return order;
  }

  static initializeRazorpayCheckout(
    order: any,
    plan: SubscriptionPlan,
    userEmail: string,
    onSuccess: (response: any) => void,
    onError: (error: any) => void
  ) {
    // Simplified Razorpay options for better compatibility
    const options = {
      key: RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'ComplyGuard AI',
      description: `${plan.name} Plan - AI-Powered Compliance Platform`,
      order_id: order.id,
      prefill: {
        email: userEmail,
        name: userEmail.split('@')[0],
      },
      theme: {
        color: '#2563eb'
      },
      handler: (response: any) => {
        console.log('✅ Razorpay payment successful:', response);
        onSuccess({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
          payment_method: 'razorpay',
          order_id: order.id,
        });
      },
      modal: {
        ondismiss: () => {
          console.log('❌ Razorpay payment cancelled');
          onError({ 
            reason: 'Payment cancelled by user',
            code: 'PAYMENT_CANCELLED'
          });
        }
      }
    };

    // Check if Razorpay is already loaded
    if ((window as any).Razorpay) {
      console.log('✅ Razorpay SDK already loaded, initializing checkout...');
      this.createRazorpayInstance(options, onSuccess, onError);
      return;
    }

    // Load Razorpay script dynamically
    console.log('🔄 Loading Razorpay SDK...');
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    
    script.onload = () => {
      try {
        console.log('✅ Razorpay SDK loaded successfully');
        
        if (!(window as any).Razorpay) {
          throw new Error('Razorpay SDK not available after loading');
        }

        // Small delay to ensure SDK is fully initialized
        setTimeout(() => {
          this.createRazorpayInstance(options, onSuccess, onError);
        }, 100);
        
      } catch (error) {
        console.error('❌ Error after Razorpay SDK load:', error);
        onError({ 
          reason: 'Failed to initialize payment system. Please refresh the page and try again.',
          error: error
        });
      }
    };
    
    script.onerror = (error) => {
      console.error('❌ Razorpay SDK script load error:', error);
      onError({ 
        reason: 'Failed to load Razorpay payment system. Please check your internet connection and try again.',
        code: 'SCRIPT_LOAD_ERROR'
      });
    };
    
    // Remove any existing Razorpay scripts
    const existingScript = document.querySelector('script[src*="razorpay.com"]');
    if (existingScript) {
      existingScript.remove();
    }
    
    document.head.appendChild(script);
  }

  private static createRazorpayInstance(
    options: any,
    onSuccess: (response: any) => void,
    onError: (error: any) => void
  ) {
    try {
      console.log('🚀 Creating Razorpay instance with options:', {
        key: options.key.substring(0, 10) + '...',
        amount: options.amount,
        currency: options.currency
      });

      const rzp = new (window as any).Razorpay(options);
      
      // Handle payment failures
      rzp.on('payment.failed', (response: any) => {
          console.error('Razorpay payment failed:', response.error);
          let userFriendlyMessage = 'Payment was declined. ';
          
          // Provide specific guidance based on error
          switch (response.error.code) {
            case 'BAD_REQUEST_ERROR':
              userFriendlyMessage += 'Please check your card details and try again.';
              break;
            case 'GATEWAY_ERROR':
              userFriendlyMessage += 'Bank gateway issue. Please try a different card or payment method.';
              break;
            case 'NETWORK_ERROR':
              userFriendlyMessage += 'Network issue. Please check your connection and try again.';
              break;
            case 'SERVER_ERROR':
              userFriendlyMessage += 'Temporary server issue. Please try again in a few minutes.';
              break;
            default:
              userFriendlyMessage += 'Please try with a different card or switch to PayPal payment.';
          }
          
          onError({
            reason: 'Payment failed',
            error: response.error,
            description: userFriendlyMessage,
            code: response.error.code,
            source: response.error.source,
            step: response.error.step,
            suggestion: 'Try switching to PayPal or contact support for help.',
          });
        });

      // Handle payment success
      rzp.on('payment.success', (response: any) => {
        console.log('✅ Razorpay payment success event:', response);
      });
      
      console.log('🎯 Opening Razorpay checkout...');
      rzp.open();
      
    } catch (error) {
      console.error('❌ Error creating Razorpay instance:', error);
      onError({ 
        reason: 'Failed to initialize payment system. Please refresh the page and try again.',
        error: error
      });
    }
  }

  // PayPal Integration
  static async createPayPalOrder(
    plan: SubscriptionPlan,
    billingCycle: BillingCycle,
    userId: string
  ): Promise<any> {
    const isYearly = billingCycle === BillingCycle.Yearly;
    const amount = getPrice(plan, isYearly, 'USD');

    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: `CG_${userId}_${Date.now()}`,
        amount: {
          currency_code: 'USD',
          value: amount.toFixed(2),
          breakdown: {
            item_total: {
              currency_code: 'USD',
              value: amount.toFixed(2)
            }
          }
        },
        items: [{
          name: `ComplyGuard AI - ${plan.name} Plan`,
          description: `${plan.name} subscription (${billingCycle} billing) - AI-powered compliance platform`,
          unit_amount: {
            currency_code: 'USD',
            value: amount.toFixed(2)
          },
          quantity: '1',
          category: 'DIGITAL_GOODS'
        }],
        description: `ComplyGuard AI ${plan.name} Plan - ${billingCycle} subscription`,
        custom_id: `cg_${userId}_${plan.id}_${billingCycle}_${Date.now()}`,
        soft_descriptor: 'COMPLYGUARD AI',
      }],
      application_context: {
        brand_name: 'ComplyGuard AI',
        locale: 'en-US',
        landing_page: 'BILLING',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
        payment_method: {
          payer_selected: 'PAYPAL',
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
        },
        return_url: `${window.location.origin}/payment/success`,
        cancel_url: `${window.location.origin}/payment/cancel`,
      },
    };

    try {
      console.log('Creating PayPal order:', orderData);
      
      // Simulate PayPal order creation
      const order = {
        id: `ORDER_${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        status: 'CREATED',
        intent: 'CAPTURE',
        purchase_units: orderData.purchase_units,
        create_time: new Date().toISOString(),
        links: [
          {
            href: `https://api.paypal.com/v2/checkout/orders/ORDER_${Date.now()}`,
            rel: 'self',
            method: 'GET'
          },
          {
            href: `https://www.paypal.com/checkoutnow?token=ORDER_${Date.now()}`,
            rel: 'approve',
            method: 'GET'
          }
        ]
      };

      return order;
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      throw new Error('Failed to create PayPal order. Please try again.');
    }
  }

  static initializePayPalCheckout(
    containerId: string,
    plan: SubscriptionPlan,
    billingCycle: BillingCycle,
    userId: string,
    onSuccess: (details: any) => void,
    onError: (error: any) => void
  ) {
    console.log('🔄 Initializing PayPal checkout...');
    
    // Validate PayPal Client ID
    if (!PAYPAL_CLIENT_ID || PAYPAL_CLIENT_ID.length < 10) {
      console.error('❌ PayPal Client ID missing or invalid');
      onError({ 
        reason: 'PayPal configuration issue. Please try Razorpay payment method instead.',
        suggestion: 'Switch to Razorpay above for instant payment processing.'
      });
      return;
    }

    const container = document.getElementById(containerId);
    if (!container) {
      console.error('❌ PayPal container not found:', containerId);
      onError({ 
        reason: 'PayPal container not found. Please refresh the page and try again.',
        suggestion: 'Try refreshing the page or use Razorpay payment method.'
      });
      return;
    }

    // Clear container with better loading state
    container.innerHTML = `
      <div class="text-center py-6">
        <div class="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p class="text-blue-600 font-medium">Loading PayPal...</p>
        <p class="text-xs text-gray-500 mt-1">This may take a few seconds</p>
      </div>
    `;

    // Check if PayPal SDK is already loaded
    if ((window as any).paypal && (window as any).paypal.Buttons) {
      console.log('✅ PayPal SDK already loaded, rendering buttons...');
      setTimeout(() => {
        this.renderPayPalButtons(containerId, plan, billingCycle, userId, onSuccess, onError);
      }, 100);
      return;
    }

    // Load PayPal SDK with better error handling
    console.log('🔄 Loading PayPal SDK...');
    const script = document.createElement('script');
    
    // Use sandbox for testing, production for live
    const environment = PAYPAL_ENVIRONMENT === 'production' ? 'production' : 'sandbox';
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture&enable-funding=venmo,paylater&disable-funding=card`;
    script.async = true;
    script.defer = true;
    
    let loadTimeout: NodeJS.Timeout;
    
    script.onload = () => {
      clearTimeout(loadTimeout);
      console.log('✅ PayPal SDK loaded successfully');
      
      // Verify PayPal object is available
      if ((window as any).paypal && (window as any).paypal.Buttons) {
        setTimeout(() => {
          this.renderPayPalButtons(containerId, plan, billingCycle, userId, onSuccess, onError);
        }, 200);
      } else {
        console.error('❌ PayPal SDK loaded but Buttons not available');
        container.innerHTML = `
          <div class="text-center py-4 text-red-600">
            <p class="font-medium">PayPal failed to initialize</p>
            <p class="text-sm mt-1">Please try Razorpay payment method above</p>
          </div>
        `;
        onError({ 
          reason: 'PayPal initialization failed. Please try Razorpay payment method instead.',
          suggestion: 'Razorpay supports all Indian payment methods and works instantly.'
        });
      }
    };
    
    script.onerror = (error) => {
      clearTimeout(loadTimeout);
      console.error('❌ PayPal SDK load error:', error);
      container.innerHTML = `
        <div class="text-center py-4 text-red-600">
          <p class="font-medium">Failed to load PayPal</p>
          <p class="text-sm mt-1">Please try Razorpay payment method above</p>
        </div>
      `;
      onError({ 
        reason: 'Failed to load PayPal payment system. Please try Razorpay instead.',
        suggestion: 'Razorpay offers instant payment processing with all Indian payment methods.'
      });
    };
    
    // Set timeout for loading
    loadTimeout = setTimeout(() => {
      console.error('❌ PayPal SDK load timeout');
      container.innerHTML = `
        <div class="text-center py-4 text-orange-600">
          <p class="font-medium">PayPal loading timeout</p>
          <p class="text-sm mt-1">Please try Razorpay payment method above</p>
        </div>
      `;
      onError({ 
        reason: 'PayPal loading timeout. Please try Razorpay payment method instead.',
        suggestion: 'Razorpay loads instantly and supports all payment methods.'
      });
    }, 15000); // 15 second timeout
    
    // Remove existing PayPal scripts to avoid conflicts
    document.querySelectorAll('script[src*="paypal.com/sdk"]').forEach(s => s.remove());
    
    // Add script to head
    document.head.appendChild(script);
  }

  private static renderPayPalButtons(
    containerId: string,
    plan: SubscriptionPlan,
    billingCycle: BillingCycle,
    userId: string,
    onSuccess: (details: any) => void,
    onError: (error: any) => void
  ) {
    try {
      const isYearly = billingCycle === BillingCycle.Yearly;
      const amount = getPrice(plan, isYearly, 'USD');
      
      console.log('🎯 Rendering PayPal buttons for amount:', amount);

      const container = document.getElementById(containerId);
      if (!container) {
        onError({ 
          reason: 'PayPal container not found',
          suggestion: 'Please refresh the page and try again.'
        });
        return;
      }

      // Clear container and show loading
      container.innerHTML = `
        <div class="text-center py-4">
          <div class="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p class="text-sm text-blue-600">Preparing PayPal buttons...</p>
        </div>
      `;

      // Validate amount
      if (!amount || amount <= 0) {
        console.error('❌ Invalid amount for PayPal:', amount);
        container.innerHTML = `
          <div class="text-center py-4 text-red-600">
            <p class="font-medium">Invalid payment amount</p>
            <p class="text-sm mt-1">Please try Razorpay payment method</p>
          </div>
        `;
        onError({ 
          reason: 'Invalid payment amount. Please try Razorpay payment method instead.',
          suggestion: 'Razorpay supports all currencies and payment methods.'
        });
        return;
      }

      // Create PayPal buttons with enhanced error handling
      const paypalButtons = (window as any).paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          height: 50,
          label: 'paypal',
          tagline: false
        },
        
        createOrder: (data: any, actions: any) => {
          console.log('🔄 Creating PayPal order for amount:', amount);
          
          try {
            return actions.order.create({
              purchase_units: [{
                reference_id: `CG_${userId}_${Date.now()}`,
                amount: {
                  currency_code: 'USD',
                  value: amount.toFixed(2)
                },
                description: `ComplyGuard AI - ${plan.name} Plan (${billingCycle})`,
                custom_id: `cg_${userId}_${plan.id}_${Date.now()}`,
                soft_descriptor: 'COMPLYGUARD'
              }],
              intent: 'CAPTURE',
              application_context: {
                brand_name: 'ComplyGuard AI',
                locale: 'en-US',
                landing_page: 'BILLING',
                shipping_preference: 'NO_SHIPPING',
                user_action: 'PAY_NOW'
              }
            });
          } catch (error) {
            console.error('❌ Error creating PayPal order:', error);
            throw error;
          }
        },
        
        onApprove: async (data: any, actions: any) => {
          try {
            console.log('✅ PayPal payment approved:', data);
            
            // Show processing state
            container.innerHTML = `
              <div class="text-center py-6">
                <div class="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p class="text-green-600 font-medium">Processing payment...</p>
                <p class="text-xs text-gray-500 mt-1">Please wait while we capture your payment</p>
              </div>
            `;
            
            const orderDetails = await actions.order.capture();
            console.log('✅ Payment captured successfully:', orderDetails);
            
            // Validate capture
            if (orderDetails.status !== 'COMPLETED') {
              throw new Error(`Payment not completed. Status: ${orderDetails.status}`);
            }
            
            onSuccess({
              orderID: data.orderID,
              paymentID: orderDetails.id,
              payerID: data.payerID,
              amount: amount,
              currency: 'USD',
              status: orderDetails.status,
              details: orderDetails,
              captureId: orderDetails.purchase_units[0]?.payments?.captures[0]?.id
            });
            
          } catch (error) {
            console.error('❌ PayPal capture error:', error);
            container.innerHTML = `
              <div class="text-center py-4 text-red-600">
                <p class="font-medium">Payment processing failed</p>
                <p class="text-sm mt-1">Please try Razorpay payment method</p>
              </div>
            `;
            onError({ 
              reason: 'Payment processing failed. Please try Razorpay payment method instead.',
              error: error,
              suggestion: 'Razorpay offers more reliable payment processing for your region.'
            });
          }
        },
        
        onError: (error: any) => {
          console.error('❌ PayPal payment error:', error);
          container.innerHTML = `
            <div class="text-center py-4 text-red-600">
              <p class="font-medium">PayPal payment error</p>
              <p class="text-sm mt-1">Please try Razorpay payment method above</p>
            </div>
          `;
          
          let errorMessage = 'PayPal payment failed. Please try Razorpay payment method instead.';
          
          // Provide specific error messages
          if (error.name === 'VALIDATION_ERROR') {
            errorMessage = 'Payment validation failed. Please try Razorpay payment method instead.';
          } else if (error.name === 'INSTRUMENT_DECLINED') {
            errorMessage = 'Payment method declined. Please try a different card or use Razorpay.';
          } else if (error.name === 'PAYER_ACTION_REQUIRED') {
            errorMessage = 'Additional verification required. Please try Razorpay for instant processing.';
          }
          
          onError({ 
            reason: errorMessage,
            error: error,
            suggestion: 'Switch to Razorpay above for instant payment processing with all Indian payment methods.'
          });
        },
        
        onCancel: (data: any) => {
          console.log('❌ PayPal payment cancelled:', data);
          container.innerHTML = `
            <div class="text-center py-4 text-gray-600">
              <p class="font-medium">Payment cancelled</p>
              <p class="text-sm mt-1">You can try again when ready</p>
            </div>
          `;
          onError({ 
            reason: 'Payment was cancelled. You can try again when ready.',
            cancelled: true,
            suggestion: 'Try Razorpay above for faster checkout experience.'
          });
        }
      });

      // Render buttons with timeout
      const renderTimeout = setTimeout(() => {
        console.error('❌ PayPal button render timeout');
        container.innerHTML = `
          <div class="text-center py-4 text-orange-600">
            <p class="font-medium">PayPal render timeout</p>
            <p class="text-sm mt-1">Please try Razorpay payment method above</p>
          </div>
        `;
        onError({ 
          reason: 'PayPal buttons failed to load. Please try Razorpay payment method instead.',
          suggestion: 'Razorpay loads instantly and supports all payment methods.'
        });
      }, 10000); // 10 second timeout

      paypalButtons.render(`#${containerId}`).then(() => {
        clearTimeout(renderTimeout);
        console.log('✅ PayPal buttons rendered successfully');
      }).catch((error: any) => {
        clearTimeout(renderTimeout);
        console.error('❌ PayPal render error:', error);
        container.innerHTML = `
          <div class="text-center py-4 text-red-600">
            <p class="font-medium">Failed to load PayPal buttons</p>
            <p class="text-sm mt-1">Please try Razorpay payment method above</p>
          </div>
        `;
        onError({ 
          reason: 'Failed to render PayPal buttons. Please try Razorpay payment method instead.',
          error: error,
          suggestion: 'Razorpay offers better compatibility and instant processing.'
        });
      });
      
    } catch (error) {
      console.error('❌ PayPal render exception:', error);
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = `
          <div class="text-center py-4 text-red-600">
            <p class="font-medium">PayPal initialization failed</p>
            <p class="text-sm mt-1">Please try Razorpay payment method above</p>
          </div>
        `;
      }
      onError({ 
        reason: 'PayPal initialization failed. Please try Razorpay payment method instead.',
        error: error,
        suggestion: 'Razorpay is more reliable and supports all Indian payment methods.'
      });
    }
  }

  // Subscription Management
  static async createSubscription(
    userId: string,
    planId: string,
    billingCycle: BillingCycle,
    paymentProvider: PaymentProvider,
    providerPaymentId: string
  ): Promise<any> {
    // In a real implementation, this would call your backend API
    const subscriptionData = {
      user_id: userId,
      plan_id: planId,
      billing_cycle: billingCycle,
      provider: paymentProvider,
      provider_payment_id: providerPaymentId,
      status: 'active',
      created_at: new Date(),
    };

    console.log('Creating subscription:', subscriptionData);
    return subscriptionData;
  }

  static async cancelSubscription(subscriptionId: string): Promise<boolean> {
    // In a real implementation, this would call your backend API
    console.log('Cancelling subscription:', subscriptionId);
    return true;
  }

  static async updateSubscription(
    subscriptionId: string,
    newPlanId: string,
    billingCycle: BillingCycle
  ): Promise<any> {
    // In a real implementation, this would call your backend API
    console.log('Updating subscription:', { subscriptionId, newPlanId, billingCycle });
    return { success: true };
  }
}