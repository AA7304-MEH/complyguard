@echo off
REM ComplyGuard AI - Deployment Script for Netlify (Windows)

echo 🚀 Preparing ComplyGuard AI for Netlify deployment...

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. Please run this script from the complyguard directory.
    pause
    exit /b 1
)

REM Test build locally first
echo 🔧 Testing production build...
call npm run build

if %errorlevel% neq 0 (
    echo ❌ Build failed. Please fix errors before deploying.
    pause
    exit /b 1
)

echo ✅ Build successful!

REM Add all files to git
echo 📦 Adding files to git...
git add .

REM Commit changes
echo 💾 Committing changes...
git commit -m "feat: Production-ready SaaS platform with live payments for Netlify deployment - ✅ Live Razorpay integration (rzp_live_R7dfHLEHcCCibm) - ✅ Live PayPal integration (production environment) - ✅ Complete subscription management system - ✅ Professional UI/UX with payment flows - ✅ Netlify configuration and optimization - ✅ Security headers and environment variables - ✅ Production build tested and working - 🚀 Ready for live customer payments"

REM Push to GitHub
echo 🌐 Pushing to GitHub...
git push origin main

if %errorlevel% equ 0 (
    echo.
    echo 🎉 SUCCESS! Your code has been pushed to GitHub.
    echo.
    echo 📋 Next Steps for Netlify Deployment:
    echo 1. Go to https://netlify.com and login
    echo 2. Click 'New site from Git'
    echo 3. Choose GitHub and select your repository
    echo 4. Set build settings:
    echo    - Base directory: complyguard
    echo    - Build command: npm run build
    echo    - Publish directory: complyguard/dist
    echo 5. Add environment variables (see .env.production.example^)
    echo 6. Deploy!
    echo.
    echo 🔗 Your repository: https://github.com/AA7304-MEH/complyguard
    echo 📖 Full guide: See NETLIFY_DEPLOYMENT.md
    echo.
    echo ⏱️  Estimated deployment time: 5-10 minutes
    echo 💰 Ready to accept payments immediately after deployment!
) else (
    echo ❌ Error pushing to GitHub. Please check your git configuration.
    pause
    exit /b 1
)

pause