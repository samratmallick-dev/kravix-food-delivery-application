import { AnalyticsRepository } from "../repositories/analytics.repository.js";
import { RedisCache } from "../cache/redis.cache.js";
import { AnalyticsService } from "./AnalyticsService.js";

export const analyticsRepository = new AnalyticsRepository();
export const redisCache = new RedisCache();
export const analyticsService = new AnalyticsService(analyticsRepository, redisCache);
