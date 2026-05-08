(async () => {
    try {
        const response = await fetch('https://complyguard-gamma.vercel.app/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: 'test_user_node',
                framework: 'GDPR',
                pastedText: 'We collect user data. We do not have a DPO.'
            })
        });
        const data = await response.json();
        console.log("STATUS:", response.status);
        console.log("DATA:", JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("ERROR:", err.message);
    }
})();
