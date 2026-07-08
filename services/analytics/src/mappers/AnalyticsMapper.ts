import { AnalyticsReport } from "../domain/entities/AnalyticsReport.js";
import { AnalyticsResponseDto } from "../dto/AnalyticsQueryDto.js";

export class AnalyticsMapper {
  static toDto(report: AnalyticsReport): AnalyticsResponseDto {
    return {
      summary: report.summary,
      trends: report.trends,
      topFoods: report.topFoods,
      peakHours: report.peakHours,
      topRestaurants: report.topRestaurants,
      userGrowth: report.userGrowth,
      riderPerformance: report.riderPerformance
    };
  }
}
