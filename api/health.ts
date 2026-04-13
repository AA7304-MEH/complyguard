import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Check the presence of critical and optional environment variables.
  // We only return true/false to avoid leaking sensitive secrets in the browser.

  const envStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    critical_vars: {
      VITE_CLERK_PUBLISHABLE_KEY: !!(process.env.VITE_CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY),
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    },
    optional_vars: {
      VITE_RAZORPAY_KEY_ID: !!process.env.VITE_RAZORPAY_KEY_ID,
      VITE_PAYPAL_CLIENT_ID: !!process.env.VITE_PAYPAL_CLIENT_ID,
      VITE_PAYPAL_ENVIRONMENT: !!process.env.VITE_PAYPAL_ENVIRONMENT,
      VITE_SUPABASE_URL: !!(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL),
      VITE_SUPABASE_ANON_KEY: !!(process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY),
    },
    payment_secrets_server_only: {
      RAZORPAY_KEY_SECRET: !!process.env.RAZORPAY_KEY_SECRET,
      PAYPAL_CLIENT_SECRET: !!process.env.PAYPAL_CLIENT_SECRET,
    }
  };

  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(envStatus);
}
