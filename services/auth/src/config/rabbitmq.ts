import amqp from "amqplib";

let channel: amqp.Channel | null = null;
let connection: amqp.ChannelModel | null = null;
let reconnectDelay = 2000;

export const getRabbitMQChannel = (): amqp.Channel => {
      if (!channel) throw new Error("RabbitMQ channel is not initialized in Auth Service");
      return channel;
};

export const connectRabbitMQ = async (): Promise<void> => {
      try {
            connection = await amqp.connect(process.env.RABITMQ_URL!);
            channel = await connection.createChannel();
            channel.prefetch(1);

            await channel.assertQueue(process.env.AUTH_EVENT_QUEUE!, { durable: true });
            await channel.assertQueue(process.env.EMAIL_QUEUE!, { durable: true });

            reconnectDelay = 2000;
            console.log("✅ Connected to RabbitMQ in Auth Service");

            connection.on("error", (err) => {
                  console.error("RabbitMQ connection error in Auth Service:", err.message);
                  scheduleReconnect();
            });
            connection.on("close", () => {
                  console.warn("RabbitMQ connection closed in Auth Service — reconnecting...");
                  scheduleReconnect();
            });
      } catch (error) {
            console.error("Error while connecting to RabbitMQ in Auth Service:", error);
            scheduleReconnect();
      }
};

const scheduleReconnect = () => {
      channel = null;
      connection = null;
      console.log(`Reconnecting to RabbitMQ (Auth) in ${reconnectDelay / 1000}s...`);
      setTimeout(() => {
            reconnectDelay = Math.min(reconnectDelay * 2, 30000);
            connectRabbitMQ();
      }, reconnectDelay);
};
