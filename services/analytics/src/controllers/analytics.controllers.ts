import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authenticate.js";
import { analyticsService } from "../services/index.js";
import { analyticsQuerySchema } from "../validators/AnalyticsValidator.js";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { ValidationError, AuthenticationError, AuthorizationError } from "../utils/errors.js";

export const getDashboardAnalytics = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new AuthenticationError("User not authenticated");
  }

  if (user.role !== "admin" && user.role !== "seller") {
    throw new AuthorizationError("Access denied. Admins or sellers only.");
  }

  const validated = analyticsQuerySchema.parse(req.query);

  const isSeller = user.role === "seller";
  const data = await analyticsService.getDashboardAnalytics(validated, user.restaurantId, isSeller);

  return res.status(200).json({
    message: "Dashboard analytics fetched successfully",
    data,
    success: true,
    error: false
  });
});

export const exportRevenueTrendsCSV = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new AuthenticationError("User not authenticated");
  }

  if (user.role !== "admin" && user.role !== "seller") {
    throw new AuthorizationError("Access denied. Admins or sellers only.");
  }

  const validated = analyticsQuerySchema.parse(req.query);

  const isSeller = user.role === "seller";
  const csv = await analyticsService.exportRevenueTrendsCSV(validated, user.restaurantId, isSeller);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="revenue_trends_${validated.interval || "daily"}.csv"`
  );
  return res.status(200).send(csv);
});
