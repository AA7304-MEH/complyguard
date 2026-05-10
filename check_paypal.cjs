const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const PAYPAL_CLIENT_ID = 'AZDxjDScFpQtjWTOUtWKbyN_bDt4OgqaF4eYXlewfBP4-8aqX3PiV8e1GWU6liB2CUXlkA59kJXE7M6R';

async function testPayPal() {
    console.log(`Checking PayPal Client ID: ${PAYPAL_CLIENT_ID}...`);
    try {
        // Attempt to fetch a public token or check info
        const response = await fetch(`https://api-m.paypal.com/v1/oauth2/token`, {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(PAYPAL_CLIENT_ID + ':').toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials'
        });
        const data = await response.json();
        if (data.error === 'invalid_client') {
            console.log("❌ PayPal Client ID is INVALID.");
        } else {
            console.log("✅ PayPal Client ID is VALID (or secret is missing).");
        }
        console.log("PayPal Response:", JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("PayPal Error:", err.message);
    }
}

testPayPal();
