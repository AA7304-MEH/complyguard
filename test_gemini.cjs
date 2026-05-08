const { GoogleGenerativeAI } = require('@google/generative-ai');
const apiKey = 'AIzaSyA0QfVHfo4t2tQnqEPAhfNF9OIU7bUiXrI'; // From .env.production

(async () => {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const result = await model.generateContent("Hello");
        console.log("GEMINI_OK:", result.response.text());
    } catch (err) {
        console.error("GEMINI_ERROR:", err.message);
    }
})();
