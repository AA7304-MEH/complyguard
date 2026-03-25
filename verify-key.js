import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = "AIzaSyD9ZK0a92__91N5RgXCCk1tEWDNAU4tZZ8";

async function testKey() {
    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hello, are you working?");
        console.log("SUCCESS:", result.response.text());
    } catch (error) {
        console.error("FAILURE:", error.message);
    }
}

testKey();
