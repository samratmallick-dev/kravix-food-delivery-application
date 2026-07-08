import axios from "axios";
import { IAuthEventPublisher } from "../interfaces/IAuthEventPublisher.js";
import { getRabbitMQChannel } from "../config/rabbitmq.js";

export class AuthEventPublisher implements IAuthEventPublisher {
  publishUserRoleUpdated(userId: string, name: string, email: string, role: string | null): void {
    const data = { userId, name, email, role };
    this.publishToSocketOrMQ("USER_ROLE_UPDATED", "user:role_updated", userId, data, process.env.AUTH_EVENT_QUEUE!);
  }

  publishUserRegistered(userId: string, name: string, email: string, image: string): void {
    const data = { userId, name, email, image };
    this.publishToSocketOrMQ("USER_REGISTERED", "user:registered", userId, data, process.env.AUTH_EVENT_QUEUE!);
  }

  publishUserProfileSynced(userId: string, name: string, email: string, image: string): void {
    const data = { userId, name, email, image };
    this.publishToSocketOrMQ("USER_PROFILE_SYNCED", "user:profile_synced", userId, data, process.env.AUTH_EVENT_QUEUE!);
  }

  publishVerificationEmail(email: string, name: string, token: string): void {
    try {
      const channel = getRabbitMQChannel();
      const job = { type: "VERIFICATION", to: email, name, token };
      channel.sendToQueue(
        process.env.EMAIL_QUEUE!,
        Buffer.from(JSON.stringify(job)),
        { persistent: true }
      );
    } catch (err) {
      console.error("Failed to publish email verification job:", err);
    }
  }

  publishPasswordResetEmail(email: string, name: string, token: string): void {
    try {
      const channel = getRabbitMQChannel();
      const job = { type: "PASSWORD_RESET", to: email, name, token };
      channel.sendToQueue(
        process.env.EMAIL_QUEUE!,
        Buffer.from(JSON.stringify(job)),
        { persistent: true }
      );
    } catch (err) {
      console.error("Failed to publish password reset email job:", err);
    }
  }

  private publishToSocketOrMQ(type: string, event: string, userId: string, data: Record<string, any>, queueName: string): void {
    axios
      .post(
        `${process.env.REALTIME_SOCKET_SERVICE_URI}/api/v1/socket/events`,
        { event, room: `User:${userId}`, payload: data },
        { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } }
      )
      .catch((httpErr: unknown) => {
        try {
          const channel = getRabbitMQChannel();
          const message = JSON.stringify({ type, data });
          channel.sendToQueue(queueName, Buffer.from(message), { persistent: true });
        } catch (mqErr) {
          console.error(`Failed to publish fallback MQ for ${type}:`, mqErr);
        }
      });
  }
}
