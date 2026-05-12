import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Content-Type', 'application/json');
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const { amount, currency = 'INR', receipt, notes } = req.body;
        
        // Use environment variables for Razorpay credentials
        const keyId = (process.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || '').trim();
        const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();

        if (!keyId || !keySecret || keySecret === 'your_razorpay_secret_key_here') {
            return res.status(500).json({ 
                error: 'Razorpay credentials missing', 
                message: 'RAZORPAY_KEY_SECRET is not configured on the server. Please add it to your Vercel Environment Variables.' 
            });
        }

        // Base64 encode credentials for Basic Auth
        const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

        const orderPayload = {
            amount: amount, // amount in paise
            currency: currency,
            receipt: receipt || `receipt_${Date.now()}`,
            notes: notes || {}
        };

        const response = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderPayload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Razorpay API Error:', data);
            return res.status(response.status).json({ 
                error: 'Failed to create Razorpay order', 
                details: data
            });
        }

        return res.status(200).json(data);

    } catch (error: any) {
        console.error('Create Order Error:', error);
        return res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
}
