import { Redis } from "ioredis";

let redisClient: Redis | null = null;
const memoryCache = new Map<string, { value: any; expiresAt: number }>();

const isRedisAvailable = async (): Promise<boolean> => {
      if (process.env.REDIS_URL) {
            try {
                  if (!redisClient) {
                        redisClient = new Redis(process.env.REDIS_URL, {
                              maxRetriesPerRequest: 1,
                              connectTimeout: 2000
                        });
                        redisClient.on("error", (err) => {
                              console.warn("Redis error, falling back to memory cache:", err.message);
                              redisClient = null;
                        });
                  }
                  return true;
            } catch (err) {
                  console.warn("Could not connect to Redis, falling back to memory cache.");
                  redisClient = null;
                  return false;
            }
      }
      return false;
};

export const getCache = async (key: string): Promise<any | null> => {
      try {
            if (await isRedisAvailable() && redisClient) {
                  const data = await redisClient.get(key);
                  return data ? JSON.parse(data) : null;
            }
      } catch (err) {
            console.warn("Redis GET failed, trying memory cache:", err);
      }

      // Memory cache fallback
      const cached = memoryCache.get(key);
      if (cached) {
            if (cached.expiresAt > Date.now()) {
                  return cached.value;
            }
            memoryCache.delete(key);
      }
      return null;
};

export const setCache = async (key: string, value: any, ttlSeconds: number = 300): Promise<void> => {
      try {
            if (await isRedisAvailable() && redisClient) {
                  await redisClient.set(key, JSON.stringify(value), "EX", ttlSeconds);
                  return;
            }
      } catch (err) {
            console.warn("Redis SET failed, trying memory cache:", err);
      }

      // Memory cache fallback
      memoryCache.set(key, {
            value,
            expiresAt: Date.now() + ttlSeconds * 1000
      });
};

export const clearCache = async (): Promise<void> => {
      try {
            if (await isRedisAvailable() && redisClient) {
                  await redisClient.flushall();
                  console.log("Redis cache flushed.");
            }
      } catch (err) {
            console.warn("Redis FLUSHALL failed, clearing memory cache:", err);
      }

      memoryCache.clear();
      console.log("Memory cache cleared.");
};
