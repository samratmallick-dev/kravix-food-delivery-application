import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/isAuthenticated.js";
import { getCache, setCache } from "../services/cachingService.js";
import {
      computeDashboardSummary,
      computeRevenueTrends,
      computeTopRestaurants,
      computeTopSellingFoods,
      computePeakOrderHours,
      computeUserGrowth,
      computeRiderPerformance,
} from "../services/aggregationService.js";

export const getDashboardAnalytics = async (
      req: AuthenticatedRequest,
      res: Response,
): Promise<void> => {
      const user = req.user;
      if (!user) {
            res
                  .status(401)
                  .json({ message: "User not authenticated", success: false, error: true });
            return;
      }

      if (user.role !== "admin" && user.role !== "seller") {
            res
                  .status(403)
                  .json({
                        message: "Access denied. Admins or sellers only.",
                        success: false,
                        error: true,
                  });
            return;
      }

      let { startDate, endDate, interval = "daily", restaurantId } = req.query;

      if (user.role === "seller") {
            if (!user.restaurantId) {
                  res
                        .status(400)
                        .json({
                              message: "Seller has no associated restaurant",
                              success: false,
                              error: true,
                        });
                  return;
            }
            restaurantId = user.restaurantId;
      }

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const cacheKey = `analytics:dashboard:${restaurantId || "global"}:${startDate || "all"}:${endDate || "all"}:${interval}`;

      try {
            const cachedData = await getCache(cacheKey);
            if (cachedData) {
                  res.status(200).json({
                        message: "Dashboard analytics fetched successfully (cached)",
                        data: cachedData,
                        success: true,
                        error: false,
                  });
                  return;
            }

            const [
                  summary,
                  trends,
                  topFoods,
                  peakHours,
                  topRestaurants,
                  userGrowth,
                  riderPerformance,
            ] = await Promise.all([
                  computeDashboardSummary(start, end, restaurantId as string),
                  computeRevenueTrends(start, end, interval as any, restaurantId as string),
                  computeTopSellingFoods(start, end, 5, restaurantId as string),
                  computePeakOrderHours(start, end, restaurantId as string),
                  !restaurantId
                        ? computeTopRestaurants(start, end, 5)
                        : Promise.resolve([]),
                  !restaurantId ? computeUserGrowth(start, end) : Promise.resolve([]),
                  !restaurantId ? computeRiderPerformance(5) : Promise.resolve([]),
            ]);

            const responseData = {
                  summary,
                  trends,
                  topFoods,
                  peakHours,
                  topRestaurants,
                  userGrowth,
                  riderPerformance,
            };

            await setCache(cacheKey, responseData, 600);

            res.status(200).json({
                  message: "Dashboard analytics fetched successfully",
                  data: responseData,
                  success: true,
                  error: false,
            });
      } catch (error) {
            console.error("Failed to compute dashboard analytics:", error);
            res
                  .status(500)
                  .json({
                        message: "Failed to compute dashboard analytics",
                        success: false,
                        error: true,
                  });
      }
};

export const exportRevenueTrendsCSV = async (
      req: AuthenticatedRequest,
      res: Response,
): Promise<void> => {
      const user = req.user;
      if (!user) {
            res
                  .status(401)
                  .json({ message: "User not authenticated", success: false, error: true });
            return;
      }

      if (user.role !== "admin" && user.role !== "seller") {
            res
                  .status(403)
                  .json({
                        message: "Access denied. Admins or sellers only.",
                        success: false,
                        error: true,
                  });
            return;
      }

      let { startDate, endDate, interval = "daily", restaurantId } = req.query;

      if (user.role === "seller") {
            restaurantId = user.restaurantId;
      }

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      try {
            const trends = await computeRevenueTrends(
                  start,
                  end,
                  interval as any,
                  restaurantId as string,
            );

            let csv =
                  "Interval Label,Total Orders,Gross Revenue (INR),Delivery Fees (INR),Platform Fees (INR),Commission (INR)\n";
            for (const row of trends) {
                  csv += `"${row.label}",${row.orders},${row.revenue},${row.deliveryFees},${row.platformFees},${row.commission}\n`;
            }

            res.setHeader("Content-Type", "text/csv");
            res.setHeader(
                  "Content-Disposition",
                  `attachment; filename="revenue_trends_${interval}.csv"`,
            );
            res.status(200).send(csv);
      } catch (error) {
            console.error("Failed to export analytics CSV:", error);
            res
                  .status(500)
                  .json({
                        message: "Failed to export analytics CSV",
                        success: false,
                        error: true,
                  });
      }
};
