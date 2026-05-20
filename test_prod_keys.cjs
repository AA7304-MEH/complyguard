const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs');
const path = require('path');

function parseEnv(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const env = {};
    lines.forEach(line => {
        if (line && !line.startsWith('#')) {
            const [key, value] = line.split('=');
            if (key && value) {
                env[key.trim()] = value.trim();
            }
        }
    });
    return env;
}

const env = parseEnv('.env.production');
const RAZORPAY_ID = env.VITE_RAZORPAY_KEY_ID;
const RAZORPAY_SECRET = env.RAZORPAY_KEY_SECRET;

async function testRazorpay() {
    console.log(`Checking Razorpay Key ID from .env.production: ${RAZORPAY_ID}...`);
    try {
        const response = await fetch(`https://api.razorpay.com/v1/orders`, {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(RAZORPAY_ID + ':' + RAZORPAY_SECRET).toString('base64'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: 100,
                currency: 'INR',
                receipt: 'test_receipt'
            })
        });
        const data = await response.json();
        console.log("Razorpay Response:", JSON.stringify(data, null, 2));
        
        if (response.ok) {
            console.log("✅ Razorpay credentials are VALID and working!");
        } else {
            console.log("❌ Razorpay credentials failed.");
        }
    } catch (err) {
        console.error("Razorpay Error:", err.message);
    }
}

testRazorpay();
