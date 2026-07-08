import Stripe from "stripe";
import { IStripeClient } from "../interfaces/IStripeClient.js";
import { CircuitBreaker } from "../utils/circuitBreaker.js";

export class StripeClient implements IStripeClient {
  private readonly stripeInstance: Stripe;
  private readonly breaker: CircuitBreaker;

  constructor() {
    this.stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY || "");
    this.breaker = new CircuitBreaker("StripeAPI");
  }

  async createCheckoutSession(orderId: string, amount: number, successUrl: string, cancelUrl: string): Promise<Stripe.Checkout.Session> {
    return this.breaker.execute(async () => {
      return await this.stripeInstance.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "inr",
              product_data: {
                name: "Kravix - Online Food order"
              },
              unit_amount: amount
            },
            quantity: 1
          }
        ],
        metadata: {
          orderId
        },
        success_url: successUrl,
        cancel_url: cancelUrl
      });
    });
  }

  async retrieveCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
    return this.breaker.execute(async () => {
      return await this.stripeInstance.checkout.sessions.retrieve(sessionId);
    });
  }
}
