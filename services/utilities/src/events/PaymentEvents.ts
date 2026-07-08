import { getRabbitMQChannel } from "../config/rabbitmq.js";

export class PaymentEvents {
  async publishPaymentSuccess(payload: { orderId: string; paymentId: string; provider: "razorpay" | "stripe" }): Promise<void> {
    const channel = getRabbitMQChannel();
    channel.sendToQueue(
      process.env.PAYMENT_QUEUE || "payment_event",
      Buffer.from(
        JSON.stringify({
          type: "PAYMENT_SUCCESS",
          data: payload
        })
      ),
      { persistent: true }
    );
  }
}
