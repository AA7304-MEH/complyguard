import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI, SchemaType, Schema } from '@google/generative-ai';
import { FRAMEWORKS } from '../lib/frameworks';

// --- Inline Supabase client for serverless ---
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const MODELS = ["gemini-1.5-flash-latest", "gemini-1.5-pro-latest", "gemini-pro"];

const RESPONSE_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    findings: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          requirement: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          severity: { type: SchemaType.STRING },
          remediation: { type: SchemaType.STRING }
        },
        required: ["requirement", "description", "severity", "remediation"]
      }
    }
  }
};

async function callGeminiWithFallback(parts: any[]) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const genAI = new GoogleGenerativeAI(apiKey);

  for (const modelName of MODELS) {
    try {
      console.log(`[Gemini] Attempting with model: ${modelName}`);
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
          responseSchema: modelName.includes('1.5') ? RESPONSE_SCHEMA : undefined
        }
      });
      
      const result = await model.generateContent(parts);
      const response = await result.response;
      const text = await response.text();
      return JSON.parse(text);
    } catch (error: any) {
      console.warn(`[Gemini] Model ${modelName} failed:`, error.message);
      if (MODELS.indexOf(modelName) === MODELS.length - 1) throw error;
      continue;
    }
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Content-Type', 'application/json');
    
    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method Not Allowed' });
        }

        const { framework, pastedText, userId, email, base64File, fileName } = req.body;

        if (!userId) return res.status(401).json({ error: 'Unauthorized: Missing User ID' });

        const checklist = FRAMEWORKS[framework] || FRAMEWORKS.GDPR;
        
        const prompt = `
            You are a highly pedantic, expert compliance auditor and legal professional. 
            Analyze the provided content against the strict requirements of the ${framework} framework.
            
            Requirements Checklist:
            ${checklist}

            Strict Auditing Rules:
            1. Only report items that are MISSING, INCOMPLETE, NON-COMPLIANT, or VAGUE regarding the requirement.
            2. If the document is an image or scan with no text layer, use your native OCR to read it.
            3. Output the result in JSON format only.
        `;

        const parts: any[] = [{ text: prompt }];
        if (pastedText) parts.push({ text: `Document Text: """${pastedText}"""` });
        if (base64File && fileName) {
            const ext = fileName.split('.').pop()?.toLowerCase();
            let mimeType = 'application/pdf';
            if (ext === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            if (ext === 'doc') mimeType = 'application/msword';
            if (ext === 'txt') mimeType = 'text/plain';
            if (['png', 'jpg', 'jpeg'].includes(ext || '')) mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

            parts.push({ inlineData: { data: base64File, mimeType } });
        }

        // 1. Run Gemini Analysis
        const result = await callGeminiWithFallback(parts);

        // 3. Calculate score
        const findings = result.findings || [];
        const deductions: Record<string, number> = { Critical: 25, High: 15, Medium: 7, Low: 2 };
        const totalDeduction = findings.reduce((acc: number, f: any) => acc + (deductions[f.severity] || 5), 0);
        const score = Math.max(0, 100 - totalDeduction);

        const scanId = 'scan-' + Date.now().toString(36);

        if (supabase) {
            try {
                await supabase.from('scan_jobs').insert([{
                    user_id: userId,
                    framework,
                    status: 'completed',
                    result: findings,
                    score,
                    file_url: fileName || null,
                    user_email: email || null
                }]);
            } catch (dbErr: any) {
                console.error('[DB Error]:', dbErr.message);
            }
        }

        return res.status(200).json({
            id: scanId,
            user_id: userId,
            framework,
            status: 'completed',
            result: findings,
            score,
            created_at: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('❌ Scan fatal error:', error);
        return res.status(500).json({ 
            error: 'Scan failed', 
            message: error.message || 'Unknown error',
            details: error.toString()
        });
    }
}

