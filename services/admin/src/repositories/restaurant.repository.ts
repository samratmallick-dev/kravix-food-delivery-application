import { IRestaurantRepository } from "../interfaces/IRestaurantRepository.js";
import { Restaurant } from "../domain/entities/Restaurant.js";
import { Restaurant as RestaurantModel } from "../models/Restaurant.js";
import { MenuItem as MenuItemModel } from "../models/MenuItem.js";
import { RestaurantMapper } from "../mappers/restaurant.mapper.js";

export class RestaurantRepository implements IRestaurantRepository {
  async find(filter: Record<string, any>, skip: number, limit: number): Promise<Restaurant[]> {
    const raw = await RestaurantModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    return raw.map(RestaurantMapper.toDomain);
  }

  async count(filter: Record<string, any>): Promise<number> {
    return await RestaurantModel.countDocuments(filter);
  }

  async findById(id: string): Promise<Restaurant | null> {
    const raw = await RestaurantModel.findById(id).lean();
    if (!raw) return null;
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

  async delete(id: string): Promise<void> {
    await RestaurantModel.findByIdAndDelete(id);
  }

  async countByVerification(): Promise<any> {
    return await RestaurantModel.aggregate([
      { $group: { _id: "$isVerified", count: { $sum: 1 } } }
    ]);
  }

  async findByOwnerId(ownerId: string): Promise<Restaurant | null> {
    const raw = await RestaurantModel.findOne({ ownerId }).select("_id").lean();
    if (!raw) return null;
    return RestaurantMapper.toDomain(raw);
  }

  async findMenuItemsByRestaurantId(restaurantId: string): Promise<any[]> {
    return await MenuItemModel.find({ restaurantId }).lean();
  }

  async deleteMenuItemsByRestaurantId(restaurantId: string): Promise<void> {
    await MenuItemModel.deleteMany({ restaurantId });
  }
}
