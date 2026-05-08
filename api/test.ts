import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
    res.status(200).json({ 
        message: 'Test OK', 
        env_check: !!process.env.GEMINI_API_KEY,
        node_version: process.version
    });
}
