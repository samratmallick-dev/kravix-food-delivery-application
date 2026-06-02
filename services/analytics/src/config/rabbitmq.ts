import amqp from "amqplib";
import { clearCache } from "../services/cachingService.js";

let channel: amqp.Channel;
let connection: amqp.ChannelModel;

export const connectRabbitMQ = async () => {
      try {
            connection = await amqp.connect(process.env.RABITMQ_URL!);
            channel = await connection.createChannel();

            channel.prefetch(1);

            await channel.assertQueue(process.env.ADMIN_EVENT_QUEUE!, {
                  durable: true,
            });

            console.log("✅ Connected to RabbitMQ in Analytics Service");

            channel.consume(process.env.ADMIN_EVENT_QUEUE!, async (msg) => {
                  if (!msg) return;
                  try {
                        const event = JSON.parse(msg.content.toString());
                        console.log(`[Analytics] Received event: ${event.type}`);

                        if (
                              ["ORDER_PLACED", "RIDER_RATED", "REVIEWS_MODERATED"].includes(
                                    event.type,
                              )
                        ) {
                              await clearCache();
                              console.log(
                                    "[Analytics Cache] Invalidated due to event:",
                                    event.type,
                              );
                        }

                        channel.ack(msg);
                  } catch (err) {
                        console.error("Error processing event in Analytics Service:", err);
                        channel.ack(msg);
                  }
            });

            connection.on("error", (err) => {
                  console.error(
                        "RabbitMQ connection error in Analytics Service:",
                        err.message,
                  );
                  process.exit(1);
            });
            connection.on("close", () => {
                  console.error(
                        "RabbitMQ connection closed in Analytics Service — restarting",
                  );
                  process.exit(1);
            });
      } catch (error: unknown) {
            console.error(
                  "Error while connecting to RabbitMQ in Analytics Service:",
                  error,
            );
            throw new Error(
                  `RabbitMQ connection failed in Analytics Service: ${error}`,
            );
      }
};

export const getRabbitMQChannel = (): amqp.Channel => {
      if (!channel) {
            throw new Error("RabbitMQ channel is not initialized in Analytics Service");
      }
      return channel;
};
