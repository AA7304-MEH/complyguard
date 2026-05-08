const { execSync } = require('child_process');

const envs = {
    GEMINI_API_KEY: 'AIzaSyA0QfVHfo4t2tQnqEPAhfNF9OIU7bUiXrI',
    VITE_CLERK_PUBLISHABLE_KEY: 'pk_test_c2VsZWN0ZWQtbW9sZS0xNy5jbGVyay5hY2NvdW50cy5kZXYk',
    VITE_RAZORPAY_KEY_ID: 'rzp_live_R7dfHLEHcCCibm',
    VITE_PAYPAL_CLIENT_ID: 'AZDxjDScFpQtjWTOUtWKbyN_bDt4OgqaF4eYXlewfBP4-8aqX3PiV8e1GWU6liB2CUXlkA59kJXE7M6R',
    VITE_SUPABASE_URL: 'https://mdiziasnsmwyyeuotiea.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kaXppYXNuc213eXlldW90aWVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTM0MTIsImV4cCI6MjA5MDM2OTQxMn0.j3p_Twn770d2RooeaLAgTbbXeva_HCEJZ6N6lPPQX9k'
};

for (const [key, value] of Object.entries(envs)) {
    try {
        console.log(`Fixing ${key}...`);
        try { execSync(`vercel env rm ${key} production -y`, { stdio: 'inherit' }); } catch (e) {}
        // Use printf or similar to avoid extra characters, or just pass it directly if possible
        // Actually, the best way in PowerShell is to use a temp file
        execSync(`echo | set /p="${value}" > temp_val.txt`);
        execSync(`vercel env add ${key} production < temp_val.txt`, { stdio: 'inherit' });
    } catch (err) {
        console.error(`Failed to add ${key}: ${err.message}`);
    }
}

console.log("Triggering redeploy...");
execSync('vercel deploy --prod --force', { stdio: 'inherit' });
