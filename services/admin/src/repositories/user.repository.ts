import { IUserRepository } from "../interfaces/IUserRepository.js";
import { User } from "../domain/entities/User.js";
import { User as UserModel } from "../models/User.js";
import { UserMapper } from "../mappers/user.mapper.js";

export class UserRepository implements IUserRepository {
  async find(filter: Record<string, any>, skip: number, limit: number): Promise<User[]> {
    const raw = await UserModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    return raw.map(UserMapper.toDomain);
  }

  async count(filter: Record<string, any>): Promise<number> {
    return await UserModel.countDocuments(filter);
  }

  async findById(id: string): Promise<User | null> {
    const raw = await UserModel.findById(id).lean();
    if (!raw) return null;
    return UserMapper.toDomain(raw);
  }

  async update(user: User): Promise<User> {
    const persistence = UserMapper.toPersistence(user);
    const raw = await UserModel.findByIdAndUpdate(
      user.id,
      { $set: persistence },
      { new: true }
    );
    if (!raw) {
      throw new Error("User not found");
    }
    return UserMapper.toDomain(raw);
  }

  async countByRole(): Promise<any> {
    return await UserModel.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]);
  }
}
