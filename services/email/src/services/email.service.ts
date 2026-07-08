import { IEmailService } from "../interfaces/IEmailService.js";
import { IGmailClient } from "../interfaces/IGmailClient.js";
import { EmailFactory } from "../factories/EmailFactory.js";
import { EmailVerificationDto, PasswordResetDto } from "../dto/SendEmailDto.js";

export class EmailService implements IEmailService {
  constructor(private readonly gmailClient: IGmailClient) {}

  async sendVerificationEmail(dto: EmailVerificationDto): Promise<void> {
    const link = `${process.env.CLIENT_URL}/verify-email?token=${dto.token}`;
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
          <h2 style="margin:0 0 12px;color:#111827;font-size:20px;">Hi ${dto.name},</h2>
          <p style="margin:0 0 24px;color:#6b7280;line-height:1.6;">Thanks for signing up! Please verify your email address to activate your Kravix account.</p>
          <a href="${link}" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px;">Verify Email</a>
          <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;">This link expires in 24 hours. If you did not create an account, you can safely ignore this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const text = `Hi ${dto.name},\n\nPlease verify your Kravix account:\n\n${link}\n\nThis link expires in 24 hours.`;

    const msg = EmailFactory.create(dto.to, subject, html, text);
    await this.gmailClient.send(msg);
  }

  async sendPasswordResetEmail(dto: PasswordResetDto): Promise<void> {
    const link = `${process.env.CLIENT_URL}/reset-password?token=${dto.token}`;
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
          <h2 style="margin:0 0 12px;color:#111827;font-size:20px;">Hi ${dto.name},</h2>
          <p style="margin:0 0 24px;color:#6b7280;line-height:1.6;">We received a request to reset your Kravix password.</p>
          <a href="${link}" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px;">Reset Password</a>
          <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;">This link expires in 1 hour. If you did not request this, ignore this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const text = `Hi ${dto.name},\n\nReset your Kravix password:\n\n${link}\n\nThis link expires in 1 hour.`;

    const msg = EmailFactory.create(dto.to, subject, html, text);
    await this.gmailClient.send(msg);
  }
}
