import type { VercelRequest, VercelResponse } from '@vercel/node'
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL_ENV || 'unknown',
    critical_vars: {
      VITE_CLERK_PUBLISHABLE_KEY: !!process.env.VITE_CLERK_PUBLISHABLE_KEY,
      GEMINI_KEYS_CONFIGURED: [
        process.env.GEMINI_API_KEY_1,
        process.env.GEMINI_API_KEY_2,
        process.env.GEMINI_API_KEY_3,
        process.env.GEMINI_API_KEY_4,
        process.env.GEMINI_API_KEY_5,
        process.env.GEMINI_API_KEY
      ].filter(Boolean).map(k => k?.substring(0, 5) + '...')
    },

    optional_vars: {
      VITE_RAZORPAY_KEY_ID: !!process.env.VITE_RAZORPAY_KEY_ID,
      VITE_PAYPAL_CLIENT_ID: !!process.env.VITE_PAYPAL_CLIENT_ID,
      VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
    }
  })
}
