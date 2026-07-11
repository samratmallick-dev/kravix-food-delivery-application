import mongoose from "mongoose";
import { IOrderService } from "../interfaces/IOrderService.js";
import { IOrderRepository } from "../interfaces/IOrderRepository.js";
import { IRestaurantRepository } from "../interfaces/IRestaurantRepository.js";
import { ICartRepository } from "../interfaces/ICartRepository.js";
import { ICouponRepository } from "../interfaces/ICouponRepository.js";
import { IAddressRepository } from "../interfaces/IAddressRepository.js";
import { IMenuItemRepository } from "../interfaces/IMenuItemRepository.js";
import { IRestaurantEventPublisher } from "../interfaces/IRestaurantEventPublisher.js";
import { Order, OrderItem } from "../domain/entities/Order.js";
import { Distance } from "../domain/valueObjects/Distance.js";
import { Cart } from "../domain/entities/Cart.js";
import { PlaceOrderRequestDto } from "../dto/restaurant.dto.js";
import { NotFoundError, ValidationError, AuthorizationError } from "../utils/errors.js";

const DELIVERY_PROXIMITY_METERS = 100;
const RIDER_STATUS_TRANSITIONS: Record<string, string> = {
  rider_assigned: "picked_up",
  ready_for_rider: "picked_up",
  picked_up: "out_for_delivery",
  out_for_delivery: "reached_delivery_location",
  reached_delivery_location: "delivered"
};

