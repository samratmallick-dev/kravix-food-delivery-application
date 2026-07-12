import mongoose from "mongoose";
import { IRestaurantModerationService } from "../interfaces/IRestaurantModerationService.js";
import { IRestaurantRepository } from "../interfaces/IRestaurantRepository.js";
import { IAdminEventPublisher } from "../interfaces/IAdminEventPublisher.js";
import { Restaurant } from "../domain/entities/Restaurant.js";
import { NotFoundError, ConflictError, ValidationError } from "../utils/errors.js";
import { Restaurant as RestaurantModel } from "../models/Restaurant.js";
import { RestaurantLocationHistory } from "../models/RestaurantLocationHistory.js";
import axios from "axios";
import { RestaurantMapper } from "../mappers/restaurant.mapper.js";
import { publishToQueue } from "../config/rabbitmq.js";

export class RestaurantModerationService implements IRestaurantModerationService {
  constructor(
    private restaurantRepository: IRestaurantRepository,
    private eventPublisher: IAdminEventPublisher
  ) {}

  async getAllRestaurants(page: number, limit: number, isVerified?: string): Promise<{ restaurants: Restaurant[]; total: number }> {
    const filter: Record<string, any> = {};
    if (isVerified === "true") {
      filter["isVerified"] = true;
    } else if (isVerified === "false") {
      filter["isVerified"] = false;
    }

    const skip = (page - 1) * limit;
    const [restaurants, total] = await Promise.all([
      this.restaurantRepository.find(filter, skip, limit),
      this.restaurantRepository.count(filter)
    ]);

    return { restaurants, total };
  }

