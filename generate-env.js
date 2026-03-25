import fs from 'fs';

// This script bridges Vercel/System environment variables to Vite's .env system
// It runs during the build process on Vercel.

const buildEnvFile = () => {
    console.log('🏗️ Generating .env.production from system environment...');
    
    const vars = Object.entries(process.env).filter(([key]) => 
        key.startsWith('VITE_') || 
        key === 'GEMINI_API_KEY' || 
        key === 'CLERK_PUBLISHABLE_KEY'
    );
    
    let envContent = '';
    vars.forEach(([key, value]) => {
        // Ensure GEMINI_API_KEY is also available as VITE_GEMINI_API_KEY
        if (key === 'GEMINI_API_KEY') {
            envContent += `VITE_GEMINI_API_KEY=${value}\n`;
        }
        // Always include the original key
        envContent += `${key}=${value}\n`;
    });
    
    fs.writeFileSync('.env.production', envContent);
    console.log(`✅ Generated .env.production with ${vars.length} variables.`);
    console.log('Detected keys:', vars.map(([k]) => k).join(', '));
};

buildEnvFile();
