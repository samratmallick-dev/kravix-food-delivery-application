import { Payment } from "../domain/entities/Payment.js";

export class PaymentMapper {
  static toDomain(raw: any): Payment {
    return new Payment(
      raw.id,
      raw.orderId,
      raw.amount,
      raw.currency || "inr",
      raw.status,
      raw.provider,
      raw.providerPaymentId
    );
  }

  static toPersistence(domain: Payment): any {
    return {
      id: domain.id,
      orderId: domain.orderId,
      amount: domain.amount,
      currency: domain.currency,
      status: domain.status,
      provider: domain.provider,
      providerPaymentId: domain.providerPaymentId
    };
  }
}
