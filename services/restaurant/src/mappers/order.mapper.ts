import { Order, OrderItem } from "../domain/entities/Order.js";

export class OrderMapper {
  static toDomain(raw: any): Order {
    const items: OrderItem[] = (raw.items || []).map((i: any) => ({
      itemId: i.itemId?.toString() || i.itemId,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      total: i.total ?? (i.price * i.quantity)
    }));

    return new Order(
      raw._id.toString(),
      raw.userId,
      raw.restaurantId,
      raw.restaurantName,
      items,
      raw.subtotal || 0,
      raw.deliveryFee || 0,
      raw.platformFee || 0,
      raw.totalGST || 0,
      raw.totalAmount || 0,
      raw.riderAmount || 0,
      raw.addressId,
      {
        formatedAddress: raw.deliveryAddress?.formatedAddress || "",
        mobile: raw.deliveryAddress?.mobile || 0,
        customerName: raw.deliveryAddress?.customerName || "",
        latitude: raw.deliveryAddress?.latitude || 0,
        longitude: raw.deliveryAddress?.longitude || 0
      },
      raw.status || "placed",
      raw.paymentMethod || "cod",
      raw.paymentStatus || "pending",
      raw.riderId ? raw.riderId.toString() : null,
      raw.riderName || null,
      raw.riderPhoneNumber || null,
      raw.distance || 0,
      raw.createdAt
    );
  }

  static toPersistence(domain: Order): any {
    return {
      userId: domain.userId,
      restaurantId: domain.restaurantId,
      restaurantName: domain.restaurantName,
      items: domain.items.map((i) => ({
        itemId: i.itemId,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        total: i.total
      })),
      subtotal: domain.subtotal,
      deliveryFee: domain.deliveryFee,
      platformFee: domain.platformFee,
      totalGST: domain.totalGST,
      totalAmount: domain.totalAmount,
      riderAmount: domain.riderAmount,
      addressId: domain.addressId,
      deliveryAddress: domain.deliveryAddress,
      status: domain.status,
      paymentMethod: domain.paymentMethod,
      paymentStatus: domain.paymentStatus,
      riderId: domain.riderId,
      riderName: domain.riderName,
      riderPhoneNumber: domain.riderPhoneNumber,
      distance: domain.distance,
      createdAt: domain.createdAt
    };
  }
}
