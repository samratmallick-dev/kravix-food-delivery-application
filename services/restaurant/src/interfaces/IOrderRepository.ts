import { Order } from "../domain/entities/Order.js";

export interface IOrderRepository {
  findById(id: string): Promise<Order | null>;
  findByUser(userId: string): Promise<Order[]>;
  findByRestaurant(restaurantId: string): Promise<Order[]>;
  create(order: Order, session?: any): Promise<Order>;
  update(order: Order, session?: any): Promise<Order>;
  findActiveOrderForRestaurant(restaurantId: string): Promise<Order | null>;
}
