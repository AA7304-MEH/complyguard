# 🚀 Production Deployment Checklist

## ✅ Pre-Deployment

### 1. Build Verification
- [x] Production build completed successfully
- [ ] No TypeScript errors
- [ ] No console errors in build output
- [ ] All dependencies up to date
- [ ] Build size acceptable (< 1MB gzipped)

### 2. Local Testing
- [ ] Run `npm run preview` to test production build
- [ ] Test on http://localhost:4173/
- [ ] Verify scrolling works
- [ ] Test sign in/sign out
- [ ] Test payment flow (sandbox)
- [ ] Check all pages load correctly
- [ ] Test on mobile viewport
- [ ] Test in different browsers (Chrome, Firefox, Safari, Edge)

### 3. Environment Variables
- [ ] Copy `.env.production.example` to hosting platform
- [ ] Update `VITE_CLERK_PUBLISHABLE_KEY` with production key
- [ ] Update `VITE_GEMINI_API_KEY` with production key
- [ ] Update `VITE_PAYPAL_CLIENT_ID` with production client ID
- [ ] Set `VITE_PAYPAL_ENVIRONMENT=production`
- [ ] Update `VITE_RAZORPAY_KEY_ID` with live key
- [ ] Verify all environment variables are set correctly

### 4. Payment Configuration
- [ ] PayPal: Switch from sandbox to production
- [ ] PayPal: Get production client ID from https://developer.paypal.com/
- [ ] PayPal: Test with real PayPal account
- [ ] Razorpay: Switch from test to live keys
- [ ] Razorpay: Get live keys from https://dashboard.razorpay.com/
- [ ] Razorpay: Test with real payment methods
- [ ] Verify webhook URLs configured (if using)

### 5. Authentication (Clerk)
- [ ] Create production Clerk instance
- [ ] Get production publishable key
- [ ] Configure allowed domains
- [ ] Set up OAuth providers (if using)
- [ ] Configure email templates
- [ ] Test sign up flow
- [ ] Test sign in flow
- [ ] Test password reset

### 6. Code Review
- [ ] Remove all console.log statements (or use proper logging)
- [ ] Remove debug code
- [ ] Remove test components
- [ ] Check for hardcoded values
- [ ] Verify error handling
- [ ] Check security best practices

---

## 🌐 Deployment

### Option A: Netlify (Recommended)

#### Step 1: Install Netlify CLI
```bash
npm install -g netlify-cli
```

#### Step 2: Login to Netlify
```bash
netlify login
```

#### Step 3: Deploy
```bash
netlify deploy --prod --dir=dist
```

#### Step 4: Configure Netlify
- [ ] Go to Netlify dashboard
- [ ] Set environment variables
- [ ] Configure custom domain
- [ ] Enable HTTPS (automatic)
- [ ] Set up redirects (already in _redirects file)
- [ ] Configure build settings:
  - Build command: `npm run build`
  - Publish directory: `dist`

#### Step 5: Test Deployment
- [ ] Visit your Netlify URL
- [ ] Test all functionality
- [ ] Verify HTTPS works
- [ ] Test payment flow with real credentials

---

### Option B: Vercel

#### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

#### Step 2: Login to Vercel
```bash
vercel login
```

#### Step 3: Deploy
```bash
vercel --prod
```

#### Step 4: Configure Vercel
- [ ] Go to Vercel dashboard
- [ ] Set environment variables
- [ ] Configure custom domain
- [ ] HTTPS enabled automatically

---

### Option C: Custom Server

#### Step 1: Upload Files
```bash
scp -r dist/* user@server:/var/www/complyguard/
```

#### Step 2: Configure Web Server

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/complyguard/dist;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

#### Step 3: Set up HTTPS
```bash
sudo certbot --nginx -d your-domain.com
```

#### Step 4: Configure Environment
- [ ] Set environment variables on server
- [ ] Restart web server
- [ ] Test deployment

---

## ✅ Post-Deployment

