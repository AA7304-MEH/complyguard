# ComplyGuard AI Launch Checklist

Tick off these items before going live:

[x] Added VITE_CLERK_PUBLISHABLE_KEY in Vercel
[x] Added GEMINI_API_KEY in Vercel (server-side, NO VITE_ prefix)
[x] Added VITE_RAZORPAY_KEY_ID in Vercel
[x] Added VITE_PAYPAL_CLIENT_ID in Vercel
[x] Set VITE_PAYPAL_ENVIRONMENT=production in Vercel
[x] Added complyguard-mu.vercel.app to Clerk allowed domains
[x] Triggered redeploy in Vercel
[x] Visited /api/health and confirmed all keys show true
[x] Tested sign-up flow
[x] Tested one document scan
[x] Tested pricing page loads
