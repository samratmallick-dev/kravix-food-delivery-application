import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/isAuthenticated.js";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { orderService } from "../services/index.js";
import { RestaurantResponseMapper } from "../mappers/restaurant-response.mapper.js";
import { RestaurantValidator } from "../validators/restaurant.validator.js";
import { AuthorizationError, ValidationError } from "../utils/errors.js";
import { PlaceOrderRequestDto } from "../dto/restaurant.dto.js";

export const createOrder = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "User not authenticated", success: false, error: true });
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

  return res.status(201).json({
    success: true,
    message: "Order placed successfully",
    data: result
  });
});

export const getMyOrders = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized User", success: false, error: true });
  }

  const orders = await orderService.getMyOrders(user._id.toString());
  const dtos = orders.map(RestaurantResponseMapper.toOrderDto);

  return res.status(200).json({
    success: true,
    message: "Orders fetched successfully",
    data: {
      count: dtos.length,
      orders: dtos
    }
  });
});

export const getSingleOrder = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized User", success: false, error: true });
  }

  const orderId = req.params["orderId"] as string;
  const order = await orderService.getOrderById(orderId);

  if (order.userId !== user._id.toString()) {
    throw new AuthorizationError("Access denied. You don't have permission to view this order.");
  }

  return res.status(200).json({
    success: true,
    message: "Order fetched successfully",
    data: RestaurantResponseMapper.toOrderDto(order)
  });
});

export const cancelMyOrder = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized User", success: false, error: true });
  }

  const orderId = req.params["orderId"] as string;
  const order = await orderService.cancelMyOrder(user._id.toString(), orderId);

  return res.status(200).json({
    success: true,
    error: false,
    message: "Order cancelled successfully",
    data: RestaurantResponseMapper.toOrderDto(order)
  });
});

export const reorderItems = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized User", success: false, error: true });
  }

  const orderId = req.params["orderId"] as string;
  const result = await orderService.reorderItems(user._id.toString(), orderId);

  return res.status(200).json({
    success: true,
    error: false,
    message: result.unavailableItems.length > 0
      ? `Cart updated. Some items are no longer available: ${result.unavailableItems.join(", ")}.`
      : "Cart updated with your previous order items.",
    data: {
      cartCount: result.cartCount,
      unavailableItems: result.unavailableItems
    }
  });
});

export const assignRiderToOrder = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    throw new AuthorizationError("Forbidden: Invalid or missing internal key");
  }

  const { orderId, riderId, riderUserId, riderName, riderPhoneNumber } = req.body;
  const order = await orderService.assignRiderToOrder(
    orderId,
    riderId,
    riderUserId,
    riderName,
    Number(riderPhoneNumber)
  );

  return res.status(200).json({
    success: true,
    error: false,
    message: "Rider assigned to order successfully",
    data: RestaurantResponseMapper.toOrderDto(order)
  });
});

export const getCurrentOrdersForRiders = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    throw new AuthorizationError("Forbidden: Invalid or missing internal key");
  }

  const { riderId } = req.query;
  if (!riderId) {
    throw new ValidationError("Rider Id is required");
  }

  const order = await orderService.getCurrentOrdersForRiders(riderId as string);

  return res.status(200).json({
    success: true,
    message: "Current orders for riders fetched successfully",
    data: RestaurantResponseMapper.toOrderDto(order)
  });
});

export const updateOrderStatusByRider = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    throw new AuthorizationError("Forbidden: Invalid or missing internal key");
  }

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

  return res.status(200).json({
    success: true,
    error: false,
    message: "Order status updated successfully",
    data: RestaurantResponseMapper.toOrderDto(order)
  });
});

export const getDeliveredOrdersByRider = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    throw new AuthorizationError("Forbidden: Invalid or missing internal key");
  }

  const { riderId } = req.query;
  if (!riderId) {
    throw new ValidationError("Rider Id is required");
  }

  const orders = await orderService.getDeliveredOrdersByRider(riderId as string);
  const dtos = orders.map(RestaurantResponseMapper.toOrderDto);

  return res.status(200).json({
    success: true,
    message: "Delivery history fetched successfully",
    data: {
      count: dtos.length,
      orders: dtos
    }
  });
});

export const setOrderOtp = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    throw new AuthorizationError("Forbidden");
  }

  const { orderId, otp } = req.body;
  await orderService.setOrderOtp(orderId, Number(otp));

  return res.status(200).json({ success: true, error: false });
});

export const getOrderByIdInternal = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    throw new AuthorizationError("Forbidden");
  }

  const orderId = req.params["orderId"] as string;
  const order = await orderService.getOrderByIdInternal(orderId);

  return res.status(200).json({
    success: true,
    error: false,
    data: {
      _id: order.id,
      status: order.status,
      riderId: order.riderId,
      userId: order.userId
    }
  });
});

export const fetchRestaurantOrders = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized User", success: false, error: true });
  }

  const { restaurantId } = req.params;
  const orders = await orderService.fetchRestaurantOrders(restaurantId as string);
  const dtos = orders.map(RestaurantResponseMapper.toOrderDto);

  return res.status(200).json({
    success: true,
    message: "Restaurant orders fetched successfully",
    data: dtos
  });
});

export const getRestaurantSalesStats = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized User", error: true });
  }

  const { restaurantId } = req.params;
  const stats = await orderService.getRestaurantSalesStats(restaurantId as string);

  return res.status(200).json({
    success: true,
    message: "Sales stats fetched successfully",
    data: stats
  });
});

export const updateOrderStatus = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized User", success: false, error: true });
  }

  const { orderId } = req.params;
  const { status } = req.body;

  const order = await orderService.updateOrderStatus(user.restaurantId || "", orderId as string, status);

  return res.status(200).json({
    success: true,
    error: false,
    message: "Order status updated successfully",
    data: RestaurantResponseMapper.toOrderDto(order)
  });
});

export const fetchOrderForPayment = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    throw new AuthorizationError("Forbidden: Invalid or missing internal key");
  }

  const orderId = req.params["id"] as string;
  const order = await orderService.fetchOrderForPayment(orderId);

  return res.status(200).json({
    success: true,
    message: "Order fetched successfully",
    data: {
      orderId: order.id,
      totalAmount: order.totalAmount,
      currency: "INR"
    }
  });
});

export const confirmCodPayment = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    throw new AuthorizationError("Forbidden: Invalid or missing internal key");
  }

  const { orderId, codPaymentMode } = req.body;
  if (!orderId) {
    throw new ValidationError("Order ID is required");
  }
  if (!codPaymentMode) {
    throw new ValidationError("Payment mode is required");
  }

  const order = await orderService.confirmCodPayment(orderId as string, codPaymentMode as string);

  return res.status(200).json({
    success: true,
    error: false,
    message: "COD payment confirmed successfully",
    data: RestaurantResponseMapper.toOrderDto(order)
  });
});
