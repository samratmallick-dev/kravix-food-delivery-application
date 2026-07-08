import { Restaurant } from "../domain/entities/Restaurant.js";

export interface IRestaurantRepository {
  find(filter: Record<string, any>, skip: number, limit: number): Promise<Restaurant[]>;
  count(filter: Record<string, any>): Promise<number>;
  findById(id: string): Promise<Restaurant | null>;
  update(restaurant: Restaurant): Promise<Restaurant>;
  delete(id: string): Promise<void>;
  countByVerification(): Promise<any>;
  findByOwnerId(ownerId: string): Promise<Restaurant | null>;
  findMenuItemsByRestaurantId(restaurantId: string): Promise<any[]>;
  deleteMenuItemsByRestaurantId(restaurantId: string): Promise<void>;
}
