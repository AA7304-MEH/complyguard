import { GoogleGenerativeAI } from "@google/generative-ai";

async function verify() {
    const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        console.error("❌ Error: No API key found. Please set VITE_GEMINI_API_KEY or GEMINI_API_KEY.");
        process.exit(1);
    }

    console.log("🔍 Verifying Gemini API Key...");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    try {
        const result = await model.generateContent("Compliance check test: Respond with 'API_OK' if you see this.");
        console.log("✅ Gemini Success!");
        console.log("Response:", result.response.text());
        console.log("\nYour API key is valid and working with gemini-1.5-pro.");
    } catch (error) {
        console.error("❌ Gemini API Error:");
        console.error(error.message);
        if (error.message.includes("403")) {
            console.error("Tip: This often means the API key is invalid or lacks permissions for this model.");
        }
        if (error.message.includes("429")) {
            console.error("Tip: You've hit the rate limit. Wait a minute and try again.");
        }
        process.exit(1);
    }
}

verify();