  async getRestaurantById(id: string): Promise<{ restaurant: Restaurant; menuItems: any[] }> {
    const restaurant = await this.restaurantRepository.findById(id);
    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }
    const menuItems = await this.restaurantRepository.findMenuItemsByRestaurantId(id);
    return { restaurant, menuItems };
  }

  async verifyRestaurant(id: string, isVerifiedInput?: boolean): Promise<Restaurant> {
    const restaurant = await this.restaurantRepository.findById(id);
    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }

    const targetVerified = isVerifiedInput !== undefined ? isVerifiedInput : !restaurant.isVerified;
    restaurant.toggleVerify(targetVerified);

    const updated = await this.restaurantRepository.update(restaurant);

    await this.eventPublisher.publishRestaurantVerified(updated.id, updated.ownerId, updated.isVerified);

    return updated;
  }

  async deleteRestaurant(id: string): Promise<void> {
    const restaurant = await this.restaurantRepository.findById(id);
    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }

    await this.restaurantRepository.delete(id);
    await this.restaurantRepository.deleteMenuItemsByRestaurantId(id);

    await this.eventPublisher.publishRestaurantDeleted(id, restaurant.ownerId);
  }

  async approveLocation(id: string, adminId: string, reason?: string, locationVersion?: number): Promise<Restaurant> {
    const restaurantRaw = await RestaurantModel.findById(id);
    if (!restaurantRaw) {
      throw new NotFoundError("Restaurant not found");
    }

    if (restaurantRaw.locationReviewStatus !== "PENDING") {
      throw new ConflictError("No pending location update request exists for this restaurant");
    }

    if (locationVersion !== undefined && restaurantRaw.locationVersion !== locationVersion) {
      throw new ConflictError("Concurrency conflict: The request location version is outdated. Please reload.");
    }

    if (!restaurantRaw.pendingLocation) {
      throw new ValidationError("Pending location data is missing");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    let savedRestaurantRaw: any;
    let newLoc: any;
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

      newLoc = restaurantRaw.pendingLocation;

      savedRestaurantRaw = await RestaurantModel.findByIdAndUpdate(
        id,
        {
          $set: {
            location: newLoc,
            locationReviewStatus: "APPROVED",
            locationReviewedBy: adminId,
            locationReviewedAt: new Date(),
            locationReviewReason: reason || undefined,
            autoLocation: {
              type: "Point",
              coordinates: [newLoc.longitude, newLoc.latitude],
              formattedAddress: newLoc.address
            }
          },
          $unset: {
            pendingLocation: ""
          },
          $inc: {
            locationVersion: 1
          }
        },
        { new: true, session }
      );

      await RestaurantLocationHistory.create(
        [
          {
            restaurantId: id,
            sellerId: restaurantRaw.ownerId,
            action: "APPROVED",
            oldLocation: oldLoc,
            newLocation: newLoc,
            triggeredBy: adminId,
            reason: reason || undefined,
            timestamp: new Date()
          }
        ],
        { session }
      );

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }

    try {
      publishToQueue(process.env.RESTAURANT_ADMIN_EVENT_QUEUE!, "RESTAURANT_LOCATION_APPROVED", {
        restaurantId: id,
        adminId,
        location: newLoc,
        autoLocation: {
          type: "Point",
          coordinates: [newLoc.longitude, newLoc.latitude],
          formattedAddress: newLoc.address
        },
        reason: reason || undefined
      });

      const emitUrl = `${process.env.REALTIME_SOCKET_SERVICE_URI}/api/v1/socket/events`;
      const emitHeaders = { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! };
      await Promise.all([
        axios.post(
          emitUrl,
          {
            event: "restaurant:location_approved",
            room: `Restaurant:${id}`,
            payload: { restaurantId: id, status: "APPROVED" }
          },
          { headers: emitHeaders }
        ),
        axios.post(
          emitUrl,
          {
            event: "admin:restaurant:location_approved",
            room: "Admin",
            payload: { restaurantId: id }
          },
          { headers: emitHeaders }
        )
      ]).catch((e) => console.error("Admin socket emit failed for approveLocation:", e.message));

      await this.eventPublisher.publishRestaurantVerified(savedRestaurantRaw._id.toString(), savedRestaurantRaw.ownerId, savedRestaurantRaw.isVerified);
    } catch (evtErr: any) {
      console.error("Failed to publish RESTAURANT_LOCATION_APPROVED event:", evtErr.message);
    }

    return RestaurantMapper.toDomain(savedRestaurantRaw);
  }

  async rejectLocation(id: string, adminId: string, reason?: string, locationVersion?: number): Promise<Restaurant> {
    const restaurantRaw = await RestaurantModel.findById(id);
    if (!restaurantRaw) {
      throw new NotFoundError("Restaurant not found");
    }

    if (restaurantRaw.locationReviewStatus !== "PENDING") {
      throw new ConflictError("No pending location update request exists for this restaurant");
    }

    if (locationVersion !== undefined && restaurantRaw.locationVersion !== locationVersion) {
      throw new ConflictError("Concurrency conflict: The request location version is outdated. Please reload.");
    }

    if (!restaurantRaw.pendingLocation) {
      throw new ValidationError("Pending location data is missing");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    let savedRestaurantRaw: any;
    try {
      const oldLoc = restaurantRaw.location || {
        address: restaurantRaw.autoLocation.formattedAddress,
        city: "",
        state: "",
        country: "",
        pincode: "",
        latitude: restaurantRaw.autoLocation.coordinates[1],
        longitude: restaurantRaw.autoLocation.coordinates[0],
        deliveryRadius: 5000
      };

      const newLoc = restaurantRaw.pendingLocation;

      savedRestaurantRaw = await RestaurantModel.findByIdAndUpdate(
        id,
        {
          $set: {
            locationReviewStatus: "REJECTED",
            locationReviewedBy: adminId,
            locationReviewedAt: new Date(),
            locationRejectionReason: reason || undefined
          },
          $unset: {
            pendingLocation: ""
          },
          $inc: {
            locationVersion: 1
          }
        },
        { new: true, session }
      );

      await RestaurantLocationHistory.create(
        [
          {
            restaurantId: id,
            sellerId: restaurantRaw.ownerId,
            action: "REJECTED",
            oldLocation: oldLoc,
            newLocation: newLoc,
            triggeredBy: adminId,
            reason: reason || undefined,
            timestamp: new Date()
          }
        ],
        { session }
      );

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }

    try {
      publishToQueue(process.env.RESTAURANT_ADMIN_EVENT_QUEUE!, "RESTAURANT_LOCATION_REJECTED", {
        restaurantId: id,
        adminId,
        reason: reason || undefined
      });

      const emitUrl = `${process.env.REALTIME_SOCKET_SERVICE_URI}/api/v1/socket/events`;
      const emitHeaders = { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! };
      await Promise.all([
        axios.post(
          emitUrl,
          {
            event: "restaurant:location_rejected",
            room: `Restaurant:${id}`,
            payload: { restaurantId: id, status: "REJECTED" }
          },
          { headers: emitHeaders }
        ),
        axios.post(
          emitUrl,
          {
            event: "admin:restaurant:location_rejected",
            room: "Admin",
            payload: { restaurantId: id }
          },
          { headers: emitHeaders }
        )
      ]).catch((e) => console.error("Admin socket emit failed for rejectLocation:", e.message));
    } catch (evtErr: any) {
      console.error("Failed to publish RESTAURANT_LOCATION_REJECTED event:", evtErr.message);
    }

    return RestaurantMapper.toDomain(savedRestaurantRaw);
  }
}
