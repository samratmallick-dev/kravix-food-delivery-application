import { IUserRepository } from "../interfaces/IUserRepository.js";
import { User as DomainUser } from "../domain/entities/User.js";
import { User as UserModel } from "../model/User.js";
import { UserMapper } from "../mappers/user.mapper.js";

export class UserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<DomainUser | null> {
    const raw = await UserModel.findOne({ email }).select("+passwordHash +emailVerificationToken +passwordResetToken");
    if (!raw) return null;
    return UserMapper.toDomain(raw);
  }

  async findById(id: string): Promise<DomainUser | null> {
    const raw = await UserModel.findById(id).select("+passwordHash +emailVerificationToken +passwordResetToken");
    if (!raw) return null;
    return UserMapper.toDomain(raw);
  }

  async findByVerificationToken(token: string): Promise<DomainUser | null> {
    const raw = await UserModel.findOne({ emailVerificationToken: token }).select("+passwordHash +emailVerificationToken +passwordResetToken");
    if (!raw) return null;
    return UserMapper.toDomain(raw);
  }

  async findByResetToken(token: string): Promise<DomainUser | null> {
    const raw = await UserModel.findOne({ passwordResetToken: token }).select("+passwordHash +emailVerificationToken +passwordResetToken");
    if (!raw) return null;
    return UserMapper.toDomain(raw);
  }

  async create(user: DomainUser): Promise<DomainUser> {
    const persistenceData = UserMapper.toPersistence(user);
    if (persistenceData.restaurantId === null) {
      delete persistenceData.restaurantId;
    }
    const raw = await UserModel.create(persistenceData);
    return UserMapper.toDomain(raw);
  }

  async update(user: DomainUser): Promise<DomainUser> {
    const persistenceData = UserMapper.toPersistence(user);
    const raw = await UserModel.findByIdAndUpdate(
      user.id,
      { $set: persistenceData },
      { new: true, runValidators: true }
    ).select("+passwordHash +emailVerificationToken +passwordResetToken");
    if (!raw) {
      throw new Error("User not found for update");
    }
    return UserMapper.toDomain(raw);
  }
}
