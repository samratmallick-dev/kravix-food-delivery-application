import { Order } from "../domain/entities/Order.js";

export interface IOrderModerationService {
  getAllOrders(page: number, limit: number, status?: string): Promise<{ orders: Order[]; total: number }>;
  getOrderById(id: string): Promise<Order>;
  cancelOrder(id: string): Promise<Order>;
}
