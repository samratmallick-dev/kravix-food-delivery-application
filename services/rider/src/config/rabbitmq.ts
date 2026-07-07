import amqp from "amqplib";
import { startRatingConsumer } from "./ratingConsumer.js";
import { orderReadyConsumer } from "./orderReadyConsumer.js";

let channel: amqp.Channel | null = null;
let connection: amqp.ChannelModel | null = null;
let reconnectDelay = 2000;

export const getRabbitMQChannel = (): amqp.Channel => {
      if (!channel) throw new Error("RabbitMQ channel is not initialized in Rider Service");
      return channel;
};

export const connectRabbitMQ = async (): Promise<void> => {
      try {
            connection = await amqp.connect(process.env.RABITMQ_URL!);
            channel = await connection.createChannel();

            channel.prefetch(1);

            await channel.assertQueue(process.env.RIDER_QUEUE!, { durable: true });
            await channel.assertQueue(process.env.ORDER_READY_QUEUE!, { durable: true });

            reconnectDelay = 2000;
            console.log("✅ Connected to RabbitMQ in Rider Service");

            await startRatingConsumer();
            await orderReadyConsumer();

            connection.on("error", (err) => {
                  console.error("RabbitMQ connection error in Rider Service:", err.message);
                  scheduleReconnect();
            });
            connection.on("close", () => {
                  console.warn("RabbitMQ connection closed in Rider Service — reconnecting...");
                  scheduleReconnect();
            });
      } catch (error: unknown) {
            console.error("Error while connecting to RabbitMQ in Rider Service:", error);
            scheduleReconnect();
      }
};

const scheduleReconnect = () => {
      channel = null;
      connection = null;
      console.log(`Reconnecting to RabbitMQ in ${reconnectDelay / 1000}s...`);
      setTimeout(() => {
            reconnectDelay = Math.min(reconnectDelay * 2, 30000);
            connectRabbitMQ();
      }, reconnectDelay);
};