import axios from "axios";
import { getRabbitMQChannel } from "./rabbitmq.js";

const DEDUP_TTL_MS = 10 * 60 * 1000;
const processedEvents = new Map<string, number>();

const isDuplicate = (key: string): boolean => {
      const now = Date.now();
      for (const [k, ts] of processedEvents) {
            if (now - ts > DEDUP_TTL_MS) processedEvents.delete(k);
      }
      if (processedEvents.has(key)) return true;
      processedEvents.set(key, now);
      return false;
};

const sanitize = (value: unknown): string =>
      String(value ?? "").replace(/[\r\n\t]/g, " ");

const emitToAdmin = (event: string, payload: Record<string, unknown>) => {
      axios.post(
            `${process.env.REALTIME_SOCKET_SERVICE_URI}/api/v1/socket/events`,
            { event, room: "Admin", payload },
            { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! } }
      ).catch((err) => console.error("Admin socket emit failed [%s]:", sanitize(event), err.message));
};

export const startAdminOrderConsumer = async () => {
      const channel = getRabbitMQChannel();

      channel.consume(process.env.ADMIN_EVENT_QUEUE!, async (msg) => {
            if (!msg) return;

            let parsed: { type: string; data: Record<string, unknown> };

            try {
                  parsed = JSON.parse(msg.content.toString());
            } catch {
                  console.error("Admin consumer: failed to parse message — discarding"); 
                  channel.nack(msg, false, false);
                  return;
            }

            const primaryId = (parsed.data?.orderId ?? parsed.data?.restaurantId ?? parsed.data?.riderId ?? parsed.data?.userId ?? "") as string;
            const idempotencyKey = `${parsed.type}:${primaryId}`;

            if (isDuplicate(idempotencyKey)) {
                  console.log("Admin consumer: duplicate event skipped —", sanitize(idempotencyKey));
                  channel.ack(msg);
                  return;
            }

            try {
                  switch (parsed.type) {
                        case "ORDER_PLACED":
                              console.log("📊 Admin notified of new order:", sanitize(parsed.data.orderId));
                              emitToAdmin("admin:order:new", parsed.data);
                              break;

                        case "RESTAURANT_VERIFIED":
                              console.log("🏪 Admin event — restaurant verified:", sanitize(parsed.data.restaurantId));
                              emitToAdmin("admin:restaurant:verified", parsed.data);
                              break;

                        case "RIDER_VERIFIED":
                              console.log("🏍️ Admin event — rider verified:", sanitize(parsed.data.riderId));
                              emitToAdmin("admin:rider:verified", parsed.data);
                              break;

                        case "RESTAURANT_DELETED":
                              console.log("🗑️ Admin event — restaurant deleted:", sanitize(parsed.data.restaurantId));
                              emitToAdmin("admin:restaurant:deleted", parsed.data);
                              break;

                        case "RIDER_DELETED":
                              console.log("🗑️ Admin event — rider deleted:", sanitize(parsed.data.riderId));
                              emitToAdmin("admin:rider:deleted", parsed.data);
                              break;

                        case "USER_DELETED":
                              console.log("🗑️ Admin event — user deleted:", sanitize(parsed.data.userId));
                              emitToAdmin("admin:user:deleted", parsed.data);
                              break;

                        default:
                              console.log("Admin consumer: unknown event type — skipping:", sanitize(parsed.type));
                  }

                  channel.ack(msg);

            } catch (error) {
                  console.error("Admin consumer: unhandled error:", error);
                  if (msg.fields.redelivered) {
                        channel.nack(msg, false, false);
                  } else {
                        channel.nack(msg, false, true);
                  }
            }
      }, { noAck: false });
};
