import amqp from "amqplib";
import { startAdminOrderConsumer } from "./adminOrderConsumer.js";

let channel: amqp.Channel | null = null;
let connection: amqp.ChannelModel | null = null;
let reconnectDelay = 2000;

export const getRabbitMQChannel = (): amqp.Channel => {
      if (!channel) throw new Error("RabbitMQ channel is not initialized in Admin Service");
      return channel;
};

export const publishAdminEvent = (type: string, data: Record<string, unknown>): void => {
      if (!channel) {
            console.warn(`RabbitMQ unavailable — dropped admin event "${type}"`);
            return;
      }
      const sent = channel.sendToQueue(
            process.env.ADMIN_EVENT_QUEUE!,
            Buffer.from(JSON.stringify({ type, data })),
            { persistent: true },
      );
      if (!sent) console.error(`RabbitMQ buffer full — failed to publish admin event "${type}"`);
      else console.log(`📤 Published admin event "${type}"`);
};

export const publishToQueue = (queueName: string, type: string, data: Record<string, unknown>): void => {
      if (!channel) {
            console.warn(`RabbitMQ unavailable — dropped event "${type}" for queue "${queueName}"`);
            return;
      }
      const sent = channel.sendToQueue(
            queueName,
            Buffer.from(JSON.stringify({ type, data })),
            { persistent: true },
      );
      if (!sent) console.error(`RabbitMQ buffer full — failed to publish event "${type}" to queue "${queueName}"`);
      else console.log(`📤 Published event "${type}" to queue "${queueName}"`);
};

export const connectRabbitMQ = async (): Promise<void> => {
      try {
            connection = await amqp.connect(process.env.RABITMQ_URL!);
            channel = await connection.createChannel();
            channel.prefetch(1);

            await channel.assertQueue(process.env.ADMIN_EVENT_QUEUE!, { durable: true });
            await channel.assertQueue(process.env.RESTAURANT_ADMIN_EVENT_QUEUE!, { durable: true });

            reconnectDelay = 2000;
            console.log("✅ Connected to RabbitMQ in Admin Service");

            await startAdminOrderConsumer();

            connection.on("error", (err) => {
                  console.warn("⚠️ RabbitMQ connection error in Admin Service:", err.message);
                  scheduleReconnect();
            });
            connection.on("close", () => {
                  console.warn("⚠️ RabbitMQ connection closed in Admin Service — reconnecting...");
                  scheduleReconnect();
            });
      } catch (error) {
            console.error("Error while connecting to RabbitMQ in Admin Service:", error);
            scheduleReconnect();
      }
};

const scheduleReconnect = () => {
      channel = null;
      connection = null;
      console.log(`Reconnecting to RabbitMQ (Admin) in ${reconnectDelay / 1000}s...`);
      setTimeout(() => {
            reconnectDelay = Math.min(reconnectDelay * 2, 30000);
            connectRabbitMQ();
      }, reconnectDelay);
};
