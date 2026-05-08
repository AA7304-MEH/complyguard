const { GoogleGenerativeAI } = require('@google/generative-ai');
const apiKey = 'AIzaSyA0QfVHfo4t2tQnqEPAhfNF9OIU7bUiXrI';

(async () => {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // Test with a very safe model name
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hello");
        console.log("GEMINI_PRO_OK:", result.response.text());
        
        // Test with 1.5 flash (canonical name)
        try {
            const flash = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const flashRes = await flash.generateContent("Hello");
            console.log("GEMINI_1.5_FLASH_OK:", flashRes.response.text());
        } catch (e) {
            console.log("GEMINI_1.5_FLASH_FAILED:", e.message);
        }
    } catch (err) {
        console.error("GEMINI_ERROR:", err.message);
    }
})();
