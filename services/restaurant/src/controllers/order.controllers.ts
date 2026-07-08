import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/isAuthenticated.js";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { orderService } from "../services/index.js";
import { RestaurantResponseMapper } from "../mappers/restaurant-response.mapper.js";
import { RestaurantValidator } from "../validators/restaurant.validator.js";
import { AuthorizationError, ValidationError } from "../utils/errors.js";
import { PlaceOrderRequestDto } from "../dto/restaurant.dto.js";
import { successResponse, errorResponse } from "../utils/response.js";

export const createOrder = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return errorResponse(res, 401, "User not authenticated", "UNAUTHORIZED");
  }

  const validData = RestaurantValidator.validatePlaceOrder(req.body);
  const dto: PlaceOrderRequestDto = {
    addressId: validData.addressId,
    items: validData.items,
    paymentMethod: validData.paymentMethod
  };
  if (validData.couponCode !== undefined) {
    dto.couponCode = validData.couponCode;
  }

  const result = await orderService.createOrder(user._id.toString(), user.name, dto);
  return successResponse(res, 201, "Order placed successfully", result);
});

export const getMyOrders = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return errorResponse(res, 401, "Unauthorized user", "UNAUTHORIZED");
  }

  const orders = await orderService.getMyOrders(user._id.toString());
  const dtos = orders.map(RestaurantResponseMapper.toOrderDto);
  return successResponse(res, 200, "Orders fetched successfully", { count: dtos.length, orders: dtos });
});

export const getSingleOrder = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return errorResponse(res, 401, "Unauthorized user", "UNAUTHORIZED");
  }

  const orderId = req.params["orderId"] as string;
  const order = await orderService.getOrderById(orderId);

  if (order.userId !== user._id.toString()) {
    throw new AuthorizationError("Access denied. You don't have permission to view this order.");
  }

  return successResponse(res, 200, "Order fetched successfully", RestaurantResponseMapper.toOrderDto(order));
});

export const cancelMyOrder = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return errorResponse(res, 401, "Unauthorized user", "UNAUTHORIZED");
  }

  const orderId = req.params["orderId"] as string;
  const order = await orderService.cancelMyOrder(user._id.toString(), orderId);
  return successResponse(res, 200, "Order cancelled successfully", RestaurantResponseMapper.toOrderDto(order));
});

export const reorderItems = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return errorResponse(res, 401, "Unauthorized user", "UNAUTHORIZED");
  }

  const orderId = req.params["orderId"] as string;
  const result = await orderService.reorderItems(user._id.toString(), orderId);

  const message = result.unavailableItems.length > 0
    ? `Cart updated. Some items are no longer available: ${result.unavailableItems.join(", ")}.`
    : "Cart updated with your previous order items.";

  return successResponse(res, 200, message, {
    cartCount: result.cartCount,
    unavailableItems: result.unavailableItems
  });
});

export const assignRiderToOrder = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { orderId, riderId, riderUserId, riderName, riderPhoneNumber } = req.body;
  const order = await orderService.assignRiderToOrder(
    orderId,
    riderId,
    riderUserId,
    riderName,
    Number(riderPhoneNumber)
  );
  return successResponse(res, 200, "Rider assigned to order successfully", RestaurantResponseMapper.toOrderDto(order));
});

export const getCurrentOrdersForRiders = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { riderId } = req.query;
  if (!riderId) {
    throw new ValidationError("Rider Id is required");
  }

  const order = await orderService.getCurrentOrdersForRiders(riderId as string);
  return successResponse(res, 200, "Current orders for riders fetched successfully", RestaurantResponseMapper.toOrderDto(order));
});

export const updateOrderStatusByRider = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { orderId, riderId, riderLat, riderLng } = req.body;
  if (!riderId) {
    throw new ValidationError("Rider ID is required");
  }

  const order = await orderService.updateOrderStatusByRider(
    orderId,
    riderId,
    riderLat !== undefined ? Number(riderLat) : undefined,
    riderLng !== undefined ? Number(riderLng) : undefined
  );
  return successResponse(res, 200, "Order status updated successfully", RestaurantResponseMapper.toOrderDto(order));
});

export const getDeliveredOrdersByRider = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { riderId } = req.query;
  if (!riderId) {
    throw new ValidationError("Rider Id is required");
  }

  const orders = await orderService.getDeliveredOrdersByRider(riderId as string);
  const dtos = orders.map(RestaurantResponseMapper.toOrderDto);
  return successResponse(res, 200, "Delivery history fetched successfully", { count: dtos.length, orders: dtos });
});

export const setOrderOtp = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { orderId, otp } = req.body;
  await orderService.setOrderOtp(orderId, Number(otp));
  return successResponse(res, 200, "OTP set successfully");
});

export const getOrderByIdInternal = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const orderId = req.params["orderId"] as string;
  const order = await orderService.getOrderByIdInternal(orderId);
  return successResponse(res, 200, "Order fetched successfully", {
    _id: order.id,
    status: order.status,
    riderId: order.riderId,
    userId: order.userId
  });
});

export const fetchRestaurantOrders = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return errorResponse(res, 401, "Unauthorized user", "UNAUTHORIZED");
  }

  const { restaurantId } = req.params;
  const orders = await orderService.fetchRestaurantOrders(restaurantId as string);
  return successResponse(res, 200, "Restaurant orders fetched successfully", orders.map(RestaurantResponseMapper.toOrderDto));
});

export const getRestaurantSalesStats = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return errorResponse(res, 401, "Unauthorized user", "UNAUTHORIZED");
  }

  const { restaurantId } = req.params;
  const stats = await orderService.getRestaurantSalesStats(restaurantId as string);
  return successResponse(res, 200, "Sales stats fetched successfully", stats);
});

export const updateOrderStatus = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return errorResponse(res, 401, "Unauthorized user", "UNAUTHORIZED");
  }

  const { orderId } = req.params;
  const { status } = req.body;
  const order = await orderService.updateOrderStatus(user.restaurantId || "", orderId as string, status);
  return successResponse(res, 200, "Order status updated successfully", RestaurantResponseMapper.toOrderDto(order));
});

export const fetchOrderForPayment = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const orderId = req.params["id"] as string;
  const order = await orderService.fetchOrderForPayment(orderId);
  return successResponse(res, 200, "Order fetched successfully", {
    orderId: order.id,
    totalAmount: order.totalAmount,
    currency: "INR"
  });
});

export const confirmCodPayment = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { orderId, codPaymentMode } = req.body;
  if (!orderId) {
    throw new ValidationError("Order ID is required");
  }
  if (!codPaymentMode) {
    throw new ValidationError("Payment mode is required");
  }

  const order = await orderService.confirmCodPayment(orderId as string, codPaymentMode as string);
  return successResponse(res, 200, "COD payment confirmed successfully", RestaurantResponseMapper.toOrderDto(order));
});
