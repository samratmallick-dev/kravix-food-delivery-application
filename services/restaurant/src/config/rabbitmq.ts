import amqp from "amqplib";

let channel: amqp.Channel;
let connection: amqp.ChannelModel;

export const connectRabbitMQ = async () => {
      try {
            connection = await amqp.connect(process.env.RABITMQ_URL!);
            channel = await connection.createChannel();

            channel.prefetch(1);

            await channel.assertQueue(process.env.PAYMENT_QUEUE!, { durable: true });
            await channel.assertQueue(process.env.RIDER_QUEUE!, { durable: true });
            await channel.assertQueue(process.env.ORDER_READY_QUEUE!, {
                  durable: true,
            });
            await channel.assertQueue(process.env.ADMIN_EVENT_QUEUE!, {
                  durable: true,
            });

            console.log("✅ Connected to RabbitMQ in Restaurant Service");

            connection.on("error", (err) => {
                  console.error(
                        "RabbitMQ connection error in Restaurant Service:",
                        err.message,
                  );
                  process.exit(1);
            });
            connection.on("close", () => {
                  console.error(
                        "RabbitMQ connection closed in Restaurant Service — restarting",
                  );
                  process.exit(1);
            });
      } catch (error: unknown) {
            console.error(
                  "Error while connecting to RabbitMQ in Restaurant Service:",
                  error,
            );
            throw new Error(
                  `RabbitMQ connection failed in Restaurant Service: ${error}`,
            );
      }
};

export const getRabbitMQChannel = (): amqp.Channel => {
      if (!channel) {
            throw new Error(
                  "RabbitMQ channel is not initialized in Restaurant Service",
            );
      }
      return channel;
};
