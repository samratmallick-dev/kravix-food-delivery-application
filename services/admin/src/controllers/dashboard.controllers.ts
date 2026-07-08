import { Response, NextFunction } from "express";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { AdminRequest } from "../middleware/isAdminAuthenticated.js";
import { dashboardService } from "../services/index.js";
import { successResponse } from "../utils/response.js";

export const getDashboard = TryCatch(async (req: AdminRequest, res: Response, next: NextFunction) => {
  const stats = await dashboardService.getDashboardStats();
  return successResponse(res, 200, "Dashboard stats fetched successfully", stats);
});
