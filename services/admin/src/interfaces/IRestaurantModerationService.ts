import { Restaurant } from "../domain/entities/Restaurant.js";

export interface IRestaurantModerationService {
  getAllRestaurants(page: number, limit: number, isVerified?: string): Promise<{ restaurants: Restaurant[]; total: number }>;
  getRestaurantById(id: string): Promise<{ restaurant: Restaurant; menuItems: any[] }>;
  verifyRestaurant(id: string, isVerifiedInput?: boolean): Promise<Restaurant>;
  deleteRestaurant(id: string): Promise<void>;
  approveLocation(id: string, adminId: string, reason?: string, locationVersion?: number): Promise<Restaurant>;
  rejectLocation(id: string, adminId: string, reason?: string, locationVersion?: number): Promise<Restaurant>;
}