const haversineMeters = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export class OrderService implements IOrderService {
  constructor(
    private orderRepository: IOrderRepository,
    private restaurantRepository: IRestaurantRepository,
    private cartRepository: ICartRepository,
    private couponRepository: ICouponRepository,
    private addressRepository: IAddressRepository,
    private menuItemRepository: IMenuItemRepository,
    private eventPublisher: IRestaurantEventPublisher
  ) {}

  async createOrder(userId: string, userName: string, dto: PlaceOrderRequestDto): Promise<any> {
    const address = await this.addressRepository.findByIdAndUser(dto.addressId, userId);
    if (!address) {
      throw new NotFoundError("Address not found");
    }

    const itemsInput = dto.items;
    const itemIds = itemsInput.map((i: any) => i.itemId as string);
    const menuItems = await Promise.all(itemIds.map((id: string) => this.menuItemRepository.findById(id)));
    const menuItemMap = new Map(menuItems.filter(Boolean).map((m: any) => [m!.id, m!]));

    if (menuItems.some((m: any) => !m)) {
      throw new NotFoundError("Some items not found in menu");
    }

    const restaurantId = menuItems[0]!.restaurantId;
    if (menuItems.some((m: any) => m!.restaurantId !== restaurantId)) {
      throw new ValidationError("All items must be from the same restaurant");
    }

    const restaurant = await this.restaurantRepository.findById(restaurantId);
    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }
    restaurant.checkAvailableForOrdering();

    const orderItems: OrderItem[] = itemsInput.map((item: any) => {
      const menu = menuItemMap.get(item.itemId)!;
      if (!menu.isAvailable) {
        throw new ValidationError(`Item "${menu.name}" is not available`);
      }
      return {
        itemId: item.itemId,
        name: menu.name,
        price: menu.price,
        quantity: item.quantity,
        total: menu.price * item.quantity
      };
    });

    const dist = Distance.calculate(address.coordinates, restaurant.autoLocation.coordinates);

    let coupon = undefined;
    let couponUsageCount = 0;
    if (dto.couponCode && dto.couponCode.trim()) {
      const foundCoupon = await this.couponRepository.findByCode(dto.couponCode);
      if (foundCoupon) {
        coupon = foundCoupon;
        couponUsageCount = await this.couponRepository.getUsageCount(foundCoupon.id, userId);
      }
    }

    const order = new Order(
      "",
      userId,
      restaurantId,
      restaurant.name,
      orderItems,
      0,
      0,
      7,
      0,
      0,
      0,
      dto.addressId,
      {
        formatedAddress: address.formatedAddress,
        mobile: address.mobile,
        customerName: userName,
        latitude: address.coordinates[1],
        longitude: address.coordinates[0]
      },
      "placed",
      dto.paymentMethod,
      dto.paymentMethod === "cod" ? "cod_pending" : "pending"
    );

    order.calculateTotals(dist.valueInKm, coupon, couponUsageCount);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const created = await this.orderRepository.create(order, session);
      await this.cartRepository.clear(userId);

      await session.commitTransaction();
      session.endSession();

      if (dto.paymentMethod === "cod") {
        await this.eventPublisher.publishOrderNew(created.id, restaurantId);
      }

      return {
        orderId: created.id,
        totalAmount: created.totalAmount,
        paymentMethod: dto.paymentMethod
      };
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  async getMyOrders(userId: string): Promise<Order[]> {
    return await this.orderRepository.findByUser(userId);
  }

  async getOrderById(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError("Order not found");
    }
    return order;
  }

  async cancelMyOrder(userId: string, orderId: string): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError("Order not found");
    }
    if (order.userId !== userId) {
      throw new AuthorizationError("Access denied");
    }

    const ALLOWED_CANCELLATION_STATUSES = ["placed", "accepted"];
    if (!ALLOWED_CANCELLATION_STATUSES.includes(order.status)) {
      throw new ValidationError(`Cannot cancel order in status: ${order.status}`);
    }

    order.updateStatus("cancelled");
    const updated = await this.orderRepository.update(order);

    const riderId = (updated as any).riderId || null;
    await this.eventPublisher.publishOrderUpdate(updated.id, updated.userId, updated.restaurantId, "cancelled", riderId);

    return updated;
  }

  async reorderItems(userId: string, orderId: string): Promise<any> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError("Order not found");
    }
    if (order.userId !== userId) {
      throw new AuthorizationError("Access denied");
    }
    if (order.status !== "delivered") {
      throw new ValidationError("Only delivered orders can be reordered");
    }

    const restaurant = await this.restaurantRepository.findById(order.restaurantId);
    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }
    if (!restaurant.isOpen) {
      throw new ValidationError("Restaurant is currently closed");
    }

    const itemIds = order.items.map((i) => i.itemId);
    const menuItems = await Promise.all(itemIds.map((id) => this.menuItemRepository.findById(id)));
    const availableItemMap = new Map(menuItems.filter((m) => m && m.isAvailable && m.restaurantId === order.restaurantId).map((m) => [m!.id, m!]));

    const unavailableNames = order.items
      .filter((i) => !availableItemMap.has(i.itemId))
      .map((i) => i.name);

    const availableItems = order.items.filter((i) => availableItemMap.has(i.itemId));
    if (availableItems.length === 0) {
      throw new ValidationError("None of the items from this order are currently available.");
    }

    await this.cartRepository.clear(userId);

    for (const item of availableItems) {
      const newItem = new Cart("", userId, item.itemId, order.restaurantId, item.quantity);
      await this.cartRepository.create(newItem);
    }

    return {
      cartCount: availableItems.reduce((sum, i) => sum + i.quantity, 0),
      unavailableItems: unavailableNames
    };
  }

  async assignRiderToOrder(
    orderId: string,
    riderId: string,
    riderUserId: string,
    riderName: string,
    riderPhoneNumber: number
  ): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError("Order not found");
    }
    if (order.riderId) {
      throw new ValidationError("Rider already assigned to this order");
    }

    order.riderId = riderId;
    order.riderName = riderName;
    order.riderPhoneNumber = riderPhoneNumber;
    order.updateStatus("rider_assigned");

    const updated = await this.orderRepository.update(order);

    await this.eventPublisher.publishOrderUpdate(updated.id, updated.userId, updated.restaurantId, "rider_assigned", riderUserId);

    return updated;
  }

  async getCurrentOrdersForRiders(riderId: string): Promise<Order> {
    const order = await this.orderRepository.findActiveOrderForRider(riderId);
    if (!order) {
      throw new NotFoundError("No current order found for this rider");
    }
    return order;
  }

  async updateOrderStatusByRider(orderId: string, riderId: string, riderLat?: number, riderLng?: number): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError("Order not found");
    }
    if (order.riderId !== riderId) {
      throw new AuthorizationError("Access denied. You are not assigned to this order.");
    }

    const nextStatus = RIDER_STATUS_TRANSITIONS[order.status];
    if (!nextStatus) {
      throw new ValidationError(`Cannot update order with status: ${order.status}`);
    }

    if (order.status === "reached_delivery_location") {
      if (riderLat === undefined || riderLng === undefined) {
        throw new ValidationError("Rider location is required to confirm delivery");
      }
      const distanceMeters = haversineMeters(
        Number(riderLat),
        Number(riderLng),
        order.deliveryAddress.latitude,
        order.deliveryAddress.longitude
      );
      if (distanceMeters > DELIVERY_PROXIMITY_METERS) {
        throw new AuthorizationError(
          `You must be within ${DELIVERY_PROXIMITY_METERS}m of the delivery address. Currently ${Math.round(distanceMeters)}m away.`
        );
      }
    }

    order.updateStatus(nextStatus);
    const updated = await this.orderRepository.update(order);

    await this.eventPublisher.publishOrderUpdate(updated.id, updated.userId, updated.restaurantId, updated.status, null);

    return updated;
  }

  async getDeliveredOrdersByRider(riderId: string): Promise<Order[]> {
    return await this.orderRepository.findDeliveredByRider(riderId);
  }

  async setOrderOtp(orderId: string, otp: number): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError("Order not found");
    }
    (order as any).deliveryOtp = otp;
    return await this.orderRepository.update(order);
  }

  async confirmCodPayment(orderId: string, codPaymentMode: string): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError("Order not found");
    }
    if (order.paymentMethod !== "cod") {
      throw new ValidationError("This order is not a COD order");
    }
    if (order.paymentStatus !== "cod_pending") {
      throw new ValidationError("COD payment already processed for this order");
    }

    order.paymentStatus = "cod_paid";
    (order as any).codPaymentMode = codPaymentMode;

    return await this.orderRepository.update(order);
  }

  async getOrderByIdInternal(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError("Order not found");
    }
    return order;
  }

  async fetchRestaurantOrders(restaurantId: string): Promise<Order[]> {
    return await this.orderRepository.findByRestaurant(restaurantId);
  }

  async getRestaurantSalesStats(restaurantId: string): Promise<any> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const baseMatch = {
      restaurantId,
      status: "delivered",
      paymentStatus: { $in: ["paid", "cod_paid"] }
    };

    const OrderModel = mongoose.model("Order");

    const [summary, salesTrend, topItems, orderDistribution] = await Promise.all([
      OrderModel.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalAmount" },
            totalOrders: { $sum: 1 },
            avgOrderValue: { $avg: "$totalAmount" }
          }
        }
      ]),
      OrderModel.aggregate([
        { $match: { ...baseMatch, createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            revenue: { $sum: "$totalAmount" },
            orders: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: "$_id", revenue: 1, orders: 1 } }
      ]),
      OrderModel.aggregate([
        { $match: baseMatch },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.name",
            totalQuantity: { $sum: "$items.quantity" },
            totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
          }
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 5 },
        { $project: { _id: 0, name: "$_id", totalQuantity: 1, totalRevenue: 1 } }
      ]),
      OrderModel.aggregate([
        { $match: { restaurantId, paymentStatus: { $in: ["paid", "cod_pending", "cod_paid"] } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $project: { _id: 0, status: "$_id", count: 1 } }
      ])
    ]);

    const s = summary[0] ?? { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 };

    return {
      summary: {
        totalRevenue: s.totalRevenue,
        totalOrders: s.totalOrders,
        avgOrderValue: +s.avgOrderValue.toFixed(2)
      },
      salesTrend,
      topItems,
      orderDistribution
    };
  }

  async updateOrderStatus(restaurantId: string, orderId: string, status: string): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError("Order not found");
    }
    if (order.restaurantId !== restaurantId) {
      throw new AuthorizationError("Access denied");
    }

    order.updateStatus(status);
    const updated = await this.orderRepository.update(order);

    const riderId = (updated as any).riderId || null;
    await this.eventPublisher.publishOrderUpdate(updated.id, updated.userId, updated.restaurantId, status, riderId);

    if (status === "ready_for_rider") {
      const restaurant = await this.restaurantRepository.findById(restaurantId);
      if (restaurant) {
        await this.eventPublisher.publishOrderReadyForRider(updated.id, restaurantId, restaurant.autoLocation);
      }
    }

    return updated;
  }

  async fetchOrderForPayment(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError("Order not found");
    }
    if (order.paymentStatus !== "pending") {
      throw new ValidationError("Payment already done for this order");
    }
    return order;
  }
}
