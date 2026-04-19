import amqp from "amqplib";

let channel: amqp.Channel;
let connection: amqp.ChannelModel;

export const connectRabbitMQ = async () => {
      try {
            connection = await amqp.connect(process.env.RABITMQ_URL!);
            channel = await connection.createChannel();

            channel.prefetch(1);

            await channel.assertQueue(process.env.ADMIN_EVENT_QUEUE!, { durable: true });

            console.log("✅ Connected to RabbitMQ in Admin Service");

            connection.on("error", (err) => {
                  console.error("RabbitMQ connection error in Admin Service:", err.message);
                  process.exit(1);
            });
            connection.on("close", () => {
                  console.error("RabbitMQ connection closed in Admin Service — restarting");
                  process.exit(1);
            });
      } catch (error) {
            console.error("Error while connecting to RabbitMQ in Admin Service:", error);
            throw new Error(`RabbitMQ connection failed in Admin Service: ${error}`);
      }
};

export const getRabbitMQChannel = (): amqp.Channel => {
      if (!channel) throw new Error("RabbitMQ channel is not initialized in Admin Service");
      return channel;
};

export const publishAdminEvent = (type: string, data: Record<string, unknown>): void => {
      const ch = getRabbitMQChannel();
      const message = JSON.stringify({ type, data });
      const sent = ch.sendToQueue(
            process.env.ADMIN_EVENT_QUEUE!,
            Buffer.from(message),
            { persistent: true }
      );
      if (!sent) {
            console.error(`RabbitMQ buffer full — failed to publish admin event "${type}"`);
      } else {
            console.log(`📤 Published admin event "${type}"`);
      }
};
