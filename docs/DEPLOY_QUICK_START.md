# ⚡ Quick Start: Deploy to Netlify

## 🎯 3-Minute Setup

### 1️⃣ Create Netlify Site (1 min)
1. Go to https://app.netlify.com/
2. Click "Add new site" → "Import from Git"
3. Select GitHub → Choose `AA7304-MEH/complyguard`
4. Click "Deploy site" (use default settings)

### 2️⃣ Get Credentials (1 min)
**Site ID:**
- Netlify → Site settings → Copy Site ID

**Auth Token:**
- Netlify → User settings → Applications → New access token

### 3️⃣ Add to GitHub (1 min)
1. GitHub → Your repo → Settings → Secrets → Actions
2. Add two secrets:
   - `NETLIFY_AUTH_TOKEN` = your token
   - `NETLIFY_SITE_ID` = your site ID

### 4️⃣ Set Environment Variables
In Netlify Dashboard → Site settings → Environment variables:
```
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
VITE_GEMINI_API_KEY=AIzaSy...
VITE_PAYPAL_CLIENT_ID=your_production_id
VITE_PAYPAL_ENVIRONMENT=production
VITE_RAZORPAY_KEY_ID=rzp_live_...
```

---

## 🚀 Deploy Now!

```bash
git push origin main
```

That's it! Your site deploys automatically in ~2 minutes.

---

## 📍 What Happens Next?

1. ✅ GitHub Actions triggers
2. ✅ Builds your app
3. ✅ Deploys to Netlify
4. ✅ Site goes live!

Watch progress: https://github.com/AA7304-MEH/complyguard/actions

---

## 🔗 Your Links

- **GitHub**: https://github.com/AA7304-MEH/complyguard
- **Netlify**: https://app.netlify.com/
- **Actions**: https://github.com/AA7304-MEH/complyguard/actions

---

## ✅ Already Configured

- ✅ GitHub Actions workflow
- ✅ Netlify configuration
- ✅ Build optimization
- ✅ Security headers
- ✅ SPA routing
- ✅ Asset caching

**Just add your credentials and push!** 🎉
