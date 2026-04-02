import { getRabbitMQChannel } from "./rabbitmq.js";

export const publishEvent = async (type: string, data: any): Promise<void> => {
      const channel = getRabbitMQChannel();

      const message = JSON.stringify({ type, data });
      const sent = channel.sendToQueue(
            process.env.ORDER_READY_QUEUE!,
            Buffer.from(message),
            { persistent: true }   
      );

      if (!sent) {
            throw new Error(
                  `RabbitMQ channel buffer full — failed to publish event "${type}" for data: ${message}`
            );
      }

      console.log(`📤 Published event "${type}" to queue "${process.env.ORDER_READY_QUEUE}"`);
};