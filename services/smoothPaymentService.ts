import { PaymentProvider, BillingCycle, SubscriptionPlan } from '../types';
import { getPrice } from '../config/subscriptionPlans';

// Enhanced payment configuration
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_R7dfHLEHcCCibm';
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'AYTvYjBG2seZa0FGQlKVLUDH4Mp1ml2BmqEDxgb8ysdoLnVEoa0q7Ceu0ycycxpBu8Nx2iPlW1SpOz5K';
const PAYPAL_ENVIRONMENT = import.meta.env.VITE_PAYPAL_ENVIRONMENT || 'sandbox';

export interface PaymentResult {
  success: boolean;
  paymentId: string;
  orderId: string;
  provider: PaymentProvider;
  amount: number;
  currency: string;
  error?: string;
}

export class SmoothPaymentService {
  
  // Auto-detect optimal payment provider
  static async detectOptimalProvider(): Promise<PaymentProvider> {
    try {
      // Try to get user's location
      const response = await fetch('https://ipapi.co/json/', { timeout: 3000 } as any);
      const data = await response.json();
      
      // Indian users get Razorpay, others get PayPal
      return data.country_code === 'IN' ? PaymentProvider.Razorpay : PaymentProvider.PayPal;
    } catch (error) {
      // Fallback: detect from browser locale
      const locale = navigator.language || 'en-US';
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      if (locale.includes('hi') || timezone.includes('Kolkata') || timezone.includes('Mumbai')) {
        return PaymentProvider.Razorpay;
      }
      
      return PaymentProvider.PayPal;
    }
  }

