import { Response, NextFunction } from "express";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { AdminRequest } from "../middleware/isAdminAuthenticated.js";
import { orderModerationService } from "../services/index.js";
import { AdminResponseMapper } from "../mappers/admin-response.mapper.js";

export const getAllOrders = TryCatch(async (req: AdminRequest, res: Response, next: NextFunction) => {
  const page = Math.max(1, parseInt(req.query["page"] as string) || 1);
  const limit = Math.min(100, parseInt(req.query["limit"] as string) || 20);
  const status = req.query["status"] as string | undefined;

  const { orders, total } = await orderModerationService.getAllOrders(page, limit, status);
  const dtos = orders.map(AdminResponseMapper.toOrderDto);

  return res.status(200).json({
    success: true,
    message: "Orders fetched successfully",
    error: false,
    data: {
      orders: dtos,
      total,
      page,
      pages: Math.ceil(total / limit)
    }
  });
});

export const getOrderById = TryCatch(async (req: AdminRequest, res: Response, next: NextFunction) => {
  const orderId = req.params["orderId"] as string;
  const order = await orderModerationService.getOrderById(orderId);
  return res.status(200).json({
    success: true,
    message: "Order fetched successfully",
    error: false,
    data: AdminResponseMapper.toOrderDto(order)
  });
});

export const cancelOrder = TryCatch(async (req: AdminRequest, res: Response, next: NextFunction) => {
  const orderId = req.params["orderId"] as string;
  const order = await orderModerationService.cancelOrder(orderId);
  return res.status(200).json({
    success: true,
    message: "Order cancelled successfully",
    error: false,
    data: AdminResponseMapper.toOrderDto(order)
  });
});
