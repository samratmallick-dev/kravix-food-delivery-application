import { IRestaurantService } from "../interfaces/IRestaurantService.js";
import { IRestaurantRepository } from "../interfaces/IRestaurantRepository.js";
import { IUserRepository } from "../interfaces/IUserRepository.js";
import { IMenuItemRepository } from "../interfaces/IMenuItemRepository.js";
import { IOrderRepository } from "../interfaces/IOrderRepository.js";
import { IRestaurantEventPublisher } from "../interfaces/IRestaurantEventPublisher.js";
import { Restaurant } from "../domain/entities/Restaurant.js";
import { NotFoundError, ValidationError } from "../utils/errors.js";
import { normalizeSearchQuery } from "../utils/searchNormalizer.js";
import { ICache } from "../interfaces/ICache.js";

export class RestaurantService implements IRestaurantService {
  constructor(
    private restaurantRepository: IRestaurantRepository,
    private userRepository: IUserRepository,
    private menuItemRepository: IMenuItemRepository,
    private orderRepository: IOrderRepository,
    private eventPublisher: IRestaurantEventPublisher,
    private cache: ICache
  ) {}

  async createRestaurant(
    ownerId: string,
    name: string,
    description: string,
    image: string,
    phone: number,
    coordinates: [number, number],
    formattedAddress: string
  ): Promise<Restaurant> {
    const existing = await this.restaurantRepository.findByOwner(ownerId);
    if (existing) {
      throw new ValidationError("Seller already has a restaurant registered");
    }

    const restaurant = new Restaurant(
      "",
      name,
      description,
      image,
      ownerId,
      phone,
      false,
      { coordinates, formattedAddress },
      false
    );

    return await this.restaurantRepository.create(restaurant);
  }

  async getRestaurantDetails(id: string): Promise<Restaurant> {
    const cacheKey = `restaurant_details:${id}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }
    const restaurant = await this.restaurantRepository.findById(id);
    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }
    await this.cache.set(cacheKey, restaurant, 300); // cache for 5 minutes
    return restaurant;
  }

  async updateRestaurantStatus(ownerId: string, isOpen: boolean): Promise<Restaurant> {
    const restaurant = await this.restaurantRepository.findByOwner(ownerId);
    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }

    if (isOpen === false) {
      const activeOrder = await this.orderRepository.findActiveOrderForRestaurant(restaurant.id);
      if (activeOrder) {
        throw new ValidationError("Cannot close restaurant with active orders. Please complete all orders first.");
      }
    }

    const updated = new Restaurant(
      restaurant.id,
      restaurant.name,
      restaurant.description,
      restaurant.image,
      restaurant.ownerId,
      restaurant.phone,
      restaurant.isVerified,
      restaurant.autoLocation,
      isOpen
    );

    const saved = await this.restaurantRepository.update(updated);

    // Invalidate caches
    await this.cache.delete(`restaurant_details:${saved.id}`);

    await this.eventPublisher.publishRestaurantStatus(saved.id, saved.isOpen);

    return saved;
  }

  async updateRestaurant(ownerId: string, updates: { name?: string; description?: string; image?: string }): Promise<Restaurant> {
    const restaurant = await this.restaurantRepository.findByOwner(ownerId);
    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }

    const updated = new Restaurant(
      restaurant.id,
      updates.name || restaurant.name,
      updates.description !== undefined ? updates.description : restaurant.description,
      updates.image || restaurant.image,
      restaurant.ownerId,
      restaurant.phone,
      restaurant.isVerified,
      restaurant.autoLocation,
      restaurant.isOpen
    );

    const saved = await this.restaurantRepository.update(updated);

    // Invalidate caches
    await this.cache.delete(`restaurant_details:${saved.id}`);

    return saved;
  }

  async getMyRestaurant(ownerId: string): Promise<Restaurant> {
    const restaurant = await this.restaurantRepository.findByOwner(ownerId);
    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }
    return restaurant;
  }

  async getNearestRestaurants(
    longitude: number,
    latitude: number,
    radius: number,
    search?: string
  ): Promise<{ restaurants: Restaurant[]; correctedQuery?: string }> {
    const now = new Date();
    const blockedOwnerIds = await this.userRepository.findBlockedOwnerIds(now);

    let nameRegex: RegExp | undefined;
    let restaurantIds: string[] | undefined;
    let correctedQuery: string | undefined;

    if (search && search.trim()) {
      const rawSearch = search.trim();
      const { normalized: normalizedSearch, corrected } = await normalizeSearchQuery(rawSearch);
      if (corrected) {
        correctedQuery = normalizedSearch;
      }

      const tokens = (normalizedSearch || rawSearch).trim().split(/\s+/).filter(Boolean);
      nameRegex = new RegExp(tokens.join("|"), "i");

      restaurantIds = await this.menuItemRepository.findRestaurantIdsByItemNameRegex(nameRegex);
    }

    const restaurants = await this.restaurantRepository.findNearbyWithBlockedAndSearch(
      longitude,
      latitude,
      radius,
      blockedOwnerIds,
      nameRegex,
      restaurantIds
    );

    const response: { restaurants: Restaurant[]; correctedQuery?: string } = {
      restaurants
    };
    if (correctedQuery) {
      response.correctedQuery = correctedQuery;
    }

    return response;
  }
}
