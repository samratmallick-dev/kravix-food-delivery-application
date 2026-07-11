import amqp from "amqplib";
import { OrderReadyWorker } from "../workers/orderReady.worker.js";
import { RiderEventWorker } from "../workers/riderEvent.worker.js";
import { riderRepository, riderService } from "../services/index.js";

let channel: amqp.Channel | null = null;
let connection: amqp.ChannelModel | null = null;
let reconnectDelay = 2000;

export const getRabbitMQChannel = (): amqp.Channel => {
  if (!channel) {
    throw new Error("RabbitMQ channel is not initialized in Rider Service");
  }
  return channel;
};

export const getRabbitMQConnection = (): amqp.ChannelModel | null => {
  return connection;
};

export const connectRabbitMQ = async (): Promise<void> => {
  try {
    const conn = await amqp.connect(process.env.RABITMQ_URL!);
    connection = conn;

    const chan = await conn.createChannel();
    channel = chan;

    chan.prefetch(1);

    await chan.assertQueue(process.env.RIDER_QUEUE!, { durable: true });
    await chan.assertQueue(process.env.ORDER_READY_QUEUE!, { durable: true });

    reconnectDelay = 2000;
    console.log("✅ Connected to RabbitMQ in Rider Service");

    const orderReadyWorker = new OrderReadyWorker(chan, process.env.ORDER_READY_QUEUE!, riderRepository);
    await orderReadyWorker.start();

    const riderEventWorker = new RiderEventWorker(chan, process.env.RIDER_QUEUE!, riderService);
    await riderEventWorker.start();

    conn.on("error", (err) => {
      console.error("RabbitMQ connection error in Rider Service:", err.message);
      scheduleReconnect();
    });
    conn.on("close", () => {
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