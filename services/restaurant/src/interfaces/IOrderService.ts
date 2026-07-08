import { Order } from "../domain/entities/Order.js";
import { PlaceOrderRequestDto } from "../dto/restaurant.dto.js";

export interface IOrderService {
  createOrder(userId: string, userName: string, dto: PlaceOrderRequestDto): Promise<any>;
  getMyOrders(userId: string): Promise<Order[]>;
  getOrderById(orderId: string): Promise<Order>;
  cancelMyOrder(userId: string, orderId: string): Promise<Order>;
  reorderItems(userId: string, orderId: string): Promise<any>;
  assignRiderToOrder(
    orderId: string,
    riderId: string,
    riderUserId: string,
    riderName: string,
    riderPhoneNumber: number
  ): Promise<Order>;
  getCurrentOrdersForRiders(riderId: string): Promise<Order>;
  updateOrderStatusByRider(orderId: string, riderId: string, riderLat?: number, riderLng?: number): Promise<Order>;
  getDeliveredOrdersByRider(riderId: string): Promise<Order[]>;
  setOrderOtp(orderId: string, otp: number): Promise<Order>;
  confirmCodPayment(orderId: string, codPaymentMode: string): Promise<Order>;
  getOrderByIdInternal(orderId: string): Promise<Order>;
  fetchRestaurantOrders(restaurantId: string): Promise<Order[]>;
  getRestaurantSalesStats(restaurantId: string): Promise<any>;
  updateOrderStatus(restaurantId: string, orderId: string, status: string): Promise<Order>;
  fetchOrderForPayment(orderId: string): Promise<Order>;
}
