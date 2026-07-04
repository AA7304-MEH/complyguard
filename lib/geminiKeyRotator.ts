export const API_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
  process.env.GEMINI_API_KEY_5,
  process.env.GEMINI_API_KEY, // Fallback to original
].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i) as string[];

let currentKeyIndex = 0;

export function getCurrentKey(): string {
  if (API_KEYS.length === 0) throw new Error('No Gemini API keys configured');
  return API_KEYS[currentKeyIndex];
}

export function rotateKey(): string {
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  console.log(`Rotated to Gemini key ${currentKeyIndex + 1} of ${API_KEYS.length}`);
  return API_KEYS[currentKeyIndex];
}

export async function callGeminiWithRotation(parts: string | any[], customConfig?: any): Promise<any> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  
  // Only use currently-supported models (gemini-1.5 is deprecated/removed from v1beta)
  const MODELS_TO_TRY = [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash-lite",
  ];

  let lastError;

  // Try each model
  for (const modelName of MODELS_TO_TRY) {
    // For each model, try all available API keys
    for (let keyAttempt = 0; keyAttempt < API_KEYS.length; keyAttempt++) {
      const key = getCurrentKey();
      const genAI = new GoogleGenerativeAI(key);

      try {
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: customConfig || {
            temperature: 0.1,
            responseMimeType: "application/json"
          }
        });
        
        const promptParts = typeof parts === 'string' ? [{ text: parts }] : parts;
        const result = await model.generateContent(promptParts);
        const response = await result.response;
        console.log(`✅ Gemini success: model=${modelName}, key=${currentKeyIndex + 1}`);
        return response;
      } catch (error: any) {
        lastError = error;
        const status = error?.status || error?.code;
        const msg = error?.message?.toLowerCase() || '';

        // If it's a 404 or model not found, move to next model immediately
        if (status === 404 || msg.includes('not found') || msg.includes('unsupported') || msg.includes('deprecated')) {
            console.warn(`⚠️ Model ${modelName} not available (${status}). Trying next model...`);
            break;
        }

        // If API key is invalid, rotate to next key
        if (status === 400 || msg.includes('api_key_invalid') || msg.includes('api key not valid')) {
          console.warn(`⚠️ Key ${currentKeyIndex + 1} is invalid. Rotating...`);
          rotateKey();
          continue;
        }

        // If rate limited or service unavailable, rotate key and retry same model
        if (status === 429 || status === 503 || msg.includes('quota') || msg.includes('limit')) {
          console.warn(`⚠️ Key ${currentKeyIndex + 1} rate-limited for ${modelName}. Rotating key...`);
          if (status === 503) await new Promise(r => setTimeout(r, 1000));
          rotateKey();
          continue;
        }

        // For other errors, log and try next key
        console.warn(`⚠️ Error with key ${currentKeyIndex + 1} and model ${modelName}: ${error.message}`);
        rotateKey();
      }
    }
  }

  throw lastError || new Error('All Gemini API keys and models exhausted.');
}
