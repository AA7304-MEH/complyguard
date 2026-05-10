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
  
  // Try models in order of capability. If a model fails on ALL keys, move to next model.
  const MODELS_TO_TRY = [
    "models/gemini-2.5-flash",
    "models/gemini-2.0-flash",
    "models/gemini-2.0-flash-lite",
    "models/gemini-1.5-flash",
    "models/gemini-1.5-pro"
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
        return response;
      } catch (error: any) {
        lastError = error;
        const status = error?.status || error?.code;
        const msg = error?.message?.toLowerCase() || '';

        // If it's a 404 (model not found), don't waste time on other keys for this model
        if (status === 404 || msg.includes('not found') || msg.includes('unsupported')) {
            console.warn(`Model ${modelName} not supported for key ${currentKeyIndex + 1}. Trying next model...`);
            break; // Skip to next model
        }

        // If rate limited or service unavailable, try the NEXT KEY for the SAME model
        if (status === 429 || status === 503 || msg.includes('quota') || msg.includes('demand') || msg.includes('limit')) {
          console.warn(`Key ${currentKeyIndex + 1} failed for ${modelName} (${status}). Rotating key...`);
          if (status === 503) await new Promise(r => setTimeout(r, 1000)); // Small pause for 503
          rotateKey();
          continue; // Try next key for this model
        }

        // For other errors, log and try next key
        console.warn(`Error with key ${currentKeyIndex + 1} and model ${modelName}: ${error.message}`);
        rotateKey();
      }
    }
  }

  throw lastError || new Error('All Gemini API keys and models exhausted.');
}
