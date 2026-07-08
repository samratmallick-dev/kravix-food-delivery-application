import { Response, NextFunction } from "express";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { AdminRequest } from "../middleware/isAdminAuthenticated.js";
import { riderModerationService } from "../services/index.js";
import { AdminResponseMapper } from "../mappers/admin-response.mapper.js";
import { AdminValidator } from "../validators/admin.validator.js";
import { successResponse, paginatedResponse } from "../utils/response.js";

export const getAllRiders = TryCatch(async (req: AdminRequest, res: Response, next: NextFunction) => {
  const page = Math.max(1, parseInt(req.query["page"] as string) || 1);
  const limit = Math.min(100, parseInt(req.query["limit"] as string) || 20);
  const isVerified = req.query["isVerified"] as string | undefined;
  const isAvailable = req.query["isAvailable"] as string | undefined;

  const { riders, total } = await riderModerationService.getAllRiders(page, limit, isVerified, isAvailable);
  return paginatedResponse(res, 200, "Riders fetched successfully", riders.map(AdminResponseMapper.toRiderDto), page, limit, total);
});

export const getRiderById = TryCatch(async (req: AdminRequest, res: Response, next: NextFunction) => {
  const riderId = req.params["riderId"] as string;
  const rider = await riderModerationService.getRiderById(riderId);
  return successResponse(res, 200, "Rider fetched successfully", AdminResponseMapper.toRiderDto(rider));
});

export const verifyRider = TryCatch(async (req: AdminRequest, res: Response, next: NextFunction) => {
  const riderId = req.params["riderId"] as string;
  const validData = AdminValidator.validateVerify(req.body);
  const rider = await riderModerationService.verifyRider(riderId, validData.isVerified);
  return successResponse(res, 200, `Rider ${rider.isVerified ? "verified" : "unverified"} successfully`, AdminResponseMapper.toRiderDto(rider));
});

export const deleteRider = TryCatch(async (req: AdminRequest, res: Response, next: NextFunction) => {
  const riderId = req.params["riderId"] as string;
  await riderModerationService.deleteRider(riderId);
  return successResponse(res, 200, "Rider deleted successfully");
});
