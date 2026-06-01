import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI
);

const enabled = Boolean(
  process.env.GMAIL_CLIENT_ID &&
  process.env.GMAIL_CLIENT_SECRET &&
  process.env.GMAIL_REFRESH_TOKEN &&
  process.env.EMAIL_FROM_ADDRESS
);

if (enabled) {
  console.log("✅ Gmail API email service enabled");
} else {
  console.warn("⚠️ Gmail API email service disabled (missing env vars)");
}

function buildRawMessage(to: string, subject: string, html: string, text: string): string {
  const boundary = "kravix_boundary_001";
  const raw = [
    `From: ${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "",
    text,
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "",
    html,
    "",
    `--${boundary}--`,
  ].join("\r\n");

  return Buffer.from(raw).toString("base64url");
}

async function sendEmail(to: string, subject: string, html: string, text: string): Promise<void> {
  if (!enabled) throw new Error("Email service disabled — check Gmail env vars");

  oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN ?? null });
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });
  const raw = buildRawMessage(to, subject, html, text);
  await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
  console.log(`📧 Email sent to ${to}`);
}

export async function sendVerificationEmail(to: string, name: string, token: string): Promise<void> {
  const link = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  const subject = "Verify your Kravix account";

  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#f97316;padding:24px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:800;">🍛 Kravix</h1>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          <h2 style="margin:0 0 12px;color:#111827;font-size:20px;">Hi ${name},</h2>
          <p style="margin:0 0 24px;color:#6b7280;line-height:1.6;">Thanks for signing up! Please verify your email address to activate your Kravix account.</p>
          <a href="${link}" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px;">Verify Email</a>
          <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;">This link expires in 24 hours. If you did not create an account, you can safely ignore this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Hi ${name},\n\nPlease verify your Kravix account:\n\n${link}\n\nThis link expires in 24 hours.`;
  await sendEmail(to, subject, html, text);
}

export async function sendPasswordResetEmail(to: string, name: string, token: string): Promise<void> {
  const link = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  const subject = "Reset your Kravix password";

  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#f97316;padding:24px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:800;">🍛 Kravix</h1>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          <h2 style="margin:0 0 12px;color:#111827;font-size:20px;">Hi ${name},</h2>
          <p style="margin:0 0 24px;color:#6b7280;line-height:1.6;">We received a request to reset your Kravix password.</p>
          <a href="${link}" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px;">Reset Password</a>
          <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;">This link expires in 1 hour. If you did not request this, ignore this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Hi ${name},\n\nReset your Kravix password:\n\n${link}\n\nThis link expires in 1 hour.`;
  await sendEmail(to, subject, html, text);
}
