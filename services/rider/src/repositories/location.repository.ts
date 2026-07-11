import { ILocationRepository } from "../interfaces/ILocationRepository.js";
import { Coordinates } from "../domain/valueObjects/Coordinates.js";
import { redisClient } from "../infrastructure/redis/redis.client.js";

export class LocationRepository implements ILocationRepository {
  async updateLiveLocation(riderId: string, coordinates: Coordinates): Promise<void> {
    await redisClient.updateLocation(riderId, coordinates);
  }

  async getLiveLocation(riderId: string): Promise<Coordinates | null> {
    return redisClient.getLocation(riderId);
  }

  async findNearbyRiders(coordinates: Coordinates, maxDistanceMeters: number): Promise<string[]> {
    return redisClient.findNearbyRiders(coordinates, maxDistanceMeters);
  }
}
