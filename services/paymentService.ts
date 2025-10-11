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
      receipt: `receipt_${userId}_${Date.now()}`,
      notes: {
        plan_id: plan.id,
        user_id: userId,
        billing_cycle: billingCycle,
      },
    };

    // In a real implementation, this would make an API call to your backend
    // which would then call Razorpay's API
    console.log('Creating Razorpay order:', orderData);
    
    // Mock response - replace with actual Razorpay API call
    return {
      id: `order_${Date.now()}`,
      amount: orderData.amount,
      currency: orderData.currency,
      receipt: orderData.receipt,
      status: 'created',
    };
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
      description: `${plan.name} Plan Subscription - Compliance Made Easy`,
      image: '/logo.png', // Add your logo here
      order_id: order.id,
      prefill: {
        email: userEmail,
        contact: '', // You can add phone number if available
      },
      notes: {
        plan_name: plan.name,
        plan_id: plan.id,
      },
      theme: {
        color: '#2563eb',
      },
      handler: (response: any) => {
        // Show success message
        console.log('Payment successful:', response);
        onSuccess(response);
      },
      modal: {
        ondismiss: () => {
          console.log('Payment modal closed');
          onError({ reason: 'Payment cancelled by user' });
        },
        // Escape key handling
        escape: true,
        // Animation
        animation: true,
      },
      retry: {
        enabled: true,
        max_count: 3,
      },
    };

    // Load Razorpay script dynamically
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      try {
        const rzp = new (window as any).Razorpay(options);
        
        // Handle payment failures
        rzp.on('payment.failed', (response: any) => {
          console.error('Payment failed:', response.error);
          onError({
            reason: 'Payment failed',
            error: response.error,
            description: response.error.description || 'Please try again or contact support'
          });
        });
        
        rzp.open();
      } catch (error) {
        console.error('Error initializing Razorpay:', error);
        onError({ reason: 'Failed to initialize payment. Please refresh and try again.' });
      }
    };
    
    script.onerror = () => {
      onError({ reason: 'Failed to load payment system. Please check your internet connection.' });
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
        amount: {
          currency_code: 'USD',
          value: amount.toString(),
        },
        description: `${plan.name} Plan - ${billingCycle} billing`,
        custom_id: `${userId}_${plan.id}_${billingCycle}`,
      }],
      application_context: {
        brand_name: 'ComplyGuard AI',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        return_url: `${window.location.origin}/payment/success`,
        cancel_url: `${window.location.origin}/payment/cancel`,
      },
    };

    // In a real implementation, this would make an API call to your backend
    console.log('Creating PayPal order:', orderData);
    
    // Mock response - replace with actual PayPal API call
    return {
      id: `PAYPAL_ORDER_${Date.now()}`,
      status: 'CREATED',
      links: [
        {
          rel: 'approve',
          href: `https://www.sandbox.paypal.com/checkoutnow?token=PAYPAL_ORDER_${Date.now()}`,
        },
      ],
    };
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