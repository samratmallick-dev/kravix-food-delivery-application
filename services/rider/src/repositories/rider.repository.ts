import { IRiderRepository } from "../interfaces/IRiderRepository.js";
import { Rider } from "../domain/entities/Rider.js";
import { Rider as RiderModel } from "../model/Rider.js";
import { RiderMapper } from "../mappers/rider.mapper.js";

export class RiderRepository implements IRiderRepository {
  async findById(id: string): Promise<Rider | null> {
    const raw = await RiderModel.findById(id);
    if (!raw) return null;
    return RiderMapper.toDomain(raw);
  }

  async findByUserId(userId: string): Promise<Rider | null> {
    const raw = await RiderModel.findOne({ userId });
    if (!raw) return null;
    return RiderMapper.toDomain(raw);
  }

  async findOneAndUpdate(query: any, update: any, options?: any): Promise<Rider | null> {
    const updated = await RiderModel.findOneAndUpdate(query, update, { new: true, ...options });
    if (!updated) return null;
    return RiderMapper.toDomain(updated);
  }

  async create(rider: Rider): Promise<Rider> {
    const persistence = RiderMapper.toPersistence(rider);
    const created = await RiderModel.create(persistence);
    return RiderMapper.toDomain(created);
  }

  async save(rider: Rider): Promise<Rider> {
    const persistence = RiderMapper.toPersistence(rider);
    const saved = await RiderModel.findOneAndUpdate(
      { userId: rider.userId },
      persistence,
      { new: true, upsert: true }
    );
    return RiderMapper.toDomain(saved);
  }

  async findNearbyAvailable(coordinates: [number, number], maxDistanceMeters: number): Promise<Rider[]> {
    const rawList = await RiderModel.find({
      isAvailable: true,
      isVerified: true,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates
          },
          $maxDistance: maxDistanceMeters
        }
      }
    });
    return rawList.map(RiderMapper.toDomain);
  }
}
