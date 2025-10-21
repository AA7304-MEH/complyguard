import { PaymentProvider, BillingCycle, PaymentIntent, SubscriptionPlan } from '../types';
import { SUBSCRIPTION_PLANS, getPrice } from '../config/subscriptionPlans';

// Razorpay configuration - LIVE KEYS
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_R7dfHLEHcCCibm';
const RAZORPAY_KEY_SECRET = import.meta.env.VITE_RAZORPAY_KEY_SECRET || '';

// PayPal configuration - LIVE KEYS  
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'AYTvYjBG2seZa0FGQlKVLUDH4Mp1ml2BmqEDxgb8ysdoLnVEoa0q7Ceu0ycycxpBu8Nx2iPlW1SpOz5K';
const PAYPAL_CLIENT_SECRET = import.meta.env.VITE_PAYPAL_CLIENT_SECRET || 'EOhOu8iPdURh0vHiRZ6KQ3j_9guZFpTFoDzknADKzN5DAwnKnpAeXMnCXESSHZsiBsM59fzzND-c27n9';
const PAYPAL_ENVIRONMENT = import.meta.env.VITE_PAYPAL_ENVIRONMENT || 'production';

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

  // Razorpay Integration
  static async createRazorpayOrder(
    plan: SubscriptionPlan,
    billingCycle: BillingCycle,
    userId: string
  ): Promise<any> {
    const isYearly = billingCycle === BillingCycle.Yearly;
    const amount = getPrice(plan, isYearly, 'INR') * 100; // Razorpay expects amount in paise

    const orderData = {
      amount,
      currency: 'INR',
      receipt: `cg_${userId}_${Date.now()}`,
      payment_capture: 1, // Auto capture payment
      notes: {
        plan_id: plan.id,
        plan_name: plan.name,
        user_id: userId,
        billing_cycle: billingCycle,
        service: 'ComplyGuard AI'
      },
    };

    try {
      // In production, this would call your backend API
      // For now, we'll simulate the order creation
      console.log('Creating Razorpay order:', orderData);
      
      // Simulate API response
      const order = {
        id: `order_${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
        entity: 'order',
        amount: orderData.amount,
        amount_paid: 0,
        amount_due: orderData.amount,
        currency: orderData.currency,
        receipt: orderData.receipt,
        status: 'created',
        attempts: 0,
        notes: orderData.notes,
        created_at: Math.floor(Date.now() / 1000)
      };

      return order;
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      throw new Error('Failed to create payment order. Please try again.');
    }
  }

  static initializeRazorpayCheckout(
    order: any,
    plan: SubscriptionPlan,
    userEmail: string,
    onSuccess: (response: any) => void,
    onError: (error: any) => void
  ) {
    const options = {
      key: RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'ComplyGuard AI',
      description: `${plan.name} Plan - AI-Powered Compliance Platform`,
      image: 'https://cdn.jsdelivr.net/gh/razorpay/razorpay-checkout@master/images/rzp.png',
      order_id: order.id,
      prefill: {
        email: userEmail,
        contact: '', // Add phone if available
        name: userEmail.split('@')[0], // Extract name from email
      },
      config: {
        display: {
          blocks: {
            banks: {
              name: 'Pay using Net Banking',
              instruments: [
                { method: 'netbanking', banks: ['HDFC', 'ICICI', 'SBI', 'AXIS', 'KOTAK', 'YESB', 'UTIB'] },
              ],
            },
            other: {
              name: 'Other Payment Methods',
              instruments: [
                { method: 'card', types: ['credit', 'debit'] },
                { method: 'upi' },
                { method: 'wallet', wallets: ['paytm', 'mobikwik', 'phonepe', 'amazonpay', 'freecharge'] },
                { method: 'emi' },
                { method: 'paylater', providers: ['getsimpl', 'icic', 'hdfc'] },
              ],
            },
          },
          sequence: ['block.banks', 'block.other'],
          preferences: {
            show_default_blocks: true,
          },
        },
      },
      method: {
        netbanking: true,
        card: true,
        upi: true,
        wallet: true,
        emi: true,
        paylater: true,
      },
      notes: {
        plan_name: plan.name,
        plan_id: plan.id,
        service: 'ComplyGuard AI Subscription',
      },
      theme: {
        color: '#2563eb',
        backdrop_color: 'rgba(0, 0, 0, 0.6)',
      },
      handler: (response: any) => {
        console.log('Razorpay payment successful:', response);
        onSuccess({
          ...response,
          payment_method: 'razorpay',
          order_id: order.id,
        });
      },
      modal: {
        ondismiss: () => {
          console.log('Razorpay payment modal dismissed');
          onError({ 
            reason: 'Payment cancelled by user',
            code: 'PAYMENT_CANCELLED'
          });
        },
        escape: true,
        animation: true,
        confirm_close: true,
      },
      retry: {
        enabled: true,
        max_count: 3,
      },
      timeout: 300, // 5 minutes timeout
      remember_customer: false,
      readonly: {
        email: true,
        contact: false,
        name: false,
      },
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
    // Validate PayPal Client ID
    if (!PAYPAL_CLIENT_ID) {
      onError({ reason: 'PayPal configuration missing. Please contact support.' });
      return;
    }

    // Clear any existing PayPal buttons
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '<div class="text-center text-gray-500 text-sm">Loading PayPal...</div>';
    }

    // Check if PayPal SDK is already loaded
    if ((window as any).paypal) {
      this.renderPayPalButtons(containerId, plan, billingCycle, userId, onSuccess, onError);
      return;
    }

    // Load PayPal SDK dynamically with production environment
    console.log('🔄 Loading PayPal SDK...');
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture&enable-funding=venmo,paylater,card&disable-funding=credit&debug=false`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      try {
        console.log('✅ PayPal SDK loaded successfully');
        
        if (!(window as any).paypal) {
          throw new Error('PayPal SDK not available after loading');
        }
        
        // Small delay to ensure SDK is fully initialized
        setTimeout(() => {
          this.renderPayPalButtons(containerId, plan, billingCycle, userId, onSuccess, onError);
        }, 200);
        
      } catch (error) {
        console.error('❌ Error after PayPal SDK load:', error);
        onError({ reason: 'Failed to initialize PayPal. Please refresh and try again.' });
      }
    };
    
    script.onerror = (error) => {
      console.error('❌ PayPal SDK script load error:', error);
      onError({ reason: 'Failed to load PayPal SDK. Please check your internet connection and try again.' });
    };
    
    // Remove any existing PayPal scripts
    const existingScripts = document.querySelectorAll('script[src*="paypal.com/sdk"]');
    existingScripts.forEach(s => s.remove());
    
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
      
      console.log('🎯 Rendering PayPal buttons:', {
        containerId,
        amount,
        plan: plan.name,
        billingCycle
      });

      const container = document.getElementById(containerId);
      if (!container) {
        console.error('❌ PayPal container not found:', containerId);
        onError({ reason: 'PayPal container not found. Please refresh the page.' });
        return;
      }

      // Clear container and show loading
      container.innerHTML = '<div class="text-center text-blue-600 py-4">Loading PayPal buttons...</div>';

      (window as any).paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'paypal',
          height: 50,
          tagline: false,
        },
        createOrder: (data: any, actions: any) => {
          try {
            console.log('🔄 Creating PayPal order for amount:', amount);
            
            const orderData = {
              purchase_units: [{
                amount: {
                  currency_code: 'USD',
                  value: amount.toFixed(2),
                },
                description: `ComplyGuard AI - ${plan.name} Plan (${billingCycle} billing)`,
                custom_id: `cg_${userId}_${plan.id}_${billingCycle}_${Date.now()}`,
              }],
              application_context: {
                brand_name: 'ComplyGuard AI',
                locale: 'en-US',
                landing_page: 'BILLING',
                shipping_preference: 'NO_SHIPPING',
                user_action: 'PAY_NOW',
              },
            };
            
            console.log('📦 PayPal order data:', orderData);
            return actions.order.create(orderData);
            
          } catch (error) {
            console.error('❌ Error in createOrder:', error);
            onError({ reason: 'Failed to create payment order. Please try again.' });
            return Promise.reject(error);
          }
        },
        onApprove: async (data: any, actions: any) => {
          try {
            console.log('PayPal payment approved:', data);
            
            // Show loading state
            if (container) {
              container.innerHTML = '<div class="text-center text-blue-600">Processing payment...</div>';
            }
            
            // Capture the payment
            const orderDetails = await actions.order.capture();
            console.log('Payment captured successfully:', orderDetails);
            
            // Extract payment information
            const paymentInfo = {
              orderID: data.orderID,
              paymentID: orderDetails.id,
              payerID: data.payerID,
              amount: amount,
              currency: 'USD',
              status: orderDetails.status,
              details: orderDetails,
              provider: 'PayPal',
            };
            
            onSuccess(paymentInfo);
          } catch (error) {
            console.error('Error capturing PayPal payment:', error);
            onError({ 
              reason: 'Payment capture failed. Please contact support with order ID: ' + data.orderID,
              orderID: data.orderID 
            });
          }
        },
        onError: (error: any) => {
          console.error('PayPal button error:', error);
          onError({ 
            reason: 'PayPal payment error. Please try again or use Razorpay instead.',
            error: error,
            suggestion: 'Try switching to Razorpay payment method above.'
          });
        },
        onCancel: (data: any) => {
          console.log('PayPal payment cancelled by user:', data);
          onError({ 
            reason: 'Payment was cancelled. You can try again when ready.',
            cancelled: true 
          });
        },
      }).render(`#${containerId}`).then(() => {
        console.log('PayPal buttons rendered successfully');
      }).catch((error: any) => {
        console.error('Error rendering PayPal buttons:', error);
        onError({ 
          reason: 'Failed to load PayPal payment options. Please refresh the page and try again.',
          error: error 
        });
      });
    } catch (error) {
      console.error('Error in renderPayPalButtons:', error);
      onError({ reason: 'Failed to initialize PayPal payment. Please try again.' });
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