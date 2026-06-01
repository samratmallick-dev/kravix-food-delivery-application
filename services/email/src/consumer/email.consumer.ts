import { getRabbitMQChannel } from "../config/rabbitmq.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../services/gmail.service.js";
import type { EmailJobPayload } from "../types/email.types.js";

export const startEmailConsumer = async (): Promise<void> => {
  const channel = getRabbitMQChannel();

  channel.consume(
    process.env.EMAIL_QUEUE!,
    async (msg) => {
      if (!msg) return;

      let payload: EmailJobPayload;
      try {
        payload = JSON.parse(msg.content.toString()) as EmailJobPayload;
      } catch (err) {
        console.error("[Email Consumer] Failed to parse message:", err);
        channel.nack(msg, false, false);
        return;
      }

      try {
        if (payload.type === "VERIFICATION") {
          await sendVerificationEmail(payload.to, payload.name, payload.token);
        } else if (payload.type === "PASSWORD_RESET") {
          await sendPasswordResetEmail(payload.to, payload.name, payload.token);
        } else {
          console.warn("[Email Consumer] Unknown job type:", (payload as EmailJobPayload).type);
          channel.nack(msg, false, false);
          return;
        }
        channel.ack(msg);
        console.log(`[Email Consumer] ✅ Sent ${payload.type} email to ${payload.to}`);
      } catch (err) {
        console.error(
          `[Email Consumer] ❌ Failed to send ${payload.type} email to ${payload.to}:`,
          err
        );
        channel.nack(msg, false, false);
      }
    },
    { noAck: false }
  );

  console.log(`✅ [Email Service] Consuming from queue: ${process.env.EMAIL_QUEUE}`);
};
