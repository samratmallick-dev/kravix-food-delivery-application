import { IUserModerationService } from "../interfaces/IUserModerationService.js";
import { IUserRepository } from "../interfaces/IUserRepository.js";
import { IRiderRepository } from "../interfaces/IRiderRepository.js";
import { IRestaurantRepository } from "../interfaces/IRestaurantRepository.js";
import { IAdminEventPublisher } from "../interfaces/IAdminEventPublisher.js";
import { User } from "../domain/entities/User.js";
import { NotFoundError } from "../utils/errors.js";

const BLOCK_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export class UserModerationService implements IUserModerationService {
  constructor(
    private userRepository: IUserRepository,
    private riderRepository: IRiderRepository,
    private restaurantRepository: IRestaurantRepository,
    private eventPublisher: IAdminEventPublisher
  ) {}

  async getAllUsers(page: number, limit: number, role?: string): Promise<{ users: User[]; total: number }> {
    const filter: Record<string, any> = {};
    if (role === "null") {
      filter["role"] = null;
    } else if (role) {
      filter["role"] = role;
    }

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.userRepository.find(filter, skip, limit),
      this.userRepository.count(filter)
    ]);

    const riderUserIds = users.filter((u) => u.role === "rider").map((u) => u.id);
    if (riderUserIds.length > 0) {
      const riderProfiles = await this.riderRepository.findByUserIds(riderUserIds);
      const riderPictureMap = new Map(riderProfiles.map((r) => [r.userId, r.picture]));
      for (const u of users) {
        if (u.role === "rider") {
          const pic = riderPictureMap.get(u.id);
          if (pic) {
            (u as any).riderPicture = pic;
          }
        }
      }
    }

    return { users, total };
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return user;
  }

  async blockUser(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const now = new Date();
    const isCurrentlyBlocked = user.isBlocked && user.blockedUntil && user.blockedUntil > now;

    const blockedUntil = isCurrentlyBlocked ? null : new Date(now.getTime() + BLOCK_DURATION_MS);
    user.toggleBlock(blockedUntil);

    const updated = await this.userRepository.update(user);

    let restaurantId: string | null = null;
    if (user.role === "seller") {
      const restaurant = await this.restaurantRepository.findByOwnerId(user.id);
      restaurantId = restaurant?.id ?? null;
    }

    await this.eventPublisher.publishUserBlockStatusChanged(
      updated.id,
      updated.role,
      updated.isBlocked,
      updated.blockedUntil,
      restaurantId
    );

    return updated;
  }
}
