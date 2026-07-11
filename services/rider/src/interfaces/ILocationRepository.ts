import { Coordinates } from "../domain/valueObjects/Coordinates.js";

export interface ILocationRepository {
  updateLiveLocation(riderId: string, coordinates: Coordinates): Promise<void>;
  getLiveLocation(riderId: string): Promise<Coordinates | null>;
  findNearbyRiders(coordinates: Coordinates, maxDistanceMeters: number): Promise<string[]>;
}
