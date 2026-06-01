import { getRabbitMQChannel } from "../config/rabbitmq.js";

interface EmailJob {
  type: "VERIFICATION" | "PASSWORD_RESET";
  to: string;
  name: string;
  token: string;
}

function publish(job: EmailJob): void {
  try {
    const channel = getRabbitMQChannel();
    channel.sendToQueue(
      process.env.EMAIL_QUEUE!,
      Buffer.from(JSON.stringify(job)),
      { persistent: true }
    );
  } catch (err) {
    console.error(`[Auth] ❌ Failed to publish ${job.type} email job:`, err);
  }
}

export const publishVerificationEmail = (to: string, name: string, token: string): void => {
  publish({ type: "VERIFICATION", to, name, token });
};

export const publishPasswordResetEmail = (to: string, name: string, token: string): void => {
  publish({ type: "PASSWORD_RESET", to, name, token });
};
