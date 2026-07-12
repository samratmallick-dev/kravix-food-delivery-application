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
  updateRestaurantLocation(
    userId: string,
    locationData: {
      address: string;
      city: string;
      state: string;
      country: string;
      pincode: string;
      landmark?: string | null;
      latitude: number;
      longitude: number;
      deliveryRadius: number;
      placeId?: string | null;
    },
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; message: string; status: "APPROVED" | "PENDING"; restaurant: Restaurant }>;
}
