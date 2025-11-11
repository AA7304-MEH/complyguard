@echo off
echo ========================================
echo ComplyGuard AI - Production Deployment
echo ========================================
echo.

echo Step 1: Building production version...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed! Please fix errors and try again.
    pause
    exit /b 1
)
echo Build completed successfully!
echo.

echo Step 2: Choose deployment method:
echo 1. Netlify (Recommended)
echo 2. Vercel
echo 3. Preview locally first
echo 4. Exit
echo.

set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" goto netlify
if "%choice%"=="2" goto vercel
if "%choice%"=="3" goto preview
if "%choice%"=="4" goto end

:netlify
echo.
echo Deploying to Netlify...
echo.
echo Make sure you have Netlify CLI installed:
echo   npm install -g netlify-cli
echo.
echo Then run:
echo   netlify login
echo   netlify deploy --prod --dir=dist
echo.
pause
goto end

:vercel
echo.
echo Deploying to Vercel...
echo.
echo Make sure you have Vercel CLI installed:
echo   npm install -g vercel
echo.
echo Then run:
echo   vercel login
echo   vercel --prod
echo.
pause
goto end

:preview
echo.
echo Starting local preview server...
call npm run preview
goto end

:end
echo.
echo Deployment script completed.
pause
