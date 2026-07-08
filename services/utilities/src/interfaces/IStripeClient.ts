import Stripe from "stripe";

export interface IStripeClient {
  createCheckoutSession(orderId: string, amount: number, successUrl: string, cancelUrl: string): Promise<Stripe.Checkout.Session>;
  retrieveCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session>;
}
