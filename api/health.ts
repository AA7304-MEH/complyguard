import type { VercelRequest, VercelResponse } from '@vercel/node'
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL_ENV || 'unknown',
    critical_vars: {
      VITE_CLERK_PUBLISHABLE_KEY: !!process.env.VITE_CLERK_PUBLISHABLE_KEY,
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    },
    optional_vars: {
      VITE_RAZORPAY_KEY_ID: !!process.env.VITE_RAZORPAY_KEY_ID,
      VITE_PAYPAL_CLIENT_ID: !!process.env.VITE_PAYPAL_CLIENT_ID,
      VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
    }
  })
}
