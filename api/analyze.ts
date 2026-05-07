import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callGeminiWithFallback, FRAMEWORKS } from '../lib/gemini-service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { documentText, framework } = req.body;

  if (!documentText) {
    return res.status(400).json({ error: 'Missing documentText' });
  }

  if (documentText.length > 50000) {
    return res.status(400).json({ error: 'Document text exceeds 50,000 character limit' });
  }

  try {
    const checklist = FRAMEWORKS[framework] || FRAMEWORKS.GDPR;
    
    const prompt = `
        You are a highly pedantic, expert compliance auditor and legal professional. 
        Analyze the following document against the strict requirements of the ${framework} framework.
        
        Requirements Checklist:
        ${checklist}

        Document Content:
        """${documentText}"""

        Strict Auditing Rules:
        1. Only report items that are MISSING, INCOMPLETE, NON-COMPLIANT, or VAGUE regarding the requirement.
        2. If a section is vague or uses non-committal language (e.g., "we try to protect data"), record it as a finding.
        3. If the document is clearly not a policy or contract (e.g., random text or gibberish), generate findings stating that the text completely fails to address the framework.
        4. If you find absolute perfection and NO issues, return an empty 'findings' array.
        
        Output Formatting Guidelines:
        - "requirement": Quote the specific Framework Article/Criterion being violated.
        - "description": Provide a professional, objective statement of what is missing or wrong in the text.
        - "severity": Assign "Critical" for missing legal bases, "High" for missing security controls, "Medium" for vague clauses, and "Low" for minor gaps.
        - "remediation": Provide highly actionable steps to fix the document as a direct instruction.
    `;

    const json = await callGeminiWithFallback([{ text: prompt }]);

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(json);
  } catch (error: any) {
    console.error('[API] Analysis Error:', error);
    return res.status(500).json({ error: 'AI Analysis failed', details: error.message });
  }
}

