import { getRabbitMQChannel } from "../../config/rabbitmq.js";

export const publishEvent = async (
  type: string,
  data: any,
  queueName: string = process.env.RIDER_QUEUE!
): Promise<void> => {
  try {
    const channel = getRabbitMQChannel();
    if (!channel) {
      throw new Error("RabbitMQ channel is not initialized in Rider Service");
    }
    const message = JSON.stringify({ type, data, timestamp: new Date() });
    const sent = channel.sendToQueue(queueName, Buffer.from(message), {
      persistent: true,
    });
    if (!sent) {
      throw new Error(`Channel buffer full, failed to send to queue ${queueName}`);
    }
    console.log(`[RabbitMQ Publish] Event "${type}" published to queue "${queueName}"`);
  } catch (error: any) {
    console.error(`[RabbitMQ Publish ERROR] Failed to publish event "${type}":`, error.message);
  }
};