### 1. Functional Testing
- [ ] Visit production URL
- [ ] Test landing page loads
- [ ] Verify scrolling works
- [ ] Test sign up with real email
- [ ] Test sign in
- [ ] Test password reset
- [ ] Navigate through all pages
- [ ] Test dashboard functionality
- [ ] Test pricing page
- [ ] Test payment flow with real payment
- [ ] Verify success notifications
- [ ] Check subscription updates

### 2. Payment Testing
- [ ] Test PayPal payment with real account
- [ ] Test Razorpay payment with real card
- [ ] Verify payment confirmation emails
- [ ] Check payment appears in PayPal dashboard
- [ ] Check payment appears in Razorpay dashboard
- [ ] Test payment failure scenarios
- [ ] Test payment cancellation

### 3. Performance Testing
- [ ] Run Lighthouse audit (aim for 90+ score)
- [ ] Test page load speed (< 3 seconds)
- [ ] Test on slow 3G connection
- [ ] Check Time to Interactive (TTI)
- [ ] Verify images load correctly
- [ ] Check for console errors
- [ ] Test memory usage

### 4. Mobile Testing
- [ ] Test on iPhone (Safari)
- [ ] Test on Android (Chrome)
- [ ] Test on tablet
- [ ] Verify responsive design
- [ ] Test touch interactions
- [ ] Check payment flow on mobile

### 5. Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers

### 6. Security Testing
- [ ] HTTPS enabled and working
- [ ] SSL certificate valid
- [ ] No mixed content warnings
- [ ] Security headers configured
- [ ] CORS configured correctly
- [ ] No sensitive data in client code
- [ ] Environment variables not exposed

### 7. Monitoring Setup
- [ ] Set up error tracking (Sentry)
- [ ] Configure analytics (Google Analytics)
- [ ] Set up uptime monitoring (UptimeRobot)
- [ ] Configure payment monitoring
- [ ] Set up log aggregation
- [ ] Create alerts for errors

### 8. Documentation
- [ ] Update README with production URL
- [ ] Document deployment process
- [ ] Create runbook for common issues
- [ ] Document environment variables
- [ ] Create backup/restore procedures

---

## 🔧 Configuration Files

### Netlify Configuration (netlify.toml)
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

### Redirects (_redirects)
```
/*    /index.html   200
```

---

## 📊 Success Metrics

After deployment, monitor these metrics:

### Performance:
- [ ] Page load time < 3 seconds
- [ ] Time to Interactive < 5 seconds
- [ ] Lighthouse score > 90
- [ ] Core Web Vitals passing

### Functionality:
- [ ] Sign up conversion rate
- [ ] Payment success rate > 95%
- [ ] Error rate < 1%
- [ ] Uptime > 99.9%

### User Experience:
- [ ] Mobile usability score > 90
- [ ] Accessibility score > 90
- [ ] No critical bugs reported
- [ ] Positive user feedback

---

## 🐛 Common Issues & Solutions

### Issue: Environment variables not working
**Solution:** Ensure variables have `VITE_` prefix and rebuild after changes

### Issue: Payment not working in production
**Solution:** Verify production payment credentials are set correctly

### Issue: 404 errors on page refresh
**Solution:** Configure SPA redirects (_redirects file or server config)

### Issue: HTTPS not working
**Solution:** Configure SSL certificate and force HTTPS redirect

### Issue: Slow page load
**Solution:** Enable compression, use CDN, optimize images

---

## 📞 Support Contacts

### Payment Issues:
- PayPal: https://developer.paypal.com/support/
- Razorpay: https://razorpay.com/support/

### Hosting Issues:
- Netlify: https://www.netlify.com/support/
- Vercel: https://vercel.com/support

### Authentication Issues:
- Clerk: https://clerk.com/support

---

## 🎉 Deployment Complete!

Once all checklist items are complete:

1. ✅ Announce launch
2. ✅ Monitor for issues
3. ✅ Gather user feedback
4. ✅ Plan next iteration

---

**Your ComplyGuard AI is now live!** 🚀
