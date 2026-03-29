/**
 * Email Notification Utility (Resend)
 */
export async function sendReportEmail(userEmail: string, jobId: string, summary: string) {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
        console.warn("[Email] RESEND_API_KEY is missing. Skipping email.");
        return;
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: 'ComplyGuard AI <reports@complyguard.ai>',
                to: [userEmail],
                subject: 'Your Compliance Report is Ready! 🛡️',
                html: `
                    <h2>Compliance Audit Complete</h2>
                    <p>${summary}</p>
                    <p>Click the link below to view your full detailed report:</p>
                    <a href="https://complyguard-gamma.vercel.app/reports/${jobId}" 
                       style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                       View Detailed Report
                    </a>
                    <br/><br/>
                    <p>Thank you for choosing ComplyGuard AI.</p>
                `
            })
        });

        if (response.ok) {
            console.log(`[Email] Report notification sent to ${userEmail}`);
        } else {
            const error = await response.json();
            console.error("[Email] Failed to send:", error);
        }
    } catch (error) {
        console.error("[Email] Network error:", error);
    }
}
