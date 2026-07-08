import amqp from "amqplib";
import { AdminEventWorker } from "../workers/adminEvent.worker.js";
import { redisCache } from "../services/index.js";

let channel: amqp.Channel | null = null;
let connection: amqp.ChannelModel | null = null;
let reconnectDelay = 2000;

export const getRabbitMQChannel = (): amqp.Channel => {
  if (!channel) {
    throw new Error("RabbitMQ channel is not initialized in Analytics Service");
  }
  return channel;
};

export const getRabbitMQConnection = (): amqp.ChannelModel | null => {
  return connection;
};

export const connectRabbitMQ = async (): Promise<void> => {
  try {
    connection = await amqp.connect(process.env.RABITMQ_URL!);
    channel = await connection.createChannel();
    channel.prefetch(1);

    await channel.assertQueue(process.env.ADMIN_EVENT_QUEUE!, { durable: true });

    reconnectDelay = 2000;
    console.log("✅ Connected to RabbitMQ in Analytics Service");

    const adminWorker = new AdminEventWorker(channel, process.env.ADMIN_EVENT_QUEUE!, redisCache);
    await adminWorker.start();

    connection.on("error", (err) => {
      console.error("RabbitMQ connection error in Analytics Service:", err.message);
      scheduleReconnect();
    });
    connection.on("close", () => {
      console.warn("RabbitMQ connection closed in Analytics Service — reconnecting...");
      scheduleReconnect();
    });
  } catch (error) {
    console.error("Error while connecting to RabbitMQ in Analytics Service:", error);
    scheduleReconnect();
  }
};

const scheduleReconnect = () => {
  channel = null;
  connection = null;
  console.log(`Reconnecting to RabbitMQ (Analytics) in ${reconnectDelay / 1000}s...`);
  setTimeout(() => {
    reconnectDelay = Math.min(reconnectDelay * 2, 30000);
    connectRabbitMQ();
  }, reconnectDelay);
};
