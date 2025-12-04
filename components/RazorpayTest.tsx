import * as React from 'react';

const RazorpayTest: React.FC = () => {
    const [status, setStatus] = React.useState<string>('Idle');
    const [error, setError] = React.useState<string | null>(null);

    const loadScript = () => {
        setStatus('Loading script...');
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
            setStatus('Script loaded');
        };
        script.onerror = () => {
            setStatus('Script load failed');
            setError('Failed to load Razorpay script');
        };
        document.body.appendChild(script);
    };

    const handlePayment = () => {
        if (!(window as any).Razorpay) {
            setError('Razorpay SDK not loaded');
            return;
        }

        setStatus('Initializing payment...');
        const options = {
            key: 'rzp_test_1DP5mmOlF5G5ag', // Using a known public test key for debugging if the env one fails
            amount: 100, // 1 INR
            currency: 'INR',
            name: 'Test Payment',
            description: 'Test Transaction',
            handler: function (response: any) {
                setStatus('Payment Successful');
                alert('Payment ID: ' + response.razorpay_payment_id);
            },
            prefill: {
                name: 'Test User',
                email: 'test@example.com',
                contact: '9999999999',
            },
            theme: {
                color: '#3399cc',
            },
        };

        try {
            const rzp1 = new (window as any).Razorpay(options);
            rzp1.on('payment.failed', function (response: any) {
                setStatus('Payment Failed');
                setError(response.error.description);
            });
            rzp1.open();
        } catch (err: any) {
            setStatus('Exception');
            setError(err.message);
        }
    };

    return (
        <div className="p-8 bg-white rounded-lg shadow-md max-w-md mx-auto mt-10">
            <h2 className="text-2xl font-bold mb-4">Razorpay Isolation Test</h2>

            <div className="mb-4">
                <p className="font-semibold">Status: <span className="font-normal">{status}</span></p>
                {error && <p className="text-red-600 font-semibold">Error: {error}</p>}
            </div>

            <div className="space-y-4">
                <button
                    onClick={loadScript}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    1. Load Razorpay Script
                </button>

                <button
                    onClick={handlePayment}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                    2. Pay ₹1 (Test)
                </button>
            </div>

            <div className="mt-6 text-sm text-gray-600">
                <p>Note: This uses a public test key `rzp_test_1DP5mmOlF5G5ag`. If this works, the issue is likely with the key configuration in the main app.</p>
            </div>
        </div>
    );
};

export default RazorpayTest;
