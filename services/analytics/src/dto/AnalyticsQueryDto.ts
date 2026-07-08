export interface AnalyticsQueryDto {
  startDate?: string | undefined;
  endDate?: string | undefined;
  interval?: "daily" | "weekly" | "monthly" | undefined;
  restaurantId?: string | undefined;
}

export interface AnalyticsResponseDto {
  summary: any;
  trends: any[];
  topFoods: any[];
  peakHours: any[];
  topRestaurants: any[];
  userGrowth: any[];
  riderPerformance: any[];
}
