import amqp from "amqplib";

let channel: amqp.Channel | null = null;
let connection: amqp.ChannelModel | null = null;
let reconnectDelay = 2000;
let isReconnecting = false;

const log = (level: "info" | "warn" | "error", message: string, extra?: object) => {
  const entry = {
    timestamp: new Date().toISOString(),
    service: "utilities",
    level,
    component: "rabbitmq",
    message,
    ...extra
  };
  if (level === "error") console.error(JSON.stringify(entry));
  else if (level === "warn") console.warn(JSON.stringify(entry));
  else console.log(JSON.stringify(entry));
};

export const getRabbitMQChannel = (): amqp.Channel => {
  if (!channel) {
    throw new Error("RabbitMQ channel is not initialized in Utilities Service");
  }
  return channel;
};

export const getRabbitMQConnection = (): amqp.ChannelModel | null => {
  return connection;
};

export const connectRabbitMQ = async (): Promise<void> => {
  try {
    isReconnecting = false;
    connection = await amqp.connect(process.env.RABITMQ_URL!);
    channel = await connection.createChannel();

    await channel.assertQueue(process.env.PAYMENT_QUEUE!, { durable: true });

    reconnectDelay = 2000;
    log("info", "Connected to RabbitMQ in Utilities Service");

    connection.on("error", (err) => {
      log("error", "RabbitMQ connection error in Utilities Service", { error: err.message });
      scheduleReconnect();
    });
    connection.on("close", () => {
      log("warn", "RabbitMQ connection closed in Utilities Service — reconnecting...");
      scheduleReconnect();
    });
  } catch (error: any) {
    log("error", "Error while connecting to RabbitMQ in Utilities Service", { error: error?.message });
    scheduleReconnect();
  }
};

const scheduleReconnect = () => {
  if (isReconnecting) return;
  isReconnecting = true;

  channel = null;
  connection = null;
  log("info", `Reconnecting to RabbitMQ (Utilities) in ${reconnectDelay / 1000}s...`, {
    nextRetryMs: reconnectDelay
  });
  setTimeout(() => {
    reconnectDelay = Math.min(reconnectDelay * 2, 30000);
    connectRabbitMQ();
  }, reconnectDelay);
};
