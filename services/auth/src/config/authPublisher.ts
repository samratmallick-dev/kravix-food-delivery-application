import axios from "axios";
import { getRabbitMQChannel } from "./rabbitmq.js";

export type AuthEventType = "USER_REGISTERED" | "USER_ROLE_UPDATED" | "USER_PROFILE_SYNCED";

const SOCKET_EVENT_MAP: Record<AuthEventType, string> = {
      USER_REGISTERED: "user:registered",
      USER_ROLE_UPDATED: "user:role_updated",
      USER_PROFILE_SYNCED: "user:profile_synced",
};

export const publishAuthEvent = (
      type: AuthEventType,
      data: Record<string, unknown>
): void => {
      const socketEvent = SOCKET_EVENT_MAP[type];
      const userId = data["userId"] as string | undefined;

      axios.post(
            `${process.env.REALTIME_SOCKET_SERVICE_URI}/api/v1/socket/events`,
            {
                  event: socketEvent,
                  room: `User:${userId}`,
                  payload: data,
            },
            { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } }
      )
            .then(() => {
                  console.log(`[Auth] 📤 Socket event "${socketEvent}" emitted to User:${userId}`);
            })
            .catch((httpErr: unknown) => {
                  const msg = httpErr instanceof Error ? httpErr.message : String(httpErr);
                  console.error(`[Auth] ⚠️ Realtime HTTP call failed for "${socketEvent}", falling back to RabbitMQ: ${msg}`);

                  try {
                        const channel = getRabbitMQChannel();
                        const message = JSON.stringify({ type, data });
                        const sent = channel.sendToQueue(
                              process.env.AUTH_EVENT_QUEUE!,
                              Buffer.from(message),
                              { persistent: true }
                        );
                        if (sent) {
                              console.log(`[Auth] 📤 Fallback: published "${type}" to AUTH_EVENT_QUEUE`);
                        } else {
                              console.warn(`[Auth] ⚠️ RabbitMQ buffer full — fallback event "${type}" was not sent`);
                        }
                  } catch (mqErr) {
                        console.error(`[Auth] ❌ Both Realtime HTTP and RabbitMQ failed for "${type}":`, mqErr);
                  }
            });
};
