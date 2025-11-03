import { PaymentProvider, BillingCycle, SubscriptionPlan } from '../types';
import { getPrice } from '../config/subscriptionPlans';

// Optimized payment configuration
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_R7dfHLEHcCCibm';
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'AYTvYjBG2seZa0FGQlKVLUDH4Mp1ml2BmqEDxgb8ysdoLnVEoa0q7Ceu0ycycxpBu8Nx2iPlW1SpOz5K';
const PAYPAL_ENVIRONMENT = import.meta.env.VITE_PAYPAL_ENVIRONMENT || 'sandbox';

export class SmoothPaymentService {
  
  // Preload payment SDKs for instant access
  static async preloadPaymentSDKs(): Promise<void> {
    const promises = [];
    
    // Preload Razorpay SDK
    if (!document.querySelector('script[src*="razorpay.com"]')) {
      promises.push(this.loadRazorpaySDK());
    }
    
    // Preload PayPal SDK
    if (!document.querySelector('script[src*="paypal.com/sdk"]')) {
      promises.push(this.loadPayPalSDK());
    }
    
    await Promise.allSettled(promises);
  }
  
  private static loadRazorpaySDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
      document.head.appendChild(script);
    });
  }
  
  private static loadPayPalSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load PayPal SDK'));
      document.head.appendChild(script);
    });
  }
  
  // Instant payment processing with pre-loaded SDKs
  static async processInstantPayment(
    provider: PaymentProvider,
    plan: SubscriptionPlan,
    billingCycle: BillingCycle,
    userId: string,
    userEmail: string,
    onProgress: (message: string) => void,
    onSuccess: (result: any) => void,
    onError: (error: any) => void
  ): Promise<void> {
    
    try {
      if (provider === PaymentProvider.Razorpay) {
        await this.processRazorpayInstant(plan, billingCycle, userId, userEmail, onProgress, onSuccess, onError);
      } else {
        await this.processPayPalInstant(plan, billingCycle, userId, onProgress, onSuccess, onError);
      }
    } catch (error) {
      onError({
        reason: 'Payment initialization failed',
        error,
        suggestion: `Try switching to ${provider === PaymentProvider.Razorpay ? 'PayPal' : 'Razorpay'}`
      });
    }
  }
  
  private static async processRazorpayInstant(
    plan: SubscriptionPlan,
    billingCycle: BillingCycle,
    userId: string,
    userEmail: string,
    onProgress: (message: string) => void,
    onSuccess: (result: any) => void,
    onError: (error: any) => void
  ): Promise<void> {
    
    onProgress('Creating secure payment order...');
    
    const isYearly = billingCycle === BillingCycle.Yearly;
    const amount = getPrice(plan, isYearly, 'INR') * 100;
    
    const order = {
      id: `order_${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
      amount: amount,
      currency: 'INR',
      receipt: `cg_${userId}_${Date.now()}`,
      status: 'created'
    };
    
    onProgress('Opening payment gateway...');
    
    // Ensure Razorpay is loaded
    if (!(window as any).Razorpay) {
      await this.loadRazorpaySDK();
    }
    
    const options = {
      key: RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'ComplyGuard AI',
      description: `${plan.name} Plan - AI-Powered Compliance`,
      order_id: order.id,
      prefill: {
        email: userEmail,
        name: userEmail.split('@')[0],
      },
      theme: {
        color: '#2563eb'
      },
      handler: (response: any) => {
        onSuccess({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
          payment_method: 'razorpay',
        });
      },
      modal: {
        ondismiss: () => {
          onError({ 
            reason: 'Payment cancelled by user',
            cancelled: true
          });
        }
      }
    };
    
    const rzp = new (window as any).Razorpay(options);
    
    rzp.on('payment.failed', (response: any) => {
      onError({
        reason: 'Payment failed',
        error: response.error,
        suggestion: 'Try a different payment method or switch to PayPal'
      });
    });
    
    rzp.open();
  }
  
  private static async processPayPalInstant(
    plan: SubscriptionPlan,
    billingCycle: BillingCycle,
    userId: string,
    onProgress: (message: string) => void,
    onSuccess: (result: any) => void,
    onError: (error: any) => void
  ): Promise<void> {
    
    onProgress('Initializing PayPal payment...');
    
    // Ensure PayPal is loaded
    if (!(window as any).paypal) {
      await this.loadPayPalSDK();
    }
    
    const isYearly = billingCycle === BillingCycle.Yearly;
    const amount = getPrice(plan, isYearly, 'USD');
    
    // Create a temporary container for PayPal buttons
    const tempContainer = document.createElement('div');
    tempContainer.id = 'temp-paypal-container';
    tempContainer.style.position = 'fixed';
    tempContainer.style.top = '-1000px';
    tempContainer.style.left = '-1000px';
    document.body.appendChild(tempContainer);
    
    try {
      await (window as any).paypal.Buttons({
        createOrder: (data: any, actions: any) => {
          return actions.order.create({
            purchase_units: [{
              amount: {
                currency_code: 'USD',
                value: amount.toFixed(2)
              },
              description: `ComplyGuard AI - ${plan.name} Plan`
            }]
          });
        },
        onApprove: async (data: any, actions: any) => {
          try {
            const orderDetails = await actions.order.capture();
            onSuccess({
              orderID: data.orderID,
              paymentID: orderDetails.id,
              amount: amount,
              currency: 'USD',
              status: orderDetails.status,
              details: orderDetails
            });
          } catch (error) {
            onError({ 
              reason: 'Payment capture failed',
              error,
              suggestion: 'Try Razorpay payment method instead'
            });
          }
        },
        onError: (error: any) => {
          onError({ 
            reason: 'PayPal payment failed',
            error,
            suggestion: 'Try Razorpay payment method instead'
          });
        },
        onCancel: () => {
          onError({ 
            reason: 'Payment cancelled',
            cancelled: true
          });
        }
      }).render('#temp-paypal-container');
      
      // Trigger the first PayPal button click to start payment
      const paypalButton = tempContainer.querySelector('div[role="button"]') as HTMLElement;
      if (paypalButton) {
        paypalButton.click();
      } else {
        throw new Error('PayPal button not found');
      }
      
    } finally {
      // Clean up temporary container
      setTimeout(() => {
        if (tempContainer.parentNode) {
          tempContainer.parentNode.removeChild(tempContainer);
        }
      }, 1000);
    }
  }
  
  // Smart payment provider detection
  static detectOptimalProvider(): PaymentProvider {
    // Check user's timezone and language for better detection
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;
    
    // Indian indicators
    if (
      timezone.includes('Kolkata') ||
      timezone.includes('Mumbai') ||
      timezone.includes('Delhi') ||
      language.includes('hi') ||
      language.includes('IN')
    ) {
      return PaymentProvider.Razorpay;
    }
    
    return PaymentProvider.PayPal;
  }
  
  // Create subscription after successful payment
  static async createSubscription(
    userId: string,
    planId: string,
    billingCycle: BillingCycle,
    paymentProvider: PaymentProvider,
    providerPaymentId: string
  ): Promise<any> {
    
    const subscriptionData = {
      user_id: userId,
      plan_id: planId,
      billing_cycle: billingCycle,
      provider: paymentProvider,
      provider_payment_id: providerPaymentId,
      status: 'active',
      created_at: new Date(),
      next_billing_date: new Date(Date.now() + (billingCycle === BillingCycle.Yearly ? 365 : 30) * 24 * 60 * 60 * 1000)
    };
    
    // In production, this would call your backend API
    console.log('Creating subscription:', subscriptionData);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return subscriptionData;
  }
  
  // Get user's location for optimal payment method
  static async getUserLocation(): Promise<string> {
    try {
      const response = await fetch('https://ipapi.co/json/', { 
        timeout: 3000 
      } as any);
      const data = await response.json();
      return data.country_code || 'US';
    } catch (error) {
      // Fallback to timezone-based detection
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return timezone.includes('Asia/Kolkata') ? 'IN' : 'US';
    }
  }
}

// Initialize payment SDKs on module load for instant access
if (typeof window !== 'undefined') {
  // Preload SDKs after a short delay to not block initial page load
  setTimeout(() => {
    SmoothPaymentService.preloadPaymentSDKs().catch(console.error);
  }, 2000);
}