/**
 * Mock Notification Service
 * In a real-world app, this would use a service like Resend, SendGrid, or AWS SES.
 */

export const sendScanCompleteEmail = async (userEmail: string, framework: string, scanId: string, status: 'success' | 'failure') => {
    const reportLink = `${window.location.origin}/report/${scanId}`;
    
    console.group(`📧 MOCK EMAIL SENT to ${userEmail}`);
    console.log(`Subject: Compliance Scan for ${framework} ${status === 'success' ? 'Complete' : 'Failed'}`);
    if (status === 'success') {
        console.log(`Body: Your compliance audit for ${framework} is ready. You can view the full report here: ${reportLink}`);
    } else {
        console.log(`Body: We encountered an error while processing your ${framework} scan. Please try again or contact support.`);
    }
    console.groupEnd();

    // In a real implementation:
    // await fetch('/api/send-email', {
    //   method: 'POST',
    //   body: JSON.stringify({ to: userEmail, subject, body })
    // });
};
