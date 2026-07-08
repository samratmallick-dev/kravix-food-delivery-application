import { AnalyticsReport } from "../domain/entities/AnalyticsReport.js";

export class AnalyticsFactory {
  static createReport(
    summary: any,
    trends: any[],
    topFoods: any[],
    peakHours: any[],
    topRestaurants: any[],
    userGrowth: any[],
    riderPerformance: any[]
  ): AnalyticsReport {
    return new AnalyticsReport(
      "",
      summary,
      trends,
      topFoods,
      peakHours,
      topRestaurants,
      userGrowth,
      riderPerformance
    );
  }
}
