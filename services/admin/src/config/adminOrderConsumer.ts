import axios from "axios";
import { getRabbitMQChannel } from "./rabbitmq.js";

const processedEvents = new Set<string>();

const emitToAdmin = (event: string, payload: Record<string, unknown>) => {
      axios.post(
            `${process.env.REALTIME_SOCKET_SERVICE_URI}/api/v1/socket/emit`,
            { event, room: "Admin", payload },
            { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! } }
      ).catch((err) => console.error(`Admin socket emit failed [${event}]:`, err.message));
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

            if (processedEvents.has(idempotencyKey)) {
                  console.log(`Admin consumer: duplicate event skipped — ${idempotencyKey}`);
                  channel.ack(msg);
                  return;
            }

            try {
                  switch (parsed.type) {
                        case "ORDER_PLACED":
                              console.log(`📊 Admin notified of new order: ${parsed.data.orderId}`);
                              emitToAdmin("admin:order:new", parsed.data);
                              break;

                        case "RESTAURANT_VERIFIED":
                              console.log(`🏪 Admin event — restaurant verified: ${parsed.data.restaurantId}`);
                              emitToAdmin("admin:restaurant:verified", parsed.data);
                              break;

                        case "RIDER_VERIFIED":
                              console.log(`🏍️ Admin event — rider verified: ${parsed.data.riderId}`);
                              emitToAdmin("admin:rider:verified", parsed.data);
                              break;

                        case "RESTAURANT_DELETED":
                              console.log(`🗑️ Admin event — restaurant deleted: ${parsed.data.restaurantId}`);
                              emitToAdmin("admin:restaurant:deleted", parsed.data);
                              break;

                        case "RIDER_DELETED":
                              console.log(`🗑️ Admin event — rider deleted: ${parsed.data.riderId}`);
                              emitToAdmin("admin:rider:deleted", parsed.data);
                              break;

                        case "USER_DELETED":
                              console.log(`🗑️ Admin event — user deleted: ${parsed.data.userId}`);
                              emitToAdmin("admin:user:deleted", parsed.data);
                              break;

                        default:
                              console.log(`Admin consumer: unknown event type "${parsed.type}" — skipping`);
                  }

                  processedEvents.add(idempotencyKey);
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
