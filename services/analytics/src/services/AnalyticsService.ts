import { IAnalyticsService } from "../interfaces/IAnalyticsService.js";
import { IAnalyticsRepository } from "../interfaces/IAnalyticsRepository.js";
import { ICache } from "../interfaces/ICache.js";
import { AnalyticsFactory } from "../factories/AnalyticsFactory.js";
import { AnalyticsMapper } from "../mappers/AnalyticsMapper.js";
import { AnalyticsQueryDto, AnalyticsResponseDto } from "../dto/AnalyticsQueryDto.js";
import { ValidationError } from "../utils/errors.js";

export class AnalyticsService implements IAnalyticsService {
  constructor(
    private readonly analyticsRepository: IAnalyticsRepository,
    private readonly cache: ICache
  ) {}

  async getDashboardAnalytics(query: AnalyticsQueryDto, sellerRestaurantId?: string, isSeller?: boolean): Promise<AnalyticsResponseDto> {
    let restaurantId = query.restaurantId;

    if (isSeller) {
      if (!sellerRestaurantId) {
        throw new ValidationError("Seller has no associated restaurant");
      }
      restaurantId = sellerRestaurantId;
    }

    const start = query.startDate ? new Date(query.startDate) : undefined;
    const end = query.endDate ? new Date(query.endDate) : undefined;
    const interval = query.interval || "daily";

    const cacheKey = `analytics:dashboard:${restaurantId || "global"}:${query.startDate || "all"}:${query.endDate || "all"}:${interval}`;

    const cachedData = await this.cache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const [
      summary,
      trends,
      topFoods,
      peakHours,
      topRestaurants,
      userGrowth,
      riderPerformance
    ] = await Promise.all([
      this.analyticsRepository.computeDashboardSummary(start, end, restaurantId),
      this.analyticsRepository.computeRevenueTrends(start, end, interval, restaurantId),
      this.analyticsRepository.computeTopSellingFoods(start, end, 5, restaurantId),
      this.analyticsRepository.computePeakOrderHours(start, end, restaurantId),
      !restaurantId ? this.analyticsRepository.computeTopRestaurants(start, end, 5) : Promise.resolve([]),
      !restaurantId ? this.analyticsRepository.computeUserGrowth(start, end) : Promise.resolve([]),
      !restaurantId ? this.analyticsRepository.computeRiderPerformance(5) : Promise.resolve([])
    ]);

    const report = AnalyticsFactory.createReport(
      summary,
      trends,
      topFoods,
      peakHours,
      topRestaurants,
      userGrowth,
      riderPerformance
    );

    const dto = AnalyticsMapper.toDto(report);

    await this.cache.set(cacheKey, dto, 600);

    return dto;
  }

  async exportRevenueTrendsCSV(query: AnalyticsQueryDto, sellerRestaurantId?: string, isSeller?: boolean): Promise<string> {
    let restaurantId = query.restaurantId;
    if (isSeller) {
      restaurantId = sellerRestaurantId;
    }

    const start = query.startDate ? new Date(query.startDate) : undefined;
    const end = query.endDate ? new Date(query.endDate) : undefined;
    const interval = query.interval || "daily";

    const trends = await this.analyticsRepository.computeRevenueTrends(start, end, interval, restaurantId);

    let csv = "Interval Label,Total Orders,Gross Revenue (INR),Delivery Fees (INR),Platform Fees (INR),Commission (INR)\n";
    for (const row of trends) {
      csv += `"${row.label}",${row.orders},${row.revenue},${row.deliveryFees},${row.platformFees},${row.commission}\n`;
    }

    return csv;
  }
}
