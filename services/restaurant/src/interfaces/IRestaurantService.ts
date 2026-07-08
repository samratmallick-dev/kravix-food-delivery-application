import { Restaurant } from "../domain/entities/Restaurant.js";

export interface IRestaurantService {
  createRestaurant(
    ownerId: string,
    name: string,
    description: string,
    image: string,
    phone: number,
    coordinates: [number, number],
    formattedAddress: string
  ): Promise<Restaurant>;
  getRestaurantDetails(id: string): Promise<Restaurant>;
  updateRestaurantStatus(ownerId: string, isOpen: boolean): Promise<Restaurant>;
  updateRestaurant(ownerId: string, updates: { name?: string; description?: string; image?: string }): Promise<Restaurant>;
  getMyRestaurant(ownerId: string): Promise<Restaurant>;
  getNearestRestaurants(
    longitude: number,
    latitude: number,
    radius: number,
    search?: string
  ): Promise<{ restaurants: Restaurant[]; correctedQuery?: string }>;
}
