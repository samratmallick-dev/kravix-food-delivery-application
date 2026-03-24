import amqp from "amqplib";

let channel: amqp.Channel;

export const connectRabbitMQ = async () => {
      try {
            const connection = await amqp.connect(process.env.RABITMQ_URL!);
            channel = await connection.createChannel();
            
            await channel.assertQueue(process.env.PAYMENT_QUEUE!, {
                  durable: true,
            });

            console.log("Connected RabitMQ in Utilities Service");
            
      } catch (error: unknown) {
            console.log("Error while connecting to RabbitMQ", error);
            throw new Error(`Error while connecting to RabbitMQ in Utilities Service: ${error}`);
      }
};

export const getRabbitMQChannel = () => {
      if (!channel) {
            throw new Error("RabbitMQ channel is not initialized in Utilities Service");
      }
      return channel;
};