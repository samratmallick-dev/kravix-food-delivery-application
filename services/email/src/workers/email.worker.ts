import { Channel } from "amqplib";
import { IEmailService } from "../interfaces/IEmailService.js";

export interface EmailJobPayload {
  type: "VERIFICATION" | "PASSWORD_RESET";
  to: string;
  name: string;
  token: string;
}

export class EmailWorker {
  constructor(
    private readonly channel: Channel,
    private readonly queueName: string,
    private readonly emailService: IEmailService
  ) {}

  async start(): Promise<void> {
    await this.channel.consume(
      this.queueName,
      async (msg) => {
        if (!msg) return;

        let payload: EmailJobPayload;
        try {
          payload = JSON.parse(msg.content.toString()) as EmailJobPayload;
        } catch (err) {
          console.error("[Email Consumer] Failed to parse message:", err);
          this.channel.nack(msg, false, false);
          return;
        }

        try {
          if (payload.type === "VERIFICATION") {
            await this.emailService.sendVerificationEmail({
              to: payload.to,
              name: payload.name,
              token: payload.token
            });
          } else if (payload.type === "PASSWORD_RESET") {
            await this.emailService.sendPasswordResetEmail({
              to: payload.to,
              name: payload.name,
              token: payload.token
            });
          } else {
            console.warn("[Email Consumer] Unknown job type:", payload.type);
            this.channel.nack(msg, false, false);
            return;
          }
          this.channel.ack(msg);
          console.log(`[Email Consumer] ✅ Sent ${payload.type} email to ${payload.to}`);
        } catch (err) {
          console.error(`[Email Consumer] ❌ Failed to send ${payload.type} email to ${payload.to}:`, err);
          this.channel.nack(msg, false, false);
        }
      },
      { noAck: false }
    );

    console.log(`✅ [Email Service] Consuming from queue: ${this.queueName}`);
  }
}
