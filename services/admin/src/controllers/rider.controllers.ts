import { Response, NextFunction } from "express";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { AdminRequest } from "../middleware/isAdminAuthenticated.js";
import { riderModerationService } from "../services/index.js";
import { AdminResponseMapper } from "../mappers/admin-response.mapper.js";
import { AdminValidator } from "../validators/admin.validator.js";

export const getAllRiders = TryCatch(async (req: AdminRequest, res: Response, next: NextFunction) => {
  const page = Math.max(1, parseInt(req.query["page"] as string) || 1);
  const limit = Math.min(100, parseInt(req.query["limit"] as string) || 20);
  const isVerified = req.query["isVerified"] as string | undefined;
  const isAvailable = req.query["isAvailable"] as string | undefined;

  const { riders, total } = await riderModerationService.getAllRiders(page, limit, isVerified, isAvailable);
  const dtos = riders.map(AdminResponseMapper.toRiderDto);

  return res.status(200).json({
    success: true,
    message: "Riders fetched successfully",
    error: false,
    data: {
      riders: dtos,
      total,
      page,
      pages: Math.ceil(total / limit)
    }
  });
});

export const getRiderById = TryCatch(async (req: AdminRequest, res: Response, next: NextFunction) => {
  const riderId = req.params["riderId"] as string;
  const rider = await riderModerationService.getRiderById(riderId);
  return res.status(200).json({
    success: true,
    message: "Rider fetched successfully",
    error: false,
    data: AdminResponseMapper.toRiderDto(rider)
  });
});

export const verifyRider = TryCatch(async (req: AdminRequest, res: Response, next: NextFunction) => {
  const riderId = req.params["riderId"] as string;
  const validData = AdminValidator.validateVerify(req.body);
  const rider = await riderModerationService.verifyRider(riderId, validData.isVerified);
  return res.status(200).json({
    success: true,
    message: `Rider ${rider.isVerified ? "verified" : "unverified"} successfully`,
    error: false,
    data: AdminResponseMapper.toRiderDto(rider)
  });
});

export const deleteRider = TryCatch(async (req: AdminRequest, res: Response, next: NextFunction) => {
  const riderId = req.params["riderId"] as string;
  await riderModerationService.deleteRider(riderId);
  return res.status(200).json({
    success: true,
    message: "Rider deleted successfully",
    error: false,
    data: {}
  });
});
