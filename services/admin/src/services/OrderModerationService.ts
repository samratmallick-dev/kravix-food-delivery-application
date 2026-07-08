import { IOrderModerationService } from "../interfaces/IOrderModerationService.js";
import { IOrderRepository } from "../interfaces/IOrderRepository.js";
import { IAdminEventPublisher } from "../interfaces/IAdminEventPublisher.js";
import { Order } from "../domain/entities/Order.js";
import { NotFoundError, ValidationError } from "../utils/errors.js";

export class OrderModerationService implements IOrderModerationService {
  constructor(
    private orderRepository: IOrderRepository,
    private eventPublisher: IAdminEventPublisher
  ) {}

  async getAllOrders(page: number, limit: number, status?: string): Promise<{ orders: Order[]; total: number }> {
    const filter: Record<string, any> = {};
    if (status) {
      filter["status"] = status;
    }

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.orderRepository.find(filter, skip, limit),
      this.orderRepository.count(filter)
    ]);

    return { orders, total };
  }

  async getOrderById(id: string): Promise<Order> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundError("Order not found");
    }
    return order;
  }

  async cancelOrder(id: string): Promise<Order> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundError("Order not found");
    }

    if (order.status === "cancelled") {
      throw new ValidationError("Order is already cancelled");
    }

    order.cancel();
    const updated = await this.orderRepository.update(order);

    const riderId = (order as any).riderId || null;
    await this.eventPublisher.publishOrderCancelled(updated.id, updated.userId, updated.restaurantId, riderId);

    return updated;
  }
}
