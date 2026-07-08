import { Request, Response, NextFunction } from "express";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { AdminValidator } from "../validators/admin.validator.js";
import { adminService } from "../services/index.js";
import { successResponse } from "../utils/response.js";

export const adminLogin = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  const validData = AdminValidator.validateLogin(req.body);
  const token = await adminService.login(validData.email, validData.password);
  return successResponse(res, 200, "Admin login successful", { token });
});
