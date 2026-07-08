import { IPaymentRepository } from "../interfaces/IPaymentRepository.js";
import { Payment } from "../domain/entities/Payment.js";

export class InMemoryPaymentRepository implements IPaymentRepository {
  private readonly payments = new Map<string, Payment>();

  async save(payment: Payment): Promise<Payment> {
    const id = payment.id || Math.random().toString(36).substring(2, 9);
    const saved = new Payment(
      id,
      payment.orderId,
      payment.amount,
      payment.currency,
      payment.status,
      payment.provider,
      payment.providerPaymentId
    );
    this.payments.set(id, saved);
    return saved;
  }

  async findById(id: string): Promise<Payment | null> {
    const p = this.payments.get(id);
    return p ? p : null;
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    for (const p of this.payments.values()) {
      if (p.orderId === orderId) {
        return p;
      }
    }
    return null;
  }
}
