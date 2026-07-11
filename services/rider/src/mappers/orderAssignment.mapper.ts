import { OrderAssignmentAggregate } from "../domain/aggregates/OrderAssignmentAggregate.js";

export class OrderAssignmentMapper {
  static toDomain(raw: any): OrderAssignmentAggregate {
    return new OrderAssignmentAggregate(
      raw._id.toString(),
      raw.orderId,
      raw.riderId,
      raw.restaurantId,
      raw.restaurantName,
      raw.restaurantAddress || null,
      raw.customerName,
      raw.customerPhone || null,
      raw.deliveryAddress || null,
      raw.status || "assigned",
      raw.acceptedAt || null,
      raw.pickedAt || null,
      raw.deliveredAt || null,
      raw.cancelledAt || null,
      raw.distance ?? 0,
      raw.deliveryFee ?? 0,
      raw.tip ?? 0,
      raw.etaMinutes ?? 0,
      raw.routePolyline || null,
      raw.reassignmentCount ?? 0,
      raw.timelineEvents || [],
      raw.createdAt,
      raw.updatedAt
    );
  }

  static toPersistence(domain: OrderAssignmentAggregate): any {
    return {
      orderId: domain.orderId,
      riderId: domain.riderId,
      restaurantId: domain.restaurantId,
      restaurantName: domain.restaurantName,
      restaurantAddress: domain.restaurantAddress,
      customerName: domain.customerName,
      customerPhone: domain.customerPhone,
      deliveryAddress: domain.deliveryAddress,
      status: domain.status,
      acceptedAt: domain.acceptedAt,
      pickedAt: domain.pickedAt,
      deliveredAt: domain.deliveredAt,
      cancelledAt: domain.cancelledAt,
      distance: domain.distance,
      deliveryFee: domain.deliveryFee,
      tip: domain.tip,
      etaMinutes: domain.etaMinutes,
      routePolyline: domain.routePolyline,
      reassignmentCount: domain.reassignmentCount,
      timelineEvents: domain.timelineEvents
    };
  }

  static toDto(domain: OrderAssignmentAggregate): any {
    return {
      id: domain.id,
      orderId: domain.orderId,
      riderId: domain.riderId,
      restaurantId: domain.restaurantId,
      restaurantName: domain.restaurantName,
      restaurantAddress: domain.restaurantAddress,
      customerName: domain.customerName,
      customerPhone: domain.customerPhone,
      deliveryAddress: domain.deliveryAddress,
      status: domain.status,
      acceptedAt: domain.acceptedAt,
      pickedAt: domain.pickedAt,
      deliveredAt: domain.deliveredAt,
      cancelledAt: domain.cancelledAt,
      distance: domain.distance,
      deliveryFee: domain.deliveryFee,
      tip: domain.tip,
      etaMinutes: domain.etaMinutes,
      routePolyline: domain.routePolyline,
      reassignmentCount: domain.reassignmentCount,
      timelineEvents: domain.timelineEvents,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt
    };
  }
}
