
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
  });
}

loadEnv();

const keys = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
].filter(Boolean);

async function testKey(key, index) {
  console.log(`Testing Key ${index + 1}: ${key.substring(0, 10)}...`);
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
  try {
    const result = await model.generateContent("Say hello");
    console.log(`Key ${index + 1} SUCCESS: ${result.response.text()}`);
    return true;
  } catch (error) {
    console.error(`Key ${index + 1} FAILED: ${error.message}`);
    return false;
  }
}

async function run() {
  if (keys.length === 0) {
    console.log("No keys found in .env.local");
    return;
  }
  for (let i = 0; i < keys.length; i++) {
    await testKey(keys[i], i);
  }
}

run();
