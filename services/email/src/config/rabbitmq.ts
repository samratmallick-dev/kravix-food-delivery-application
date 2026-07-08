import amqp from "amqplib";
import { EmailWorker } from "../workers/email.worker.js";
import { emailService } from "../services/index.js";

let channel: amqp.Channel | null = null;
let connection: amqp.ChannelModel | null = null;
let reconnectDelay = 2000;

export const getRabbitMQChannel = (): amqp.Channel => {
  if (!channel) {
    throw new Error("[Email Service] RabbitMQ channel not initialized");
  }
  return channel;
};

export const getRabbitMQConnection = (): amqp.ChannelModel | null => {
  return connection;
};

export const connectRabbitMQ = async (): Promise<void> => {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL!);
    channel = await connection.createChannel();
    channel.prefetch(1);

    await channel.assertQueue(process.env.EMAIL_QUEUE!, { durable: true });
    console.log("✅ [Email Service] Connected to RabbitMQ");

    const emailWorker = new EmailWorker(channel, process.env.EMAIL_QUEUE!, emailService);
    await emailWorker.start();

    reconnectDelay = 2000;

    connection.on("error", (err) => {
      console.error("[Email Service] RabbitMQ connection error:", err.message);
      scheduleReconnect();
    });
    connection.on("close", () => {
      console.warn("[Email Service] RabbitMQ connection closed — reconnecting...");
      scheduleReconnect();
    });
  } catch (error) {
    console.error("Error while connecting to RabbitMQ in Email Service:", error);
    scheduleReconnect();
  }
};

const scheduleReconnect = () => {
  channel = null;
  connection = null;
  console.log(`Reconnecting to RabbitMQ (Email) in ${reconnectDelay / 1000}s...`);
  setTimeout(() => {
    reconnectDelay = Math.min(reconnectDelay * 2, 30000);
    connectRabbitMQ();
  }, reconnectDelay);
};