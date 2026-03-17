import nodemailer from 'nodemailer';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const EMAIL_FROM = process.env.EMAIL_FROM || '"HackThonGo" <noreply@hackthongo.com>';

// In a real app, you would configure these in .env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendSubmissionReceipt(to: string, receiptNumber: string, projectName: string) {
  if (!process.env.SMTP_HOST) {
    console.log(`[DEV MODE] Simulated email to ${to}: Receipt ${receiptNumber} for ${projectName}`);
    return true;
  }

  try {
    const safeProjectName = escapeHtml(projectName);
    const safeReceiptNumber = escapeHtml(receiptNumber);
    await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject: `Project Submission Received: ${safeProjectName}`,
      html: `
        <div style="font-family: monospace; padding: 20px; background: #0a0a0a; color: #4ade80;">
          <h2 style="color: #4ade80;">HackThonGo System Message</h2>
          <p>We have successfully received your project submission.</p>
          <p><strong>Project Name:</strong> ${safeProjectName}</p>
          <p><strong>Receipt Number:</strong> <span style="background: #111; padding: 4px; border: 1px solid #166534;">${safeReceiptNumber}</span></p>
          <p>Please keep this receipt number for your records.</p>
          <p>---<br/>End of Message.</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Email sending failed:", error);
    return false;
  }
}

export async function sendPromotionNotification(to: string, projectName: string, status: 'PROMOTED' | 'ELIMINATED') {
  if (!process.env.SMTP_HOST) {
    console.log(`[DEV MODE] Simulated email to ${to}: ${projectName} is ${status}`);
    return true;
  }

  const isPromoted = status === 'PROMOTED';
  const safeProjectName = escapeHtml(projectName);
  const subject = isPromoted
    ? `Congratulations! ${safeProjectName} has advanced!`
    : `Update on your submission: ${safeProjectName}`;

  const body = isPromoted
    ? `<p>Congratulations! Your project <strong>${safeProjectName}</strong> has been promoted to the next round.</p>`
    : `<p>Thank you for participating. Unfortunately, your project <strong>${safeProjectName}</strong> did not advance to the next round.</p>`;

  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      html: `
        <div style="font-family: monospace; padding: 20px; background: #0a0a0a; color: #4ade80;">
          <h2 style="color: #4ade80;">HackThonGo Status Update</h2>
          ${body}
          <p>---<br/>End of Message.</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Email sending failed:", error);
    return false;
  }
}
