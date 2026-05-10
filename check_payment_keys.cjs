const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const PAYPAL_CLIENT_ID = 'AZDxjDScFpQtjWTOUtWKbyN_bDt4OgqaF4eYXlewfBP4-8aqX3PiV8e1GWU6liB2CUXlkA59kJXE7M6R';
// We don't have the secret, so we can't fully test the backend, 
// but we can check if the Client ID is recognized for basic token fetch if possible.
// Actually, PayPal token fetch REQUIRES the secret.

// Let's check Razorpay ID
const RAZORPAY_ID = 'rzp_live_R7dfHLEHcCCibm';

async function testRazorpay() {
    console.log(`Checking Razorpay Key ID: ${RAZORPAY_ID}...`);
    try {
        const response = await fetch(`https://api.razorpay.com/v1/payments`, {
            headers: {
                'Authorization': 'Basic ' + Buffer.from(RAZORPAY_ID + ':').toString('base64')
            }
        });
        const data = await response.json();
        // If it returns 401 with "Invalid Key ID", it's wrong.
        // If it returns 401 with "Invalid Secret", the ID is correct.
        if (data.error && data.error.description && data.error.description.includes('Key ID')) {
            console.log("❌ Razorpay Key ID is INVALID.");
        } else {
            console.log("✅ Razorpay Key ID is VALID (or secret is missing).");
        }
        console.log("Razorpay Response:", JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Razorpay Error:", err.message);
    }
}

testRazorpay();
