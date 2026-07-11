import { Rider } from "../domain/entities/Rider.js";

export interface IRiderRepository {
  findById(id: string): Promise<Rider | null>;
  findByUserId(userId: string): Promise<Rider | null>;
  findOneAndUpdate(query: any, update: any, options?: any): Promise<Rider | null>;
  create(rider: Rider): Promise<Rider>;
  save(rider: Rider): Promise<Rider>;
  findNearbyAvailable(coordinates: [number, number], maxDistanceMeters: number): Promise<Rider[]>;
}
