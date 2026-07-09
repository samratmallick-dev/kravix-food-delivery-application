import { Order } from "../domain/entities/Order.js";

export class OrderMapper {
  static toDomain(raw: any): Order {
    return new Order(
      raw._id.toString(),
      raw.userId,
      raw.restaurantId,
      raw.restaurantName,
      raw.status,
      raw.paymentMethod,
      raw.paymentStatus,
      raw.totalAmount,
      raw.createdAt ? new Date(raw.createdAt) : undefined,
      raw.deliveryAddress,
      raw.items,
      raw.subtotal,
      raw.deliveryFee,
      raw.platformFee,
      raw.riderName
    );
  }

  static toPersistence(domain: Order): any {
    return {
      userId: domain.userId,
      restaurantId: domain.restaurantId,
      restaurantName: domain.restaurantName,
      status: domain.status,
      paymentMethod: domain.paymentMethod,
      paymentStatus: domain.paymentStatus,
      totalAmount: domain.totalAmount
    };
  }
}
