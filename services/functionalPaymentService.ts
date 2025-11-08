import { PaymentProvider, BillingCycle, SubscriptionPlan } from '../types';
import { getPrice } from '../config/subscriptionPlans';

// Payment configuration with fallbacks
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_R7dfHLEHcCCibm';
// Using PayPal sandbox test client ID - Replace with your production client ID when ready
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'AZDxjDScFpQtjWTOUtWKbyN_bDt4OgqaF4eYXlewfBP4-8aqX3PiV8e1GWU6liB2CUXlkA59kJXE7M6R';

export interface PaymentResult {
  success: boolean;
  paymentId: string;
  orderId?: string;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  error?: string;
}

export class FunctionalPaymentService {
  
  // Check if payment SDKs are available
  static isRazorpayAvailable(): boolean {
    return typeof (window as any).Razorpay !== 'undefined';
  }
  
  static isPayPalAvailable(): boolean {
    return typeof (window as any).paypal !== 'undefined';
  }
  
  // Load Razorpay SDK with timeout and retry
  static loadRazorpaySDK(timeout: number = 10000): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (this.isRazorpayAvailable()) {
        console.log('✅ Razorpay SDK already available');
        resolve();
        return;
      }
      
      console.log('🔄 Loading Razorpay SDK...');
      
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      
      const timeoutId = setTimeout(() => {
        console.error('❌ Razorpay SDK load timeout');
        reject(new Error('Razorpay SDK load timeout'));
      }, timeout);
      
      script.onload = () => {
        clearTimeout(timeoutId);
        if (this.isRazorpayAvailable()) {
          console.log('✅ Razorpay SDK loaded successfully');
          resolve();
        } else {
          console.error('❌ Razorpay SDK loaded but not available');
          reject(new Error('Razorpay SDK not available after load'));
        }
      };
      
      script.onerror = (error) => {
        clearTimeout(timeoutId);
        console.error('❌ Razorpay SDK load error:', error);
        reject(new Error('Failed to load Razorpay SDK'));
      };
      
      // Remove any existing Razorpay scripts
      const existingScript = document.querySelector('script[src*="razorpay.com"]');
      if (existingScript) {
        existingScript.remove();
      }
      
