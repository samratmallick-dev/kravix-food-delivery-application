import { ValidationError } from "../../utils/errors.js";

export class Payment {
  constructor(
    public readonly id: string,
    public readonly orderId: string,
    public readonly amount: number,
    public readonly currency: string,
    public status: "pending" | "completed" | "failed",
    public readonly provider: "stripe" | "razorpay",
    public providerPaymentId?: string
  ) {
    if (amount <= 0) {
      throw new ValidationError("Payment amount must be greater than zero");
    }
  }

  complete(providerPaymentId: string): void {
    this.status = "completed";
    this.providerPaymentId = providerPaymentId;
  }

  fail(): void {
    this.status = "failed";
  }
}
