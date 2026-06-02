import { getRabbitMQChannel } from "./rabitmq.js";

export const publishPaymentSuccess = async (payload: {
      orderId: string;
      paymentId: string;
      provider: "razorpay" | "stripe";
}) => {
      const channel = getRabbitMQChannel();

      channel.sendToQueue(
            process.env.PAYMENT_QUEUE!,
            Buffer.from(
                  JSON.stringify({
                        type: "PAYMENT_SUCCESS",
                        data: payload,
                  }),
            ),
            {
                  persistent: true,
            },
      );
};
