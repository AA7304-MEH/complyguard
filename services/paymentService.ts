import { PaymentProvider, BillingCycle, PaymentIntent, SubscriptionPlan } from '../types';
import { SUBSCRIPTION_PLANS, getPrice } from '../config/subscriptionPlans';

// Razorpay configuration - LIVE KEYS
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

// PayPal configuration - LIVE KEYS
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
const PAYPAL_ENVIRONMENT = process.env.PAYPAL_ENVIRONMENT || 'production'; // Now using production

// Validate that we have the required keys
if (!RAZORPAY_KEY_ID) {
  console.warn('Razorpay Key ID not found. Razorpay payments will not work.');
}
if (!PAYPAL_CLIENT_ID) {
  console.warn('PayPal Client ID not found. PayPal payments will not work.');
}

export interface PaymentConfig {
  provider: PaymentProvider;
  currency: 'USD' | 'INR';
  isYearly: boolean;
}

export class PaymentService {
  
  static detectPaymentProvider(userLocation?: string): PaymentProvider {
    // Simple geo-detection logic - in production, use proper IP geolocation
    if (userLocation === 'IN' || userLocation === 'India') {
      return PaymentProvider.Razorpay;
    }
    return PaymentProvider.PayPal;
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

    // Load Razorpay script dynamically
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      try {
        if (!(window as any).Razorpay) {
          throw new Error('Razorpay SDK not loaded');
        }

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
          console.log('Razorpay payment success event:', response);
        });
        
        rzp.open();
      } catch (error) {
        console.error('Error initializing Razorpay:', error);
        onError({ 
          reason: 'Failed to initialize payment system. Please refresh the page and try again.',
          error: error
        });
      }
    };
    
    script.onerror = () => {
      onError({ 
        reason: 'Failed to load Razorpay payment system. Please check your internet connection and try again.',
        code: 'SCRIPT_LOAD_ERROR'
      });
    };
    
    document.head.appendChild(script);
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
    // Load PayPal SDK dynamically with production environment
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture&enable-funding=venmo,paylater`;
    
    script.onload = () => {
      try {
        (window as any).paypal.Buttons({
          style: {
            layout: 'vertical',
            color: 'blue',
            shape: 'rect',
            label: 'paypal',
            height: 45,
          },
          createOrder: async (data: any, actions: any) => {
            try {
              const isYearly = billingCycle === BillingCycle.Yearly;
              const amount = getPrice(plan, isYearly, 'USD');
              
              return actions.order.create({
                purchase_units: [{
                  amount: {
                    currency_code: 'USD',
                    value: amount.toString(),
                  },
                  description: `ComplyGuard AI - ${plan.name} Plan (${billingCycle})`,
                  custom_id: `${userId}_${plan.id}_${billingCycle}`,
                }],
                application_context: {
                  brand_name: 'ComplyGuard AI',
                  landing_page: 'BILLING',
                  user_action: 'PAY_NOW',
                  shipping_preference: 'NO_SHIPPING',
                },
              });
            } catch (error) {
              console.error('Error creating PayPal order:', error);
              onError({ reason: 'Failed to create payment order' });
            }
          },
          onApprove: async (data: any, actions: any) => {
            try {
              console.log('PayPal payment approved:', data);
              
              // Capture the payment
              const details = await actions.order.capture();
              console.log('Payment captured:', details);
              
              // Show success message
              onSuccess({
                orderID: data.orderID,
                paymentID: details.id,
                payerID: data.payerID,
                details: details,
              });
            } catch (error) {
              console.error('Error capturing PayPal payment:', error);
              onError({ reason: 'Payment processing failed. Please contact support.' });
            }
          },
          onError: (error: any) => {
            console.error('PayPal error:', error);
            onError({ 
              reason: 'Payment system error', 
              error: error,
              description: 'Please try again or contact support if the issue persists.'
            });
          },
          onCancel: (data: any) => {
            console.log('PayPal payment cancelled:', data);
            onError({ reason: 'Payment cancelled by user' });
          },
        }).render(`#${containerId}`);
      } catch (error) {
        console.error('Error initializing PayPal:', error);
        onError({ reason: 'Failed to initialize PayPal. Please refresh and try again.' });
      }
    };
    
    script.onerror = () => {
      onError({ reason: 'Failed to load PayPal. Please check your internet connection.' });
    };
    
    document.head.appendChild(script);
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