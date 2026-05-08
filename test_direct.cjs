const apiKey = 'AIzaSyA0QfVHfo4t2tQnqEPAhfNF9OIU7bUiXrI';
const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

(async () => {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Hello" }] }]
            })
        });
        const data = await response.json();
        console.log("STATUS:", response.status);
        console.log("DATA:", JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("FETCH_ERROR:", err.message);
    }
})();
