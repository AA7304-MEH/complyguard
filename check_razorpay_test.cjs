const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const RAZORPAY_ID = 'rzp_test_1DP5mmOlF5G5ag';

async function testRazorpay() {
    console.log(`Checking Razorpay TEST Key ID: ${RAZORPAY_ID}...`);
    try {
        const response = await fetch(`https://api.razorpay.com/v1/payments`, {
            headers: {
                'Authorization': 'Basic ' + Buffer.from(RAZORPAY_ID + ':').toString('base64')
            }
        });
        const data = await response.json();
        if (data.error && data.error.description && data.error.description.includes('Key ID')) {
            console.log("❌ Razorpay TEST Key ID is INVALID.");
        } else {
            console.log("✅ Razorpay TEST Key ID is VALID.");
        }
        console.log("Razorpay Response:", JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Razorpay Error:", err.message);
    }
}

testRazorpay();
