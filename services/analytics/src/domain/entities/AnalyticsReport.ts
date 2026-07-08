import { MetricsPoint } from "../valueObjects/MetricsPoint.js";

export class AnalyticsReport {
  constructor(
    public readonly id: string,
    public readonly summary: any,
    public readonly trends: MetricsPoint[],
    public readonly topFoods: MetricsPoint[],
    public readonly peakHours: MetricsPoint[],
    public readonly topRestaurants: MetricsPoint[],
    public readonly userGrowth: MetricsPoint[],
    public readonly riderPerformance: MetricsPoint[]
  ) {}
}
