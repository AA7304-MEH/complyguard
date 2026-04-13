# ComplyGuard AI Launch Checklist

Tick off these items before going live:

[ ] Added VITE_CLERK_PUBLISHABLE_KEY in Vercel
[ ] Added GEMINI_API_KEY in Vercel (server-side, NO VITE_ prefix)
[ ] Added VITE_RAZORPAY_KEY_ID in Vercel
[ ] Added VITE_PAYPAL_CLIENT_ID in Vercel
[ ] Set VITE_PAYPAL_ENVIRONMENT=production in Vercel
[ ] Added complyguard-mu.vercel.app to Clerk allowed domains
[ ] Triggered redeploy in Vercel
[ ] Visited /api/health and confirmed all keys show true
[ ] Tested sign-up flow
[ ] Tested one document scan
[ ] Tested pricing page loads
