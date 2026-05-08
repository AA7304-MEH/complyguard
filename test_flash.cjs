const { GoogleGenerativeAI } = require('@google/generative-ai');
const apiKey = 'AIzaSyA0QfVHfo4t2tQnqEPAhfNF9OIU7bUiXrI';

(async () => {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // We can't list models directly from the high-level SDK easily without fetching.
        // But we can try a different approach.
        console.log("Testing with gemini-1.5-flash...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hello");
        console.log("SUCCESS:", result.response.text());
    } catch (err) {
        console.error("ERROR:", err.message);
    }
})();
