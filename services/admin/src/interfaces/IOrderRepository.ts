import { Order } from "../domain/entities/Order.js";

export interface IOrderRepository {
  find(filter: Record<string, any>, skip: number, limit: number): Promise<Order[]>;
  count(filter: Record<string, any>): Promise<number>;
  findById(id: string): Promise<Order | null>;
  update(order: Order): Promise<Order>;
  countByStatusPaid(): Promise<any>;
  getTotalPaidRevenue(): Promise<number>;
  getTodayStats(todayStart: Date): Promise<any>;
}
