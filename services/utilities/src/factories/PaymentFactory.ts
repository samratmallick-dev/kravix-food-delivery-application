import { Payment } from "../domain/entities/Payment.js";

export class PaymentFactory {
  static create(orderId: string, amount: number, currency: string, provider: "stripe" | "razorpay"): Payment {
    return new Payment(
      "",
      orderId,
      amount,
      currency,
      "pending",
      provider
    );
  }
}
