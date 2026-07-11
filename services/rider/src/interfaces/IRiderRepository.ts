import { RiderAggregate } from "../domain/aggregates/RiderAggregate.js";

export interface IRiderRepository {
  findById(id: string): Promise<RiderAggregate | null>;
  findByUserId(userId: string): Promise<RiderAggregate | null>;
  findOneAndUpdate(query: any, update: any, options?: any): Promise<RiderAggregate | null>;
  create(rider: RiderAggregate): Promise<RiderAggregate>;
  save(rider: RiderAggregate): Promise<RiderAggregate>;
  findNearbyAvailable(coordinates: [number, number], maxDistanceMeters: number): Promise<RiderAggregate[]>;
}
