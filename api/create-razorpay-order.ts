import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Content-Type', 'application/json');
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const { amount, currency = 'INR', receipt, notes } = req.body;
        
        const keyId = (process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '').trim();
        const keySecret = (process.env.RAZORPAY_KEY_SECRET || process.env.VITE_RAZORPAY_KEY_SECRET || '').trim();

        if (!keyId || !keySecret) {
            console.warn('⚠️ Razorpay credentials missing in environment variables');
            return res.status(400).json({
                success: false,
                error: 'Razorpay API credentials (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET) are missing in Vercel environment variables.',
                code: 'KEYS_MISSING'
            });
        }

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

        if (response.ok) {
            console.log('✅ Razorpay order created successfully:', data.id);
            return res.status(200).json({
                ...data,
                key_id: keyId
            });
        }

        console.error('❌ Razorpay Order API Error:', data);
        return res.status(response.status).json({
            success: false,
            error: data.error?.description || 'Failed to create order on Razorpay',
            code: data.error?.code || 'RAZORPAY_ERROR',
            key_id_used: `${keyId.substring(0, 10)}...`
        });

    } catch (error: any) {
        console.error('Create Order Exception:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Internal Server Error during Razorpay order creation',
            code: 'SERVER_EXCEPTION'
        });
    }
}
