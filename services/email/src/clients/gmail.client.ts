import { google } from "googleapis";
import { IGmailClient } from "../interfaces/IGmailClient.js";
import { EmailMessage } from "../domain/entities/EmailMessage.js";

export class GmailClient implements IGmailClient {
  private readonly oauth2Client: any;
  private readonly enabled: boolean;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );

    this.enabled = Boolean(
      process.env.GMAIL_CLIENT_ID &&
      process.env.GMAIL_CLIENT_SECRET &&
      process.env.GMAIL_REFRESH_TOKEN &&
      process.env.EMAIL_FROM_ADDRESS
    );
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private buildRawMessage(message: EmailMessage): string {
    const boundary = "kravix_boundary_001";
    const raw = [
      `From: ${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
      `To: ${message.to}`,
      `Subject: ${message.subject}`,
      "MIME-Version: 1.0",
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      "Content-Type: text/plain; charset=UTF-8",
      "",
      message.text,
      "",
      `--${boundary}`,
      "Content-Type: text/html; charset=UTF-8",
      "",
      message.html,
      "",
      `--${boundary}--`
    ].join("\r\n");

    return Buffer.from(raw).toString("base64url");
  }

  async send(message: EmailMessage): Promise<void> {
    if (!this.enabled) {
      throw new Error("Email service disabled — check Gmail env vars");
    }

    this.oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN ?? null
    });

    const gmail = google.gmail({ version: "v1", auth: this.oauth2Client });
    const raw = this.buildRawMessage(message);

    await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw }
    });

    console.log(`📧 Email sent to ${message.to}`);
  }
}
