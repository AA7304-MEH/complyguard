export const API_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
  process.env.GEMINI_API_KEY_5,
  process.env.GEMINI_API_KEY, // Fallback to original
].filter(Boolean) as string[];

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
  
  // We'll also cycle through models to ensure availability
  const MODELS_TO_TRY = [
    "models/gemini-1.5-flash", 
    "models/gemini-2.0-flash", 
    "models/gemini-pro"
  ];

  let lastError;

  // Outer loop: Try each API key
  for (let keyAttempt = 0; keyAttempt < API_KEYS.length; keyAttempt++) {
    const key = getCurrentKey();
    const genAI = new GoogleGenerativeAI(key);

    // Inner loop: Try each model with this API key
    for (const modelName of MODELS_TO_TRY) {
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
        return response; // Return the full response object
      } catch (error: any) {
        lastError = error;
        const status = error?.status || error?.code;
        const msg = error?.message?.toLowerCase() || '';

        // If rate limited or quota exceeded, rotate KEY and break inner loop
        if (status === 429 || status === 403 || msg.includes('quota') || msg.includes('leaked')) {
          console.warn(`Key ${currentKeyIndex + 1} failed (${status}), rotating key...`);
          rotateKey();
          break; // Move to next key
        }

        // If model not found or other model error, continue to next MODEL
        console.warn(`Model ${modelName} failed with key ${currentKeyIndex + 1}: ${error.message}`);
        continue;
      }
    }
  }

  throw lastError || new Error('All Gemini API keys and models exhausted.');
}
