import { Response, NextFunction } from "express";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { AdminRequest } from "../middleware/isAdminAuthenticated.js";
import { orderModerationService } from "../services/index.js";
import { AdminResponseMapper } from "../mappers/admin-response.mapper.js";
import { successResponse, paginatedResponse } from "../utils/response.js";

export const getAllOrders = TryCatch(async (req: AdminRequest, res: Response, next: NextFunction) => {
  const page = Math.max(1, parseInt(req.query["page"] as string) || 1);
  const limit = Math.min(100, parseInt(req.query["limit"] as string) || 20);
  const status = req.query["status"] as string | undefined;

  const { orders, total } = await orderModerationService.getAllOrders(page, limit, status);
  return paginatedResponse(res, 200, "Orders fetched successfully", orders.map(AdminResponseMapper.toOrderDto), page, limit, total);
});

export const getOrderById = TryCatch(async (req: AdminRequest, res: Response, next: NextFunction) => {
  const orderId = req.params["orderId"] as string;
  const order = await orderModerationService.getOrderById(orderId);
  return successResponse(res, 200, "Order fetched successfully", AdminResponseMapper.toOrderDto(order));
});

export const cancelOrder = TryCatch(async (req: AdminRequest, res: Response, next: NextFunction) => {
  const orderId = req.params["orderId"] as string;
  const order = await orderModerationService.cancelOrder(orderId);
  return successResponse(res, 200, "Order cancelled successfully", AdminResponseMapper.toOrderDto(order));
});
