export interface IRazorpayClient {
  createOrder(orderId: string, amount: number, currency: string): Promise<any>;
  verifySignature(orderId: string, paymentId: string, signature: string): boolean;
}
