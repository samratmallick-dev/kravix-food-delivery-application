import amqp from "amqplib";

let channel: amqp.Channel;
let connection: amqp.ChannelModel;

export const connectRabbitMQ = async (): Promise<amqp.Channel> => {
  if (channel) return channel;

  const connect = async (delay = 1000): Promise<void> => {
    try {
      connection = await amqp.connect(process.env.RABBITMQ_URL!);
      channel = await connection.createChannel();
      channel.prefetch(1);
      await channel.assertQueue(process.env.EMAIL_QUEUE!, { durable: true });
      console.log("✅ [Email Service] Connected to RabbitMQ");

      connection.on("error", (err) => {
        console.error(
          "[Email Service] RabbitMQ connection error:",
          err.message,
        );
        const nextDelay = Math.min(delay * 2, 30000);
        setTimeout(() => connect(nextDelay), nextDelay);
      });
      connection.on("close", () => {
        console.warn(
          "[Email Service] RabbitMQ connection closed — reconnecting...",
        );
        const nextDelay = Math.min(delay * 2, 30000);
        setTimeout(() => connect(nextDelay), nextDelay);
      });
    } catch (err) {
      console.error(
        `[Email Service] RabbitMQ connect failed, retrying in ${delay}ms:`,
        err,
      );
      await new Promise((r) => setTimeout(r, delay));
      return connect(Math.min(delay * 2, 30000));
    }
  };

  await connect();
  return channel;
};

export const getRabbitMQChannel = (): amqp.Channel => {
  if (!channel)
    throw new Error("[Email Service] RabbitMQ channel not initialized");
  return channel;
};