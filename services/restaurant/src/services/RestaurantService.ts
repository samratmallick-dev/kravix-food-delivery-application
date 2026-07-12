import mongoose from "mongoose";
import { IRestaurantService } from "../interfaces/IRestaurantService.js";
import { IRestaurantRepository } from "../interfaces/IRestaurantRepository.js";
import { IUserRepository } from "../interfaces/IUserRepository.js";
import { IMenuItemRepository } from "../interfaces/IMenuItemRepository.js";
import { IOrderRepository } from "../interfaces/IOrderRepository.js";
import { IRestaurantEventPublisher } from "../interfaces/IRestaurantEventPublisher.js";
import { Restaurant } from "../domain/entities/Restaurant.js";
import { NotFoundError, ValidationError, ConflictError, AuthorizationError } from "../utils/errors.js";
import { normalizeSearchQuery } from "../utils/searchNormalizer.js";
import { ICache } from "../interfaces/ICache.js";
import { getUniqueSlug } from "../utils/slugify.js";
import { Restaurant as RestaurantModel } from "../model/Restaurant.js";
import { RestaurantLocationHistory } from "../model/RestaurantLocationHistory.js";
import { LocationValidationService } from "./LocationValidationService.js";
import { RestaurantMapper } from "../mappers/restaurant.mapper.js";
import axios from "axios";
import { env } from "../config/env.config.js";

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

    const slug = await getUniqueSlug(name, "");
    const restaurant = new Restaurant(
      "",
      name,
      slug,
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

  async getRestaurantDetails(identifier: string): Promise<Restaurant> {
    const cacheKey = `restaurant_details:${identifier}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    let restaurant: Restaurant | null = null;
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      restaurant = await this.restaurantRepository.findById(identifier);
    } else {
      const match = identifier.match(/(.+)-([a-fA-F0-9]{24})$/);
      if (match) {
        restaurant = await this.restaurantRepository.findById(match[2]!);
      } else {
        restaurant = await this.restaurantRepository.findBySlug(identifier);
      }
    }

    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }
    await this.cache.set(cacheKey, restaurant, 300);
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
      restaurant.slug,
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

    const updatedName = updates.name || restaurant.name;
    const slug = updates.name ? await getUniqueSlug(updatedName, restaurant.id) : restaurant.slug;
    const updated = new Restaurant(
      restaurant.id,
      updatedName,
      slug,
      updates.description !== undefined ? updates.description : restaurant.description,
      updates.image || restaurant.image,
      restaurant.ownerId,
      restaurant.phone,
      restaurant.isVerified,
      restaurant.autoLocation,
      restaurant.isOpen
    );

    const saved = await this.restaurantRepository.update(updated);

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

    const BLOCKED_CACHE_KEY = "blocked_owner_ids";
    let blockedOwnerIds: string[] = await this.cache.get(BLOCKED_CACHE_KEY) ?? [];
    if (!(await this.cache.get(BLOCKED_CACHE_KEY))) {
      blockedOwnerIds = await this.userRepository.findBlockedOwnerIds(now);
      await this.cache.set(BLOCKED_CACHE_KEY, blockedOwnerIds, 30);
    }

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

  async updateRestaurantLocation(
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
  ): Promise<{ success: boolean; message: string; status: "APPROVED" | "PENDING"; restaurant: Restaurant }> {
    const restaurantRaw = await RestaurantModel.findOne({ ownerId: userId });
    if (!restaurantRaw) {
      throw new NotFoundError("Restaurant not found for this user");
    }

    if (restaurantRaw.ownerId !== userId) {
      throw new AuthorizationError("You do not own this restaurant");
    }

    if (restaurantRaw.locationReviewStatus === "PENDING") {
      throw new ConflictError("Location update is already pending review");
    }

    const valService = new LocationValidationService();
    const geoValidation = await valService.validateCoordinates(locationData.latitude, locationData.longitude);
    if (!geoValidation.isValid) {
      throw new ValidationError(geoValidation.errorReason || "Invalid coordinates location");
    }

    if (restaurantRaw.locationUpdatedAt && new Date().getTime() - new Date(restaurantRaw.locationUpdatedAt).getTime() < 300000) {
      throw new ValidationError("Please wait at least 5 minutes before submitting another location update");
    }

    const requireReapproval = env.REQUIRE_LOCATION_REAPPROVAL;
    console.log("DEBUG: env.REQUIRE_LOCATION_REAPPROVAL =", env.REQUIRE_LOCATION_REAPPROVAL, "process.env.REQUIRE_LOCATION_REAPPROVAL =", process.env.REQUIRE_LOCATION_REAPPROVAL);
    const session = await mongoose.startSession();
    session.startTransaction();

    let savedRestaurantRaw: any;
    let action: "PROPOSED" | "IMMEDIATE_UPDATE" = requireReapproval ? "PROPOSED" : "IMMEDIATE_UPDATE";

    try {
      const oldLoc = restaurantRaw.location || {
        address: restaurantRaw.autoLocation.formattedAddress,
        city: "",
        state: "",
        country: "",
        pincode: "",
        landmark: "",
        latitude: restaurantRaw.autoLocation.coordinates[1],
        longitude: restaurantRaw.autoLocation.coordinates[0],
        deliveryRadius: 5000
      };

      const newLoc = {
        address: locationData.address,
        city: locationData.city,
        state: locationData.state,
        country: locationData.country,
        pincode: locationData.pincode,
        landmark: locationData.landmark || "",
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        placeId: locationData.placeId || "",
        deliveryRadius: locationData.deliveryRadius,
        updatedAt: new Date()
      };

      if (requireReapproval) {
        savedRestaurantRaw = await RestaurantModel.findByIdAndUpdate(
          restaurantRaw._id,
          {
            $set: {
              pendingLocation: newLoc,
              locationReviewStatus: "PENDING",
              locationUpdatedAt: new Date(),
              locationUpdatedBy: userId
            }
          },
          { new: true, session }
        );
      } else {
        savedRestaurantRaw = await RestaurantModel.findByIdAndUpdate(
          restaurantRaw._id,
          {
            $set: {
              location: newLoc,
              locationReviewStatus: "APPROVED",
              locationUpdatedAt: new Date(),
              locationUpdatedBy: userId,
              autoLocation: {
                type: "Point",
                coordinates: [locationData.longitude, locationData.latitude],
                formattedAddress: locationData.address
              }
            }
          },
          { new: true, session }
        );
      }

      await RestaurantLocationHistory.create(
        [
          {
            restaurantId: restaurantRaw._id.toString(),
            sellerId: restaurantRaw.ownerId,
            action,
            oldLocation: oldLoc,
            newLocation: newLoc,
            ipAddress,
            userAgent,
            triggeredBy: userId,
            timestamp: new Date()
          }
        ] as any[],
        { session }
      );

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }

    await this.cache.delete(`restaurant_details:${savedRestaurantRaw._id}`);
    await this.cache.delete(`restaurant_details:${savedRestaurantRaw.slug}`);

    try {
      if (requireReapproval) {
        const emitUrl = `${process.env.REALTIME_SOCKET_SERVICE_URI}/api/v1/socket/events`;
        const emitHeaders = { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! };
        await axios.post(
          emitUrl,
          {
            event: "restaurant:location_review_pending",
            room: "Admin",
            payload: {
              restaurantId: savedRestaurantRaw._id.toString(),
              ownerId: savedRestaurantRaw.ownerId,
              locationReviewStatus: "PENDING"
            }
          },
          { headers: emitHeaders }
        ).catch((err) => console.error("Realtime emit failed for location review:", err.message));
      } else {
        await this.eventPublisher.publishRestaurantStatus(savedRestaurantRaw._id.toString(), savedRestaurantRaw.isOpen);
      }
    } catch (evtErr: any) {
      console.error("Failed to emit location update events:", evtErr.message);
    }

    const domain = RestaurantMapper.toDomain(savedRestaurantRaw);
    return {
      success: true,
      message: requireReapproval
        ? "Your updated location has been submitted for admin review."
        : "Restaurant location updated successfully.",
      status: requireReapproval ? "PENDING" : "APPROVED",
      restaurant: domain
    };
  }
}
