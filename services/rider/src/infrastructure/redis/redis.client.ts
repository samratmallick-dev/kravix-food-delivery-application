import { Redis } from "ioredis";
import { Coordinates } from "../../domain/valueObjects/Coordinates.js";

export class RedisClient {
  private client: Redis | null = null;
  private readonly geoKey = "riders:locations";
  private readonly memoryCache = new Map<string, Coordinates>();

  constructor() {
    const url = process.env.REDIS_URL;
    if (url) {
      try {
        this.client = new Redis(url, {
          maxRetriesPerRequest: 1,
          connectTimeout: 2000,
        });
        this.client.on("error", (err) => {
          console.warn("Redis client error, falling back to memory location store:", err.message);
          this.client = null;
        });
      } catch (err) {
        console.warn("Could not connect to Redis, falling back to memory location store.");
        this.client = null;
      }
    }
  }

  private isAvailable(): boolean {
    return this.client !== null;
  }

  async updateLocation(riderId: string, coordinates: Coordinates): Promise<void> {
    if (this.isAvailable() && this.client) {
      try {
        const [lng, lat] = coordinates.toArray();
        await this.client.geoadd(this.geoKey, lng, lat, riderId);
        return;
      } catch (err) {
        console.warn("Redis GEOADD failed, fallback to memory:", err);
      }
    }
    this.memoryCache.set(riderId, coordinates);
  }

  async removeLocation(riderId: string): Promise<void> {
    if (this.isAvailable() && this.client) {
      try {
        await this.client.zrem(this.geoKey, riderId);
        return;
      } catch (err) {
        console.warn("Redis ZREM failed, fallback to memory:", err);
      }
    }
    this.memoryCache.delete(riderId);
  }

  async getLocation(riderId: string): Promise<Coordinates | null> {
    if (this.isAvailable() && this.client) {
      try {
        const pos = await this.client.geopos(this.geoKey, riderId);
        if (pos && pos[0]) {
          const [lng, lat] = pos[0];
          return new Coordinates(Number(lng), Number(lat));
        }
        return null;
      } catch (err) {
        console.warn("Redis GEOPOS failed, fallback to memory:", err);
      }
    }
    return this.memoryCache.get(riderId) || null;
  }

  async findNearbyRiders(coordinates: Coordinates, radiusMeters: number): Promise<string[]> {
    if (this.isAvailable() && this.client) {
      try {
        const [lng, lat] = coordinates.toArray();
        // ioredis GEORADIUS query returns member list. Unit can be 'm' (meters), 'km' (kilometers).
        const members = await this.client.georadius(
          this.geoKey,
          lng,
          lat,
          radiusMeters,
          "m"
        );
        return (members as string[]) || [];
      } catch (err) {
        console.warn("Redis GEORADIUS failed, fallback to memory:", err);
      }
    }

    // In-memory distance filtering fallback
    const matches: string[] = [];
    const [centerLng, centerLat] = coordinates.toArray();
    
    for (const [riderId, riderCoords] of this.memoryCache.entries()) {
      const [rLng, rLat] = riderCoords.toArray();
      const dist = this.getHaversineDistance(centerLat, centerLng, rLat, rLng);
      if (dist <= radiusMeters) {
        matches.push(riderId);
      }
    }
    return matches;
  }

  private getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in meters
  }
}

export const redisClient = new RedisClient();
