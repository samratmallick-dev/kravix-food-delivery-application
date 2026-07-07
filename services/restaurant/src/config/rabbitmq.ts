import amqp from "amqplib";
import { startPayment } from "./paymentConsumer.js";

let channel: amqp.Channel | null = null;
let connection: amqp.ChannelModel | null = null;
let reconnectDelay = 2000;

export const getRabbitMQChannel = (): amqp.Channel => {
      if (!channel) throw new Error("RabbitMQ channel is not initialized in Restaurant Service");
      return channel;
};

export const connectRabbitMQ = async (): Promise<void> => {
      try {
            connection = await amqp.connect(process.env.RABITMQ_URL!);
            channel = await connection.createChannel();
            channel.prefetch(1);

            await channel.assertQueue(process.env.PAYMENT_QUEUE!, { durable: true });
            await channel.assertQueue(process.env.RIDER_QUEUE!, { durable: true });
            await channel.assertQueue(process.env.ORDER_READY_QUEUE!, { durable: true });
            await channel.assertQueue(process.env.ADMIN_EVENT_QUEUE!, { durable: true });

            reconnectDelay = 2000;
            console.log("✅ Connected to RabbitMQ in Restaurant Service");

            await startPayment();

            connection.on("error", (err) => {
                  console.error("RabbitMQ connection error in Restaurant Service:", err.message);
                  scheduleReconnect();
            });
            connection.on("close", () => {
                  console.warn("RabbitMQ connection closed in Restaurant Service — reconnecting...");
                  scheduleReconnect();
            });
      } catch (error) {
            console.error("Error while connecting to RabbitMQ in Restaurant Service:", error);
            scheduleReconnect();
      }
};

const scheduleReconnect = () => {
      channel = null;
      connection = null;
      console.log(`Reconnecting to RabbitMQ (Restaurant) in ${reconnectDelay / 1000}s...`);
      setTimeout(() => {
            reconnectDelay = Math.min(reconnectDelay * 2, 30000);
            connectRabbitMQ();
      }, reconnectDelay);
};
