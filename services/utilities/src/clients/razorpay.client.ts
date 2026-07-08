import Razorpay from "razorpay";
import crypto from "crypto";
import { IRazorpayClient } from "../interfaces/IRazorpayClient.js";
import { CircuitBreaker } from "../utils/circuitBreaker.js";

export class RazorpayClient implements IRazorpayClient {
  private readonly razorpayInstance: Razorpay;
  private readonly breaker: CircuitBreaker;

  constructor() {
    this.razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_API_KEY || "",
      key_secret: process.env.RAZORPAY_API_KEY_SECRET || ""
    });
    this.breaker = new CircuitBreaker("RazorpayAPI");
  }

  async createOrder(orderId: string, amount: number, currency: string): Promise<any> {
    return this.breaker.execute(async () => {
      return await this.razorpayInstance.orders.create({
        amount,
        currency,
        receipt: orderId
      });
    });
  }

  verifySignature(orderId: string, paymentId: string, signature: string): boolean {
    try {
      const body = `${orderId}|${paymentId}`;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_API_KEY_SECRET || "")
        .update(body)
        .digest("hex");
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "hex"),
        Buffer.from(signature, "hex")
      );
    } catch (err) {
      return false;
    }
  }
}
