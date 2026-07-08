import { AnalyticsQueryDto, AnalyticsResponseDto } from "../dto/AnalyticsQueryDto.js";

export interface IAnalyticsService {
  getDashboardAnalytics(query: AnalyticsQueryDto, sellerRestaurantId?: string, isSeller?: boolean): Promise<AnalyticsResponseDto>;
  exportRevenueTrendsCSV(query: AnalyticsQueryDto, sellerRestaurantId?: string, isSeller?: boolean): Promise<string>;
}
