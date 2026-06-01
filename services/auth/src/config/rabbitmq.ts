import amqp from "amqplib";

let channel: amqp.Channel;
let connection: amqp.ChannelModel;

export const connectRabbitMQ = async () => {
      try {
            connection = await amqp.connect(process.env.RABITMQ_URL!);
            channel = await connection.createChannel();

            channel.prefetch(1);

            await channel.assertQueue(process.env.AUTH_EVENT_QUEUE!, { durable: true });
            await channel.assertQueue(process.env.EMAIL_QUEUE!, { durable: true });

            console.log("✅ Connected to RabbitMQ in Auth Service");

            connection.on("error", (err) => {
                  console.error("RabbitMQ connection error in Auth Service:", err.message);
                  process.exit(1);
            });
            connection.on("close", () => {
                  console.error("RabbitMQ connection closed in Auth Service — restarting");
                  process.exit(1);
            });

      } catch (error: unknown) {
            console.error("Error while connecting to RabbitMQ in Auth Service:", error);
            throw new Error(`RabbitMQ connection failed in Auth Service: ${error}`);
      }
};

export const getRabbitMQChannel = (): amqp.Channel => {
      if (!channel) {
            throw new Error("RabbitMQ channel is not initialized in Auth Service");
      }
      return channel;
};
