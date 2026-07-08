import { Response, NextFunction } from "express";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { AdminRequest } from "../middleware/isAdminAuthenticated.js";
import { dashboardService } from "../services/index.js";

export const getDashboard = TryCatch(async (req: AdminRequest, res: Response, next: NextFunction) => {
  const stats = await dashboardService.getDashboardStats();
  return res.status(200).json({
    success: true,
    message: "Dashboard stats fetched successfully",
    error: false,
    data: stats
  });
});
