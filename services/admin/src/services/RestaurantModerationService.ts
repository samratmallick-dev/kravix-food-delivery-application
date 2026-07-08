import { IRestaurantModerationService } from "../interfaces/IRestaurantModerationService.js";
import { IRestaurantRepository } from "../interfaces/IRestaurantRepository.js";
import { IAdminEventPublisher } from "../interfaces/IAdminEventPublisher.js";
import { Restaurant } from "../domain/entities/Restaurant.js";
import { NotFoundError } from "../utils/errors.js";

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
}