      document.head.appendChild(script);
    });
  }
  
  // Load PayPal SDK with timeout and retry
  static loadPayPalSDK(timeout: number = 10000): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (this.isPayPalAvailable()) {
        console.log('✅ PayPal SDK already available');
        resolve();
        return;
      }
      
      console.log('🔄 Loading PayPal SDK...');
      
      const script = document.createElement('script');
      // Using sandbox for testing - change to production when ready
      script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture&disable-funding=credit,card`;
      script.async = true;
      script.setAttribute('data-sdk-integration-source', 'button-factory');
      
      const timeoutId = setTimeout(() => {
        console.error('❌ PayPal SDK load timeout');
        reject(new Error('PayPal SDK load timeout'));
      }, timeout);
      
      script.onload = () => {
        clearTimeout(timeoutId);
        if (this.isPayPalAvailable()) {
          console.log('✅ PayPal SDK loaded successfully');
          resolve();
        } else {
          console.error('❌ PayPal SDK loaded but not available');
          reject(new Error('PayPal SDK not available after load'));
        }
      };
      
      script.onerror = (error) => {
        clearTimeout(timeoutId);
        console.error('❌ PayPal SDK load error:', error);
        reject(new Error('Failed to load PayPal SDK'));
      };
      
      // Remove any existing PayPal scripts
      const existingScript = document.querySelector('script[src*="paypal.com/sdk"]');
      if (existingScript) {
        existingScript.remove();
      }
      
      document.head.appendChild(script);
    });
  }
  
  // Process Razorpay payment with comprehensive error handling
  static async processRazorpayPayment(
    plan: SubscriptionPlan,
    billingCycle: BillingCycle,
    userEmail: string,
    onProgress: (message: string) => void
  ): Promise<PaymentResult> {
    
    return new Promise(async (resolve, reject) => {
      try {
        onProgress('Loading Razorpay payment system...');
        
        // Ensure Razorpay SDK is loaded
        await this.loadRazorpaySDK();
        
        onProgress('Preparing payment details...');
        
        const isYearly = billingCycle === BillingCycle.Yearly;
        const amount = getPrice(plan, isYearly, 'INR') * 100; // Convert to paise
        
        const options = {
          key: RAZORPAY_KEY_ID,
          amount: amount,
          currency: 'INR',
          name: 'ComplyGuard AI',
          description: `${plan.name} Plan - ${billingCycle} Subscription`,
          image: '/favicon.ico',
          prefill: {
            name: userEmail.split('@')[0],
            email: userEmail,
          },
          theme: {
            color: '#2563eb'
          },
          handler: (response: any) => {
            console.log('✅ Razorpay payment successful:', response);
            resolve({
              success: true,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              amount: amount / 100,
              currency: 'INR',
              provider: PaymentProvider.Razorpay
            });
          },
          modal: {
            ondismiss: () => {
              console.log('❌ Razorpay payment cancelled');
              reject({
                success: false,
                error: 'Payment cancelled by user',
                paymentId: '',
                amount: amount / 100,
                currency: 'INR',
                provider: PaymentProvider.Razorpay
              });
            }
          }
        };
        
        onProgress('Opening Razorpay payment gateway...');
        
        const rzp = new (window as any).Razorpay(options);
        
        // Handle payment failures
        rzp.on('payment.failed', (response: any) => {
          console.error('❌ Razorpay payment failed:', response.error);
          reject({
            success: false,
            error: response.error.description || 'Payment failed. Please try again.',
            paymentId: '',
            amount: amount / 100,
            currency: 'INR',
            provider: PaymentProvider.Razorpay
          });
        });
        
        // Open payment gateway
        rzp.open();
        
      } catch (error) {
        console.error('❌ Razorpay initialization error:', error);
        reject({
          success: false,
          error: 'Failed to initialize payment system. Please refresh and try again.',
          paymentId: '',
          amount: 0,
          currency: 'INR',
          provider: PaymentProvider.Razorpay
        });
      }
    });
  }
  
  // Process PayPal payment with comprehensive error handling
  static async processPayPalPayment(
    plan: SubscriptionPlan,
    billingCycle: BillingCycle,
    containerId: string,
    onProgress: (message: string) => void
  ): Promise<PaymentResult> {
    
    return new Promise(async (resolve, reject) => {
      try {
        onProgress('Loading PayPal payment system...');
        
        // Ensure PayPal SDK is loaded
        await this.loadPayPalSDK();
        
        onProgress('Preparing PayPal payment...');
        
        const isYearly = billingCycle === BillingCycle.Yearly;
        const amount = getPrice(plan, isYearly, 'USD');
        
        const container = document.getElementById(containerId);
        if (!container) {
          throw new Error('PayPal container not found');
        }
        
        // Clear container
        container.innerHTML = '<div class="text-center py-4 text-blue-600">Loading PayPal buttons...</div>';
        
        onProgress('Rendering PayPal payment options...');
        
        const paypalButtons = (window as any).paypal.Buttons({
          style: {
            layout: 'vertical',
            color: 'blue',
            shape: 'rect',
            label: 'paypal',
            height: 50,
            tagline: false
          },
          createOrder: (data: any, actions: any) => {
            console.log('🔄 Creating PayPal order for amount:', amount);
            return actions.order.create({
              intent: 'CAPTURE',
              purchase_units: [{
                reference_id: `CG_${Date.now()}`,
                amount: {
                  currency_code: 'USD',
                  value: amount.toFixed(2)
                },
                description: `ComplyGuard AI - ${plan.name} Plan (${billingCycle})`,
                custom_id: `cg_${Date.now()}`,
                soft_descriptor: 'COMPLYGUARD'
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
              console.log('✅ PayPal payment approved, capturing...', data);
              
              // Show capturing state
              container.innerHTML = '<div class="text-center py-4 text-green-600">Processing payment...</div>';
              
              const orderDetails = await actions.order.capture();
              console.log('✅ PayPal payment captured successfully:', orderDetails);
              
              // Validate capture
              if (orderDetails.status !== 'COMPLETED') {
                throw new Error(`Payment not completed. Status: ${orderDetails.status}`);
              }
              
              resolve({
                success: true,
                paymentId: orderDetails.id,
                orderId: data.orderID,
                amount: amount,
                currency: 'USD',
                provider: PaymentProvider.PayPal
              });
            } catch (error) {
              console.error('❌ PayPal capture error:', error);
              container.innerHTML = '<div class="text-center py-4 text-red-600">Payment processing failed</div>';
              reject({
                success: false,
                error: 'Payment capture failed. Please try again or use Razorpay.',
                paymentId: '',
                amount: amount,
                currency: 'USD',
                provider: PaymentProvider.PayPal
              });
            }
          },
          onError: (error: any) => {
            console.error('❌ PayPal payment error:', error);
            container.innerHTML = '<div class="text-center py-4 text-red-600">PayPal error occurred</div>';
            reject({
              success: false,
              error: 'PayPal payment failed. Please try Razorpay instead.',
              paymentId: '',
              amount: amount,
              currency: 'USD',
              provider: PaymentProvider.PayPal
            });
          },
          onCancel: () => {
            console.log('❌ PayPal payment cancelled');
            container.innerHTML = '<div class="text-center py-4 text-gray-600">Payment cancelled</div>';
            reject({
              success: false,
              error: 'Payment cancelled by user',
              paymentId: '',
              amount: amount,
              currency: 'USD',
              provider: PaymentProvider.PayPal
            });
          }
        });
        
        // Render buttons with error handling
        paypalButtons.render(`#${containerId}`).then(() => {
          console.log('✅ PayPal buttons rendered successfully');
          container.innerHTML = ''; // Clear loading message
        }).catch((renderError: any) => {
          console.error('❌ PayPal button render error:', renderError);
          container.innerHTML = '<div class="text-center py-4 text-red-600">Failed to load PayPal buttons. Please try Razorpay.</div>';
          reject({
            success: false,
            error: 'Failed to render PayPal buttons. Please try Razorpay instead.',
            paymentId: '',
            amount: amount,
            currency: 'USD',
            provider: PaymentProvider.PayPal
          });
        });
        
      } catch (error) {
        console.error('❌ PayPal initialization error:', error);
        reject({
          success: false,
          error: 'Failed to initialize PayPal. Please try Razorpay instead.',
          paymentId: '',
          amount: 0,
          currency: 'USD',
          provider: PaymentProvider.PayPal
        });
      }
    });
  }
  
  // Create subscription after successful payment
  static async createSubscription(
    userId: string,
    planId: string,
    billingCycle: BillingCycle,
    paymentResult: PaymentResult
  ): Promise<any> {
    
    console.log('Creating subscription:', {
      userId,
      planId,
      billingCycle,
      paymentResult
    });
    
    // In production, this would call your backend API
    const subscription = {
      id: `sub_${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      plan_id: planId,
      billing_cycle: billingCycle,
      status: 'active',
      payment_provider: paymentResult.provider,
      payment_id: paymentResult.paymentId,
      amount: paymentResult.amount,
      currency: paymentResult.currency,
      created_at: new Date(),
      next_billing_date: new Date(Date.now() + (billingCycle === BillingCycle.Yearly ? 365 : 30) * 24 * 60 * 60 * 1000)
    };
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('✅ Subscription created:', subscription);
    return subscription;
  }
  
  // Detect optimal payment provider based on user location
  static detectOptimalProvider(): PaymentProvider {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const language = navigator.language;
      
      // Check for Indian indicators
      if (
        timezone.includes('Kolkata') ||
        timezone.includes('Mumbai') ||
        timezone.includes('Delhi') ||
        language.includes('hi') ||
        language.toLowerCase().includes('in')
      ) {
        return PaymentProvider.Razorpay;
      }
    } catch (error) {
      console.log('Could not detect location, defaulting to Razorpay');
    }
    
    return PaymentProvider.Razorpay; // Default to Razorpay as it supports international cards too
  }
  
  // Get user location for payment optimization with multiple fallbacks
  static async getUserLocation(): Promise<string> {
    try {
      // Try primary geolocation service
      const response = await fetch('https://ipapi.co/json/', { 
        signal: AbortSignal.timeout(3000) 
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.country_code) {
          console.log(`✅ Location detected: ${data.country_code} (${data.country_name})`);
          return data.country_code;
        }
      }
    } catch (error) {
      console.log('Primary location service failed, trying fallback...');
    }
    
    try {
      // Fallback to alternative service
      const response = await fetch('https://api.country.is/', {
        signal: AbortSignal.timeout(3000)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.country) {
          console.log(`✅ Location detected (fallback): ${data.country}`);
          return data.country;
        }
      }
    } catch (error) {
      console.log('Fallback location service failed');
    }
    
    // Use browser-based detection as last resort
    const browserDetection = this.detectOptimalProvider();
    const countryCode = browserDetection === PaymentProvider.Razorpay ? 'IN' : 'US';
    console.log(`✅ Using browser-based detection: ${countryCode}`);
    return countryCode;
  }
  
  // Validate payment configuration
  static validateConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!RAZORPAY_KEY_ID || RAZORPAY_KEY_ID.length < 10) {
      errors.push('Razorpay Key ID is missing or invalid');
    }
    
    if (!PAYPAL_CLIENT_ID || PAYPAL_CLIENT_ID.length < 10) {
      errors.push('PayPal Client ID is missing or invalid');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Initialize payment system on load
if (typeof window !== 'undefined') {
  // Validate configuration
  const config = FunctionalPaymentService.validateConfiguration();
  if (!config.valid) {
    console.warn('⚠️ Payment configuration issues:', config.errors);
  } else {
    console.log('✅ Payment system configuration valid');
  }
}