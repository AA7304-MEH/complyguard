# Vercel Environment Variables Setup Guide

When deploying ComplyGuard AI to Vercel, you need to add specific environment variables in the Vercel Dashboard to ensure the application works correctly.

## 🚀 How to add these variables in Vercel

1. Go to your Vercel Dashboard: https://vercel.com/dashboard
2. Select your project (`complyguard-mu`)
3. Go to **Settings** > **Environment Variables**
4. Copy and paste each key and value from below.

---

## 🔴 Critical Variables (App won't load without these)

These variables are required for the app to even start up.

### `VITE_CLERK_PUBLISHABLE_KEY`
- **What it is:** Authentication frontend key
- **Where to find it:** Go to your [Clerk Dashboard](https://dashboard.clerk.com/) -> Select your application -> "API Keys" -> Copy the "Publishable key" (Starts with `pk_live_` or `pk_test_`).

### `VITE_GEMINI_API_KEY`
- **What it is:** Google Gemini AI engine key
- **Where to find it:** Go to [Google AI Studio](https://aistudio.google.com/app/apikey) -> "Get API key" -> Create or copy your existing key.

---

## 🟡 Non-Critical / Optional Variables (App loads but features disable gracefully)

These variables activate specific features securely. If they are missing, the app continues to work without crashing, but the specific feature (payments, database history) will simply mock or disable itself.

### The Razorpay Integration (For Indian Payments)
### `VITE_RAZORPAY_KEY_ID`
- **What it is:** Razorpay frontend identifier.
- **Where to find it:** Go to [Razorpay Dashboard](https://dashboard.razorpay.com/) -> Settings -> API Keys -> Copy the "Key Id" (Starts with `rzp_live_` or `rzp_test_`).

> **⚠️ NOTE ON PAYMENT SECRETS:** You do *not* add `RAZORPAY_KEY_SECRET` or `VITE_PAYPAL_CLIENT_SECRET` in Vite variables. Secret keys have been safely removed from the frontend client to protect your account.

### The PayPal Integration (For Global Payments)
### `VITE_PAYPAL_CLIENT_ID`
- **What it is:** PayPal frontend identifier.
- **Where to find it:** Go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications) -> Apps & Credentials -> Select your App -> Copy the "Client ID".

### `VITE_PAYPAL_ENVIRONMENT`
- **What it is:** Tells PayPal whether to use real money or test money.
- **Value:** `production` (for live payments) or `sandbox` (for testing).

### The Supabase Integration (For saving user history/scans)
*Note: If these are missing, scans work but won't be saved permanently.*

### `VITE_SUPABASE_URL`
- **What it is:** Database endpoint.
- **Where to find it:** Go to [Supabase Dashboard](https://supabase.com/dashboard/projects) -> Select your project -> Project Settings -> API -> Copy the "Project URL".

### `VITE_SUPABASE_ANON_KEY`
- **What it is:** Database public anonymous key.
- **Where to find it:** Go to [Supabase Dashboard](https://supabase.com/dashboard/projects) -> Select your project -> Project Settings -> API -> Copy the "anon" `public` key.

---

## ✅ Post-Deployment Verification

After setting these variables and deploying, you can instantly verify that the application has properly loaded them on the backend by visiting:

**`https://complyguard-mu.vercel.app/api/health`**

This will show you a secure read-out of exactly which keys the deployed build detected (without exposing the secret values).

