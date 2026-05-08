const apiKey = 'AIzaSyD9ZK0a92__91N5RgXCCk1tEWDNAU4tZZ8';
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

(async () => {
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log("RESPONSE:", JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("ERROR:", err.message);
    }
})();
