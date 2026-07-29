import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Content-Type', 'application/json');
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const { amount, currency = 'INR', receipt, notes } = req.body;
        
        const rawKeyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
        const keyId = (rawKeyId || 'rzp_live_TGapFevpWRxIzW').trim();

        const rawSecret = process.env.RAZORPAY_KEY_SECRET || process.env.VITE_RAZORPAY_KEY_SECRET;
        const keySecret = (rawSecret || 'dCfaOk0c29AYNu8SUWam9vHp').trim();

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
        return res.status(200).json({
            id: `order_cg_${Date.now()}`,
            fallback: true,
            amount: amount || 79900,
            currency: currency || 'INR',
            receipt: receipt || `receipt_${Date.now()}`,
            key_id: keyId
        });

    } catch (error: any) {
        console.error('Create Order Exception:', error);
        return res.status(200).json({
            id: `order_cg_${Date.now()}`,
            fallback: true,
            amount: req.body?.amount || 79900,
            currency: req.body?.currency || 'INR',
            receipt: `receipt_${Date.now()}`,
            key_id: 'rzp_live_TGapFevpWRxIzW'
        });
    }
}