  // Smooth Razorpay payment with enhanced UX
  static async processRazorpayPayment(
    plan: SubscriptionPlan,
    billingCycle: BillingCycle,
    userId: string,
    userEmail: string,
    onProgress: (message: string) => void
  ): Promise<PaymentResult> {
    return new Promise((resolve, reject) => {
      onProgress('Creating secure payment order...');
      
      const isYearly = billingCycle === BillingCycle.Yearly;
      const amount = getPrice(plan, isYearly, 'INR') * 100; // Convert to paise
      
      // Create optimized Razorpay order
      const order = {
        id: `order_${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
        amount: amount,
        currency: 'INR',
        receipt: `cg_${userId}_${Date.now()}`,
        notes: {
          plan_id: plan.id,
          plan_name: plan.name,
          user_id: userId,
          billing_cycle: billingCycle
        }
      };

      onProgress('Opening payment gateway...');

      // Enhanced Razorpay options for smooth experience
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'ComplyGuard AI',
        description: `${plan.name} Plan - AI-Powered Compliance`,
        order_id: order.id,
        prefill: {
          email: userEmail,
          name: userEmail.split('@')[0]
        },
        theme: {
          color: '#2563eb'
        },
        method: {
          netbanking: true,
          card: true,
          upi: true,
          wallet: true,
          emi: true,
          paylater: true
        },
        handler: (response: any) => {
          resolve({
            success: true,
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            provider: PaymentProvider.Razorpay,
            amount: amount / 100,
            currency: 'INR'
          });
        },
        modal: {
          ondismiss: () => {
            reject({
              success: false,
              error: 'Payment cancelled by user',
              provider: PaymentProvider.Razorpay
            });
          }
        }
      };

      // Load and initialize Razorpay
      this.loadRazorpaySDK().then(() => {
        try {
          const rzp = new (window as any).Razorpay(options);
          
          rzp.on('payment.failed', (response: any) => {
            reject({
              success: false,
              error: this.getRazorpayErrorMessage(response.error),
              provider: PaymentProvider.Razorpay
            });
          });
          
          rzp.open();
        } catch (error) {
          reject({
            success: false,
            error: 'Failed to initialize payment. Please refresh and try again.',
            provider: PaymentProvider.Razorpay
          });
        }
      }).catch(() => {
        reject({
          success: false,
          error: 'Failed to load payment system. Please check your connection.',
          provider: PaymentProvider.Razorpay
        });
      });
    });
  }

  // Smooth PayPal payment with enhanced UX
  static async processPayPalPayment(
    plan: SubscriptionPlan,
    billingCycle: BillingCycle,
    userId: string,
    containerId: string,
    onProgress: (message: string) => void
  ): Promise<PaymentResult> {
    return new Promise((resolve, reject) => {
      onProgress('Initializing PayPal payment...');
      
      const isYearly = billingCycle === BillingCycle.Yearly;
      const amount = getPrice(plan, isYearly, 'USD');

      this.loadPayPalSDK().then(() => {
        const container = document.getElementById(containerId);
        if (!container) {
          reject({
            success: false,
            error: 'Payment container not found',
            provider: PaymentProvider.PayPal
          });
          return;
        }

        container.innerHTML = '';

        (window as any).paypal.Buttons({
          style: {
            layout: 'vertical',
            color: 'blue',
            shape: 'rect',
            height: 50,
            label: 'paypal'
          },
          
          createOrder: (data: any, actions: any) => {
            return actions.order.create({
              purchase_units: [{
                amount: {
                  currency_code: 'USD',
                  value: amount.toFixed(2)
                },
                description: `ComplyGuard AI - ${plan.name} Plan`
              }],
              intent: 'CAPTURE'
            });
          },
          
          onApprove: async (data: any, actions: any) => {
            try {
              onProgress('Processing payment...');
              const orderDetails = await actions.order.capture();
              
              resolve({
                success: true,
                paymentId: orderDetails.id,
                orderId: data.orderID,
                provider: PaymentProvider.PayPal,
                amount: amount,
                currency: 'USD'
              });
            } catch (error) {
              reject({
                success: false,
                error: 'Payment processing failed',
                provider: PaymentProvider.PayPal
              });
            }
          },
          
          onError: (error: any) => {
            reject({
              success: false,
              error: 'PayPal payment failed',
              provider: PaymentProvider.PayPal
            });
          },
          
          onCancel: () => {
            reject({
              success: false,
              error: 'Payment cancelled',
              provider: PaymentProvider.PayPal
            });
          }
        }).render(`#${containerId}`);
        
      }).catch(() => {
        reject({
          success: false,
          error: 'Failed to load PayPal',
          provider: PaymentProvider.PayPal
        });
      });
    });
  }

  // Enhanced SDK loading with better error handling
  private static loadRazorpaySDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).Razorpay) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      
      const timeout = setTimeout(() => {
        reject(new Error('Razorpay SDK load timeout'));
      }, 10000);
      
      script.onload = () => {
        clearTimeout(timeout);
        if ((window as any).Razorpay) {
          resolve();
        } else {
          reject(new Error('Razorpay SDK not available'));
        }
      };
      
      script.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Failed to load Razorpay SDK'));
      };
      
      document.head.appendChild(script);
    });
  }

  private static loadPayPalSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).paypal && (window as any).paypal.Buttons) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture`;
      script.async = true;
      
      const timeout = setTimeout(() => {
        reject(new Error('PayPal SDK load timeout'));
      }, 15000);
      
      script.onload = () => {
        clearTimeout(timeout);
        if ((window as any).paypal && (window as any).paypal.Buttons) {
          resolve();
        } else {
          reject(new Error('PayPal SDK not available'));
        }
      };
      
      script.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Failed to load PayPal SDK'));
      };
      
      document.head.appendChild(script);
    });
  }

  // User-friendly error messages
  private static getRazorpayErrorMessage(error: any): string {
    switch (error.code) {
      case 'BAD_REQUEST_ERROR':
        return 'Please check your card details and try again.';
      case 'GATEWAY_ERROR':
        return 'Bank gateway issue. Please try a different payment method.';
      case 'NETWORK_ERROR':
        return 'Network issue. Please check your connection and try again.';
      case 'SERVER_ERROR':
        return 'Temporary server issue. Please try again in a few minutes.';
      default:
        return 'Payment failed. Please try with a different card or payment method.';
    }
  }

  // Create subscription after successful payment
  static async createSubscription(
    userId: string,
    planId: string,
    billingCycle: BillingCycle,
    paymentProvider: PaymentProvider,
    paymentId: string
  ): Promise<any> {
    // Simulate subscription creation
    const subscription = {
      id: `sub_${Date.now()}`,
      user_id: userId,
      plan_id: planId,
      billing_cycle: billingCycle,
      provider: paymentProvider,
      payment_id: paymentId,
      status: 'active',
      created_at: new Date(),
      next_billing_date: new Date(Date.now() + (billingCycle === BillingCycle.Yearly ? 365 : 30) * 24 * 60 * 60 * 1000)
    };

    console.log('✅ Subscription created:', subscription);
    return subscription;
  }
}