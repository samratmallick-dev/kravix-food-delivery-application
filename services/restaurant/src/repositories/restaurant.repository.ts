import mongoose from "mongoose";
import { IRestaurantRepository } from "../interfaces/IRestaurantRepository.js";
import { Restaurant } from "../domain/entities/Restaurant.js";
import { Restaurant as RestaurantModel } from "../model/Restaurant.js";
import { RestaurantMapper } from "../mappers/restaurant.mapper.js";

export class RestaurantRepository implements IRestaurantRepository {
  async findById(id: string): Promise<Restaurant | null> {
    const raw = await RestaurantModel.findById(id).lean();
    if (!raw) return null;
    return RestaurantMapper.toDomain(raw);
  }

  async findBySlug(slug: string): Promise<Restaurant | null> {
    const raw = await RestaurantModel.findOne({ slug }).lean();
    if (!raw) return null;
    return RestaurantMapper.toDomain(raw);
  }

  async findByOwner(ownerId: string): Promise<Restaurant | null> {
    const raw = await RestaurantModel.findOne({ ownerId }).lean();
    if (!raw) return null;
    return RestaurantMapper.toDomain(raw);
  }

  async findNearby(longitude: number, latitude: number, maxDistanceMeters: number): Promise<Restaurant[]> {
    const raw = await RestaurantModel.find({
      autoLocation: {
        $near: {
          $geometry: { type: "Point", coordinates: [longitude, latitude] },
          $maxDistance: maxDistanceMeters
        }
      }
    }).lean();
    return raw.map(RestaurantMapper.toDomain);
  }

  async create(restaurant: Restaurant): Promise<Restaurant> {
    const persistence = RestaurantMapper.toPersistence(restaurant);
    const raw = await RestaurantModel.create(persistence);
    return RestaurantMapper.toDomain(raw);
  }

  async update(restaurant: Restaurant): Promise<Restaurant> {
    const persistence = RestaurantMapper.toPersistence(restaurant);
    const raw = await RestaurantModel.findByIdAndUpdate(
      restaurant.id,
      { $set: persistence },
      { new: true }
    );
    if (!raw) {
      throw new Error("Restaurant not found");
    }
    return RestaurantMapper.toDomain(raw);
  }

  async findNearbyWithBlockedAndSearch(
    longitude: number,
    latitude: number,
    radius: number,
    blockedOwnerIds: string[],
    nameRegex?: RegExp,
    restaurantIds?: string[]
  ): Promise<Restaurant[]> {
    const query: Record<string, any> = {
      isVerified: true
    };
    if (blockedOwnerIds.length > 0) {
      query.ownerId = { $nin: blockedOwnerIds };
    }

    if (nameRegex && restaurantIds) {
      query.$or = [
        { name: { $regex: nameRegex } },
        { _id: { $in: restaurantIds.map((id) => new mongoose.Types.ObjectId(id)) } }
      ];
    } else if (nameRegex) {
      query.name = { $regex: nameRegex };
    } else if (restaurantIds) {
      query._id = { $in: restaurantIds.map((id) => new mongoose.Types.ObjectId(id)) };
    }

    const pipeline: any[] = [
      {
        $geoNear: {
          near: { type: "Point", coordinates: [longitude, latitude] },
          distanceField: "distance",
          maxDistance: radius,
          spherical: true,
          query
        }
      },
      { $sort: { distance: 1, isOpen: -1 } },
      {
        $addFields: {
          distanceKm: { $round: [{ $divide: ["$distance", 1000] }, 2] }
        }
      },
      { $limit: 25 }
    ];

    const raw = await RestaurantModel.aggregate(pipeline);
    return raw.map((r: any) => {
      const domain = RestaurantMapper.toDomain(r);
      domain.distanceKm = r.distanceKm;
      return domain;
    });
  }
}
