import { Redis } from "ioredis";
import { ICache } from "../interfaces/ICache.js";

export class RedisCache implements ICache {
  private redisClient: Redis | null = null;
  private readonly memoryCache = new Map<string, { value: any; expiresAt: number }>();

  constructor() {
    if (process.env.REDIS_URL) {
      try {
        this.redisClient = new Redis(process.env.REDIS_URL, {
          maxRetriesPerRequest: 1,
          connectTimeout: 2000
        });
        this.redisClient.on("error", (err) => {
          console.warn("Redis error, falling back to memory cache:", err.message);
          this.redisClient = null;
        });
      } catch (err) {
        console.warn("Could not connect to Redis, falling back to memory cache.");
        this.redisClient = null;
      }
    }
  }

  private async isRedisAvailable(): Promise<boolean> {
    return this.redisClient !== null;
  }

  async get(key: string): Promise<any | null> {
    try {
      if ((await this.isRedisAvailable()) && this.redisClient) {
        const data = await this.redisClient.get(key);
        return data ? JSON.parse(data) : null;
      }
    } catch (err) {
      console.warn("Redis GET failed, trying memory cache:", err);
    }

    const cached = this.memoryCache.get(key);
    if (cached) {
      if (cached.expiresAt > Date.now()) {
        return cached.value;
      }
      this.memoryCache.delete(key);
    }
    return null;
  }

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    try {
      if ((await this.isRedisAvailable()) && this.redisClient) {
        await this.redisClient.set(key, JSON.stringify(value), "EX", ttlSeconds);
        return;
      }
    } catch (err) {
      console.warn("Redis SET failed, trying memory cache:", err);
    }

    this.memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000
    });
  }

  async clear(): Promise<void> {
    try {
      if ((await this.isRedisAvailable()) && this.redisClient) {
        await this.redisClient.flushall();
        console.log("Redis cache flushed.");
      }
    } catch (err) {
      console.warn("Redis FLUSHALL failed, clearing memory cache:", err);
    }

    this.memoryCache.clear();
    console.log("Memory cache cleared.");
  }
}
