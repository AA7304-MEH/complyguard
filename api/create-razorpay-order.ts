import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Content-Type', 'application/json');
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const { amount, currency = 'INR', receipt, notes } = req.body;
        
        const rawKeyId = process.env.RAZORPAY_KEY_ID;
        const rawViteKeyId = process.env.VITE_RAZORPAY_KEY_ID;
        const keyId = (rawKeyId || rawViteKeyId || '').trim();

        const rawSecret = process.env.RAZORPAY_KEY_SECRET;
        const rawViteSecret = process.env.VITE_RAZORPAY_KEY_SECRET;
        const keySecret = (rawSecret || rawViteSecret || '').trim();

        const maskedKeyId = keyId ? `${keyId.substring(0, 10)}...${keyId.substring(keyId.length - 4)}` : 'none';
        const keySource = rawKeyId ? 'RAZORPAY_KEY_ID' : (rawViteKeyId ? 'VITE_RAZORPAY_KEY_ID' : 'none');
        const secretSource = rawSecret ? 'RAZORPAY_KEY_SECRET' : (rawViteSecret ? 'VITE_RAZORPAY_KEY_SECRET' : 'none');

        if (!keyId || !keySecret) {
            console.warn('⚠️ Razorpay credentials missing in environment variables');
            return res.status(400).json({
                success: false,
                error: 'Razorpay API credentials (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) are missing or incomplete in Vercel environment variables.',
                code: 'KEYS_MISSING',
                env_debug: {
                    key_source: keySource,
                    secret_source: secretSource,
                    key_id_preview: maskedKeyId,
                    secret_length: keySecret.length
                }
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
                key_id: keyId,
                env_debug: {
                    key_source: keySource,
                    key_id_preview: maskedKeyId
                }
            });
        }

        console.error('❌ Razorpay Order API returned non-OK response:', data);
        return res.status(200).json({
            id: `order_cg_${Date.now()}`,
            fallback: true,
            amount: amount || 79900,
            currency: currency || 'INR',
            receipt: receipt || `receipt_${Date.now()}`,
            key_id: keyId || 'rzp_live_SlC9oFgIO6E4iy'
        });

    } catch (error: any) {
        console.error('Create Order Exception, using fallback order:', error);
        return res.status(200).json({
            id: `order_cg_${Date.now()}`,
            fallback: true,
            amount: req.body?.amount || 79900,
            currency: req.body?.currency || 'INR',
            receipt: `receipt_${Date.now()}`
        });
    }
}
