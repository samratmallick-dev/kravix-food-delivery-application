import { Restaurant } from "../domain/entities/Restaurant.js";

export interface IRestaurantRepository {
  findById(id: string): Promise<Restaurant | null>;
  findBySlug(slug: string): Promise<Restaurant | null>;
  findByOwner(ownerId: string): Promise<Restaurant | null>;
  findNearby(longitude: number, latitude: number, maxDistanceMeters: number): Promise<Restaurant[]>;
  create(restaurant: Restaurant): Promise<Restaurant>;
  update(restaurant: Restaurant): Promise<Restaurant>;
  findNearbyWithBlockedAndSearch(
    longitude: number,
    latitude: number,
    radius: number,
    blockedOwnerIds: string[],
    nameRegex?: RegExp,
    restaurantIds?: string[]
  ): Promise<Restaurant[]>;
}
