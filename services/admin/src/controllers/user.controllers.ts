import { Response, NextFunction } from "express";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { AdminRequest } from "../middleware/isAdminAuthenticated.js";
import { userModerationService } from "../services/index.js";
import { AdminResponseMapper } from "../mappers/admin-response.mapper.js";
import { successResponse, paginatedResponse } from "../utils/response.js";

export const getAllUsers = TryCatch(async (req: AdminRequest, res: Response, next: NextFunction) => {
  const page = Math.max(1, parseInt(req.query["page"] as string) || 1);
  const limit = Math.min(100, parseInt(req.query["limit"] as string) || 20);
  const role = req.query["role"] as string | undefined;

  const { users, total } = await userModerationService.getAllUsers(page, limit, role);
  const dtos = users.map((u) => AdminResponseMapper.toUserDto(u, (u as any).riderPicture));
  return paginatedResponse(res, 200, "Users fetched successfully", dtos, page, limit, total);
});

export const getUserById = TryCatch(async (req: AdminRequest, res: Response, next: NextFunction) => {
  const userId = req.params["userId"] as string;
  const user = await userModerationService.getUserById(userId);
  return successResponse(res, 200, "User fetched successfully", AdminResponseMapper.toUserDto(user));
});

export const blockUser = TryCatch(async (req: AdminRequest, res: Response, next: NextFunction) => {
  const userId = req.params["userId"] as string;
  const user = await userModerationService.blockUser(userId);
  return successResponse(res, 200, user.isBlocked ? "User blocked for 7 days" : "User unblocked", {
    isBlocked: user.isBlocked,
    blockedUntil: user.blockedUntil
  });
});
