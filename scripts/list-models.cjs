
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

async function listModels(key, index) {
  console.log(`Listing models for Key ${index + 1}...`);
  const genAI = new GoogleGenerativeAI(key);
  try {
    // The SDK doesn't have a direct listModels, we need to use the REST API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await response.json();
    console.log(`Key ${index + 1} Models:`, data.models?.map(m => m.name).slice(0, 10));
  } catch (error) {
    console.error(`Key ${index + 1} FAILED: ${error.message}`);
  }
}

async function run() {
  for (let i = 0; i < keys.length; i++) {
    await listModels(keys[i], i);
  }
}

run();
