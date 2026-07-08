export interface IAnalyticsRepository {
  computeDashboardSummary(startDate?: Date, endDate?: Date, restaurantId?: string): Promise<any>;
  computeRevenueTrends(startDate?: Date, endDate?: Date, interval?: string, restaurantId?: string): Promise<any[]>;
  computeTopSellingFoods(startDate?: Date, endDate?: Date, limit?: number, restaurantId?: string): Promise<any[]>;
  computePeakOrderHours(startDate?: Date, endDate?: Date, restaurantId?: string): Promise<any[]>;
  computeTopRestaurants(startDate?: Date, endDate?: Date, limit?: number): Promise<any[]>;
  computeUserGrowth(startDate?: Date, endDate?: Date): Promise<any[]>;
  computeRiderPerformance(limit?: number): Promise<any[]>;
}
