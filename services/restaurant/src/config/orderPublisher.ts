import { getRabbitMQChannel } from "./rabbitmq.js";

export const publishEvent = async (
      type: string,
      data: any,
      queueName: string = process.env.ORDER_READY_QUEUE!,
): Promise<void> => {
      const channel = getRabbitMQChannel();

      const message = JSON.stringify({ type, data });
      const sent = channel.sendToQueue(queueName, Buffer.from(message), {
            persistent: true,
      });

      if (!sent) {
            throw new Error(
                  `RabbitMQ channel buffer full — failed to publish event "${type}" for data: ${message} to queue ${queueName}`,
            );
      }
};
