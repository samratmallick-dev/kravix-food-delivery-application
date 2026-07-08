import { IRiderRepository } from "../interfaces/IRiderRepository.js";
import { Rider } from "../domain/entities/Rider.js";
import { Rider as RiderModel } from "../models/Rider.js";
import { RiderMapper } from "../mappers/rider.mapper.js";

export class RiderRepository implements IRiderRepository {
  async find(filter: Record<string, any>, skip: number, limit: number): Promise<Rider[]> {
    const raw = await RiderModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    return raw.map(RiderMapper.toDomain);
  }

  async count(filter: Record<string, any>): Promise<number> {
    return await RiderModel.countDocuments(filter);
  }

  async findById(id: string): Promise<Rider | null> {
    const raw = await RiderModel.findById(id).lean();
    if (!raw) return null;
    return RiderMapper.toDomain(raw);
  }

  async update(rider: Rider): Promise<Rider> {
    const persistence = RiderMapper.toPersistence(rider);
    const raw = await RiderModel.findByIdAndUpdate(
      rider.id,
      { $set: persistence },
      { new: true }
    );
    if (!raw) {
      throw new Error("Rider not found");
    }
    return RiderMapper.toDomain(raw);
  }

  async countByVerification(): Promise<any> {
    return await RiderModel.aggregate([{ $group: { _id: "$isVerified", count: { $sum: 1 } } }]);
  }

  async findByUserIds(userIds: string[]): Promise<Rider[]> {
    const raw = await RiderModel.find({ userId: { $in: userIds } }, { userId: 1, picture: 1 }).lean();
    return raw.map(RiderMapper.toDomain);
  }

  async delete(id: string): Promise<void> {
    await RiderModel.findByIdAndDelete(id);
  }
}
