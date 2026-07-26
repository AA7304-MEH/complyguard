export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Content-Type', 'application/json');
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const { amount, currency = 'INR', receipt, notes } = req.body;
        
        const keyId = process.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || 'rzp_live_SlC9oFgIO6E4iy';
        const keySecret = process.env.RAZORPAY_KEY_SECRET || 'luBbo7eVnVFJTHBuYAkzxIUk';

        if (keyId && keySecret) {
            try {
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
                    return res.status(200).json(data);
                }
                
                console.warn('⚠️ Razorpay live order API returned non-OK response:', data);
            } catch (apiErr) {
                console.warn('⚠️ Razorpay API fetch exception:', apiErr);
            }
        }

        // Resilient fallback order structure for client-side checkout
        return res.status(200).json({
            id: null,
            fallback: true,
            amount: amount || 79900,
            currency: currency || 'INR',
            receipt: receipt || `receipt_${Date.now()}`
        });

    } catch (error: any) {
        console.error('Create Order Error, returning fallback structure:', error);
        return res.status(200).json({
            id: null,
            fallback: true,
            amount: req.body?.amount || 79900,
            currency: req.body?.currency || 'INR',
            receipt: `receipt_${Date.now()}`
        });
    }
}
