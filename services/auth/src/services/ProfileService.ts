import { IProfileService } from "../interfaces/IProfileService.js";
import { IUserRepository } from "../interfaces/IUserRepository.js";
import { IAuthEventPublisher } from "../interfaces/IAuthEventPublisher.js";
import { User } from "../domain/entities/User.js";
import { NotFoundError } from "../utils/errors.js";

export class ProfileService implements IProfileService {
  constructor(
    private userRepository: IUserRepository,
    private eventPublisher: IAuthEventPublisher
  ) {}

  async getUserProfile(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return user;
  }

  async updateUserProfile(userId: string, name?: string, image?: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    user.updateProfile(name, image);
    const updated = await this.userRepository.update(user);
    this.eventPublisher.publishUserProfileSynced(updated.id, updated.name, updated.email, updated.image);
    return updated;
  }

  async addUserRole(userId: string, role: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    user.assignRole(role);
    const updated = await this.userRepository.update(user);
    this.eventPublisher.publishUserRoleUpdated(updated.id, updated.name, updated.email, updated.role);
    return updated;
  }
}
