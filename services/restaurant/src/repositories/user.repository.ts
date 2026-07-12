import { IUserRepository } from "../interfaces/IUserRepository.js";
import { User as UserModel } from "../model/User.js";

export class UserRepository implements IUserRepository {
  async findBlockedOwnerIds(now: Date): Promise<string[]> {
    const blockedOwners = await UserModel.find({
      isBlocked: true,
      blockedUntil: { $gt: now }
    }).select('_id').lean();
    return blockedOwners.map((id: any) => id._id.toString());
  }
}
