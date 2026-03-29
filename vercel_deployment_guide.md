# ComplyGuard AI Deployment Guide (Vercel)

Follow these steps to deploy your production-ready ComplyGuard AI platform.

## 1. Environment Variables
Add these to your **Vercel Project Settings > Environment Variables**:

| Variable | Source | Purpose |
|----------|---------|---------|
| `GEMINI_API_KEY` | Google AI Studio | AI Analysis Engine |
| `CLERK_SECRET_KEY` | Clerk Dashboard | Admin Auth & Verification |
| `SUPABASE_URL` | Supabase Dashboard | Database Endpoint |
| `SUPABASE_ANON_KEY` | Supabase Dashboard | Client-side DB Access |
| `RESEND_API_KEY` | Resend.com | Email Notifications |
| `CRON_SECRET` | Any random string | Protects `/api/process-queue` |

## 2. Supabase Setup
1. Create a new Supabase project.
2. Go to **SQL Editor**.
3. Paste the contents of `supabase_migration.sql` and run it.
4. Go to **API Settings** and copy the URL and Anon Key to Vercel.

## 3. Vercel Cron Job
To ensure queued scans are processed automatically, configure a Cron Job in your `vercel.json` (already in codebase) or via the Vercel Dashboard:

**Schedule**: `* * * * *` (Every minute, or every 10s if using Vercel Pro)
**Target**: `/api/process-queue`
**Secret Header**: Add `Authorization: Bearer <YOUR_CRON_SECRET>`

## 4. Final Verification
1. Deploy to Vercel.
2. Go to your site and click "Try Demo" to ensure Gemini is responding.
3. Sign in and upload a real PDF/DOCX.
4. Wait for the email notification or refresh the dashboard to see your report.

---
**Production Note**: Ensure your Clerk "Authorized Redirect URIs" include your production domain.
