import amqp from "amqplib";

let channel: amqp.Channel;
let connection: amqp.ChannelModel;

export const connectRabbitMQ = async () => {
      try {
            connection = await amqp.connect(process.env.RABITMQ_URL!);
            channel = await connection.createChannel();

            channel.prefetch(1);

            await channel.assertQueue(process.env.RIDER_QUEUE!, { durable: true });
            await channel.assertQueue(process.env.ORDER_READY_QUEUE!, {
                  durable: true,
            });

            console.log("✅ Connected to RabbitMQ in Rider Service");

            connection.on("error", (err) => {
                  console.error("RabbitMQ connection error in Rider Service:", err.message);
                  process.exit(1);
            });
            connection.on("close", () => {
                  console.error("RabbitMQ connection closed in Rider Service — restarting");
                  process.exit(1);
            });
      } catch (error: unknown) {
            console.error(
                  "Error while connecting to RabbitMQ in Rider Service:",
                  error,
            );
            throw new Error(`RabbitMQ connection failed in Rider Service: ${error}`);
      }
};

export const getRabbitMQChannel = (): amqp.Channel => {
      if (!channel) {
            throw new Error("RabbitMQ channel is not initialized in Rider Service");
      }
      return channel;
};