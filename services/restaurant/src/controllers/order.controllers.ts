import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/isAuthenticated.js";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { Address } from "../model/Address.js";
import { Cart } from "../model/Cart.js";
import { IMenuItem, MenuItem } from "../model/MenuItems.js";
import { Restaurant } from "../model/Restaurant.js";
import { IOrder, Order } from "../model/Order.js";
import axios from "axios";
import { publishEvent } from "../config/orderPublisher.js";
import { Coupon } from "../model/Coupon.js";
import { CouponUsage } from "../model/CouponUsage.js";

export const createOrder = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
      const user = req.user;
      if (!user) {
            return res.status(401).json({
                  success: false,
                  message: "Unauthorized User",
                  error: true
            });
      }

      const { paymentMethod, addressId, couponCode } = req.body;

      if (!addressId) {
            return res.status(400).json({
                  success: false,
                  message: "Address is required",
                  error: true
            });
      }

      const address = await Address.findOne({
            _id: addressId,
            userId: user._id
      });

      if (!address) {
            return res.status(404).json({
                  success: false,
                  message: "Address not found",
                  error: true
            });
      }

      const cartItem = await Cart.find({ userId: user._id })
            .populate<{ itemId: IMenuItem }>("itemId")
            .populate<{ restaurantId: IMenuItem }>("restaurantId");

      if (cartItem.length === 0) {
            return res.status(400).json({
                  success: false,
                  message: "Your cart is empty",
                  error: true
            });
      }

      const firstCartItem = cartItem[0];

      if (!firstCartItem || !firstCartItem.restaurantId) {
            return res.status(400).json({
                  success: false,
                  message: "Invalid Cart Item",
                  error: true
            });
      }

      const restaurantId = firstCartItem.restaurantId._id;

      const restaurant = await Restaurant.findById(restaurantId);

      if (!restaurant) {
            return res.status(404).json({
                  message: "No Restaurant found with this id",
                  success: false,
                  error: true
            });
      }

      if (!restaurant.isOpen) {
            return res.status(400).json({
                  message: "Restaurant is closed",
                  success: false,
                  error: true
            });
      }

      let subTotal = 0;

      const orderItems = cartItem.map((cart) => {
            const item = cart.itemId;

            if (!item) {
                  throw new Error("Invalid cart item");
            }

            const itemTotal = item.price * cart.quantity;
            subTotal += itemTotal;

            return {
                  itemId: item._id.toString(),
                  name: item.name,
                  price: item.price,
                  quantity: cart.quantity,
                  total: itemTotal
            };
      });

      const [longitude, latitude] = address.location.coordinates;
      const [restLng, restLat] = restaurant.autoLocation.coordinates;
      const toRad = (deg: number) => (deg * Math.PI) / 180;

      const dLat = toRad(latitude - restLat);
      const dLng = toRad(longitude - restLng);
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(restLat)) * Math.cos(toRad(latitude)) * Math.sin(dLng / 2) ** 2;
      const distance = +(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2);

      const deliveryFee = (() => {
            if (subTotal >= 250) return 0;
            return Math.ceil(distance <= 3 ? 35 : 35 + (distance - 3) * 9);
      })();

      const platformFee = 7;

      let discountAmount = 0;
      if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode.trim().toUpperCase(), isActive: true });
            if (coupon && new Date(coupon.expiryDate) >= new Date()) {
                  if (coupon.couponType === "global" || coupon.restaurantId === restaurantId.toString()) {
                        if (subTotal >= coupon.minOrderAmount) {
                              let usageValid = true;
                              if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
                                    usageValid = false;
                              }
                              if (coupon.perUserLimit > 0) {
                                    const count = await CouponUsage.countDocuments({ couponId: coupon._id, userId: user._id });
                                    if (count >= coupon.perUserLimit) {
                                          usageValid = false;
                                    }
                              }
                              if (usageValid) {
                                    if (coupon.discountType === "percentage") {
                                          discountAmount = (subTotal * coupon.discountValue) / 100;
                                          if (coupon.maxDiscountAmount > 0 && discountAmount > coupon.maxDiscountAmount) {
                                                discountAmount = coupon.maxDiscountAmount;
                                          }
                                    } else if (coupon.discountType === "flat") {
                                          discountAmount = coupon.discountValue;
                                    } else if (coupon.discountType === "free_delivery") {
                                          discountAmount = deliveryFee;
                                    }
                                    discountAmount = Math.round(discountAmount * 100) / 100;
                                    discountAmount = Math.min(discountAmount, subTotal);
                              }
                        }
                  }
            }
      }

      const discountedSubtotal = Math.max(0, subTotal - discountAmount);
      const foodGST = +(discountedSubtotal * 0.05).toFixed(2);
      const deliveryGST = +(deliveryFee * 0.18).toFixed(2);
      const totalGST = +(foodGST + deliveryGST).toFixed(2);
      const totalAmount = +(discountedSubtotal + deliveryFee + platformFee + totalGST).toFixed(2);

      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      const BASE_PAY = 35;
      const BASE_KM = 3;
      const PER_KM_RATE = 9;
      const riderAmount = Math.ceil(distance <= BASE_KM ? BASE_PAY : BASE_PAY + (distance - BASE_KM) * PER_KM_RATE);

      const order = await Order.create({
            userId: user._id.toString(),
            restaurantId: restaurantId.toString(),
            restaurantName: restaurant.name,
            riderId: null,
            riderPhoneNumber: null,
            riderName: null,
            distance: distance,
            riderAmount: riderAmount,
            items: orderItems,
            subtotal: subTotal,
            deliveryFee: deliveryFee,
            platformFee: platformFee,
            discountAmount: discountAmount,
            couponCode: couponCode ? couponCode.trim().toUpperCase() : null,
            totalAmount: totalAmount,
            addressId: addressId.toString(),
            deliveryAddress: {
                  formatedAddress: address.formatedAddress,
                  mobile: address.mobile,
                  customerName: user.name,
                  latitude: latitude,
                  longitude: longitude
            },
            paymentMethod: paymentMethod,
            paymentStatus: "pending",
            status: "placed",
            expiresAt: expiresAt
      });

      await Cart.deleteMany({ userId: user._id });

      return res.status(201).json({
            success: true,
            message: "Order placed successfully",
            data: {
                  orderId: order._id.toString(),
                  totalAmount: totalAmount,
                  paymentMethod: paymentMethod
            }
      });
});

export const fetchOrderForPayment = TryCatch(async (req, res) => {
      if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
            return res.status(403).json({
                  success: false,
                  message: "Forbidden: Invalid or missing internal key",
                  error: true
            });
      }

      const { id: orderId } = req.params;

      const order = await Order.findById(orderId);

      if (!order) {
            return res.status(404).json({
                  success: false,
                  message: "Order not found",
                  error: true
            });
      }

      if (order.paymentStatus !== "pending") {
            return res.status(400).json({
                  success: false,
                  message: "Payment already done for this order",
                  error: true
            });
      }

      return res.status(200).json({
            success: true,
            message: "Order fetched successfully",
            data: {
                  orderId: order._id.toString(),
                  totalAmount: order.totalAmount,
                  currency: "INR"
            }
      });
});

export const fetchRestaurantOrders = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
      const user = req.user;
      if (!user) {
            return res.status(401).json({
                  success: false,
                  message: "Unauthorized User",
                  error: true
            })
      }

      const { restaurantId } = req.params;
      if (!restaurantId) {
            return res.status(400).json({
                  success: false,
                  message: "Restaurant Id is required",
                  error: true
            })
      }

      const limit = req.query.limit ? Number(req.query.limit) : 0;

      const orders = await Order.find({
            restaurantId: restaurantId,
            paymentStatus: "paid"
      }).sort({ createdAt: -1 }).limit(limit);

      return res.status(200).json({
            success: true,
            message: "Orders fetched successfully",
            data: {
                  count: orders.length,
                  orders
            }
      });
});

const ALLOWED_STATUSES = ["accepted", "preparing", "ready_for_rider"] as const;

export const updateOrderStatus = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
      const user = req.user;
      if (!user) {
            return res.status(401).json({
                  success: false,
                  message: "Unauthorized User",
                  error: true
            })
      }

      const { status } = req.body;
      if (!ALLOWED_STATUSES.includes(status)) {
            return res.status(400).json({
                  success: false,
                  message: "Invalid order status",
                  error: true
            });
      }

      const { orderId } = req.params;
      const order = await Order.findById(orderId);
      if (!order) {
            return res.status(404).json({
                  success: false,
                  message: "Order not found",
                  error: true
            });
      }

      if (order.paymentStatus !== "paid") {
            return res.status(400).json({
                  success: false,
                  message: "Order not completed",
                  error: true
            });
      }

      const restaurant = await Restaurant.findById(order.restaurantId);

      if (restaurant?.ownerId !== user._id.toString()) {
            return res.status(403).json({
                  success: false,
                  message: "Access denied. You don't have permission to update this order.",
                  error: true
            });
      }

      order.status = status;
      await order.save();

      const emitUrl = `${process.env.REALTIME_SOCKET_SERVICE_URI!}/api/v1/socket/events`;
      const emitHeaders = { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! };
      const statusPayload = { orderId: order._id, status: order.status };

      await Promise.all([
            axios.post(emitUrl, { event: "order:update", room: `User:${order.userId}`, payload: statusPayload }, { headers: emitHeaders }),
            axios.post(emitUrl, { event: "order:update", room: "Admin", payload: statusPayload }, { headers: emitHeaders }),
      ]);

      if (status === "ready_for_rider") {
            await publishEvent("ORDER_READY_FOR_RIDER", {
                  orderId: orderId?.toString(),
                  restaurantId: restaurant._id.toString(),
                  location: restaurant.autoLocation
            });

      }



      return res.status(200).json({
            success: true,
            error: false,
            message: "Order status updated successfully",
            data: order
      });
});

export const getMyOrders = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
      const user = req.user;
      if (!user) {
            return res.status(401).json({
                  success: false,
                  message: "Unauthorized User",
                  error: true
            })
      }

      const orders = await Order.find({
            userId: user._id.toString(),
            paymentStatus: "paid"
      }).sort({ createdAt: -1 });

      return res.status(200).json({
            success: true,
            message: "Orders fetched successfully",
            data: {
                  count: orders.length,
                  orders
            }
      });
});

export const getSingleOrder = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
      const user = req.user;
      if (!user) {
            return res.status(401).json({
                  success: false,
                  message: "Unauthorized User",
                  error: true
            })
      }

      const { orderId } = req.params;

      const order = await Order.findById(orderId);
      if (!order) {
            return res.status(404).json({
                  success: false,
                  message: "Order not found",
                  error: true
            });
      }

      if (order.userId !== user._id.toString()) {
            return res.status(403).json({
                  success: false,
                  message: "Access denied. You don't have permission to view this order.",
                  error: true
            });
      }

      return res.status(200).json({
            success: true,
            message: "Order fetched successfully",
            data: order
      });
});

export const assignRiderToOrder = TryCatch(async (req, res) => {
      if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
            return res.status(403).json({
                  success: false,
                  message: "Forbidden: Invalid or missing internal key",
                  error: true
            });
      }

      const { orderId, riderId, riderUserId, riderName, riderPhoneNumber } = req.body;

      const order = await Order.findById(orderId);
      if (!order) {
            return res.status(404).json({
                  success: false,
                  message: "Order not found",
                  error: true
            });
      }

      if (order.riderId !== null) {
            return res.status(400).json({
                  success: false,
                  message: "Rider already assigned to this order",
                  error: true
            });
      }

      const updateOrderForAssignRider = await Order.findOneAndUpdate(
            { _id: orderId, riderId: { $eq: null } },
            {
                  riderId: riderId,
                  riderName: riderName,
                  riderPhoneNumber: riderPhoneNumber,
                  status: "rider_assigned"
            },
            { new: true }
      );

      const assignPayload = { orderId: orderId.toString(), status: "rider_assigned" };
      const emitOpts = { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! } };
      const emitUrl = `${process.env.REALTIME_SOCKET_SERVICE_URI!}/api/v1/socket/events`;

      await Promise.all([
            axios.post(emitUrl, { event: "order:update", room: `User:${order.userId}`, payload: assignPayload }, emitOpts),
            axios.post(emitUrl, { event: "order:update", room: `Restaurant:${order.restaurantId}`, payload: assignPayload }, emitOpts),
            axios.post(emitUrl, { event: "order:update", room: `Rider:${riderUserId}`, payload: assignPayload }, emitOpts),
            axios.post(emitUrl, { event: "order:update", room: "Admin", payload: assignPayload }, emitOpts),
      ]);

      return res.status(200).json({
            success: true,
            error: false,
            message: "Rider assigned to order successfully",
            data: updateOrderForAssignRider
      });
});

export const getCurrentOrdersForRiders = TryCatch(async (req, res) => {
      if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
            return res.status(403).json({
                  success: false,
                  message: "Forbidden: Invalid or missing internal key",
                  error: true
            });
      }

      const { riderId } = req.query;
      if (!riderId) {
            return res.status(400).json({
                  success: false,
                  message: "Rider Id is required",
                  error: true
            })
      }

      const order = await Order.findOne({
            riderId: riderId as string,
            status: { $ne: "delivered" },
            paymentStatus: "paid"
      }).populate("restaurantId");

      if (!order) {
            return res.status(404).json({
                  success: false,
                  message: "No current order found for this rider",
                  error: true,
                  data: null
            });
      }

      return res.status(200).json({
            success: true,
            message: "Current orders for riders fetched successfully",
            data: order
      });
});

export const updateOrderStatusByRider = TryCatch(async (req, res) => {
      if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
            return res.status(403).json({
                  success: false,
                  message: "Forbidden: Invalid or missing internal key",
                  error: true
            });
      }

      const { orderId, riderId, riderLat, riderLng } = req.body;

      if (!riderId) {
            return res.status(400).json({
                  success: false,
                  message: "Rider ID is required",
                  error: true
            });
      }

      const order = await Order.findById(orderId);
      if (!order) {
            return res.status(404).json({
                  success: false,
                  message: "Order not found",
                  error: true
            });
      }

      if (order.riderId !== riderId) {
            return res.status(403).json({
                  success: false,
                  message: "Access denied. You are not assigned to this order.",
                  error: true
            });
      }

      const DELIVERY_PROXIMITY_METERS = 100;

      const haversineMeters = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
            const toRad = (d: number) => (d * Math.PI) / 180;
            const dLat = toRad(lat2 - lat1);
            const dLng = toRad(lng2 - lng1);
            const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
            return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      };

      const RIDER_STATUS_TRANSITIONS: Record<string, IOrder["status"]> = {
            rider_assigned: "picked_up",
            ready_for_rider: "picked_up",
            picked_up: "out_for_delivery",
            out_for_delivery: "reached_delivery_location",
            reached_delivery_location: "delivered",
      };

      const nextStatus = RIDER_STATUS_TRANSITIONS[order.status];

      if (order.status === "reached_delivery_location") {
            if (riderLat === undefined || riderLng === undefined) {
                  return res.status(400).json({
                        success: false,
                        message: "Rider location is required to confirm delivery",
                        error: true
                  });
            }

            const distanceMeters = haversineMeters(
                  Number(riderLat), Number(riderLng),
                  order.deliveryAddress.latitude, order.deliveryAddress.longitude
            );

            if (distanceMeters > DELIVERY_PROXIMITY_METERS) {
                  return res.status(403).json({
                        success: false,
                        message: `You must be within ${DELIVERY_PROXIMITY_METERS}m of the delivery address to confirm delivery. Currently ${Math.round(distanceMeters)}m away.`,
                        error: true
                  });
            }
      }

      if (nextStatus) {
            order.status = nextStatus;
            await order.save();

            const socketPayload = { orderId: order._id.toString(), status: order.status };
            const riderEmitUrl = `${process.env.REALTIME_SOCKET_SERVICE_URI!}/api/v1/socket/events`;
            const riderEmitHeaders = { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! };

            await Promise.all([
                  axios.post(riderEmitUrl, { event: "order:update", room: `Restaurant:${order.restaurantId}`, payload: socketPayload }, { headers: riderEmitHeaders }),
                  axios.post(riderEmitUrl, { event: "order:update", room: `User:${order.userId}`, payload: socketPayload }, { headers: riderEmitHeaders }),
                  axios.post(riderEmitUrl, { event: "order:update", room: "Admin", payload: socketPayload }, { headers: riderEmitHeaders }),
            ]);

            return res.status(200).json({
                  success: true,
                  error: false,
                  message: "Order status updated successfully",
                  data: order
            });
      }

      return res.status(400).json({
            success: false,
            error: true,
            message: `Cannot update order with status: ${order.status}`
      });
});

export const setOrderOtp = TryCatch(async (req, res) => {
      if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
            return res.status(403).json({ success: false, message: "Forbidden", error: true });
      }
      const { orderId, otp } = req.body;
      await Order.findByIdAndUpdate(orderId, { deliveryOtp: otp ?? null });
      return res.status(200).json({ success: true, error: false });
});

export const getOrderByIdInternal = TryCatch(async (req, res) => {
      if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
            return res.status(403).json({ success: false, message: "Forbidden", error: true });
      }

      const order = await Order.findById(req.params.orderId).select("status riderId userId");
      if (!order) {
            return res.status(404).json({ success: false, message: "Order not found", error: true });
      }

      return res.status(200).json({ success: true, error: false, data: order });
});

export const getRestaurantSalesStats = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
      const user = req.user;
      if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized User", error: true });
      }

      const { restaurantId } = req.params;

      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant || restaurant.ownerId !== user._id.toString()) {
            return res.status(403).json({ success: false, message: "Access denied", error: true });
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const baseMatch = { restaurantId, status: "delivered", paymentStatus: "paid" };

      const [summary, salesTrend, topItems, orderDistribution] = await Promise.all([
            Order.aggregate([
                  { $match: baseMatch },
                  { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" }, totalOrders: { $sum: 1 }, avgOrderValue: { $avg: "$totalAmount" } } }
            ]),
            Order.aggregate([
                  { $match: { ...baseMatch, createdAt: { $gte: thirtyDaysAgo } } },
                  { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: "$totalAmount" }, orders: { $sum: 1 } } },
                  { $sort: { _id: 1 } },
                  { $project: { _id: 0, date: "$_id", revenue: 1, orders: 1 } }
            ]),
            Order.aggregate([
                  { $match: baseMatch },
                  { $unwind: "$items" },
                  { $group: { _id: "$items.name", totalQuantity: { $sum: "$items.quantity" }, totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } } } },
                  { $sort: { totalQuantity: -1 } },
                  { $limit: 5 },
                  { $project: { _id: 0, name: "$_id", totalQuantity: 1, totalRevenue: 1 } }
            ]),
            Order.aggregate([
                  { $match: { restaurantId, paymentStatus: "paid" } },
                  { $group: { _id: "$status", count: { $sum: 1 } } },
                  { $project: { _id: 0, status: "$_id", count: 1 } }
            ])
      ]);

      const s = summary[0] ?? { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 };

      return res.status(200).json({
            success: true,
            message: "Sales stats fetched successfully",
            data: {
                  summary: { totalRevenue: s.totalRevenue, totalOrders: s.totalOrders, avgOrderValue: +s.avgOrderValue.toFixed(2) },
                  salesTrend,
                  topItems,
                  orderDistribution
            }
      });
});

export const getDeliveredOrdersByRider = TryCatch(async (req, res) => {
      if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
            return res.status(403).json({ success: false, message: "Forbidden", error: true });
      }

      const { riderId } = req.query;
      if (!riderId) {
            return res.status(400).json({ success: false, message: "Rider Id is required", error: true });
      }

      const orders = await Order.find({
            riderId: riderId as string,
            status: "delivered",
            paymentStatus: "paid"
      }).sort({ createdAt: -1 });

      return res.status(200).json({
            success: true,
            message: "Delivery history fetched successfully",
            data: { count: orders.length, orders }
      });
});

export const reorderItems = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
      const user = req.user;
      if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized User", error: true });
      }

      const { orderId } = req.params;

      const order = await Order.findById(orderId);
      if (!order) {
            return res.status(404).json({ success: false, message: "Order not found", error: true });
      }

      if (order.userId !== user._id.toString()) {
            return res.status(403).json({ success: false, message: "Access denied", error: true });
      }

      if (order.status !== "delivered") {
            return res.status(400).json({ success: false, message: "Only delivered orders can be reordered", error: true });
      }

      const restaurant = await Restaurant.findById(order.restaurantId);
      if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found", error: true });
      }

      if (!restaurant.isOpen) {
            return res.status(400).json({ success: false, message: "This restaurant is currently closed. Please try again later.", error: true });
      }

      const itemIds = order.items.map((i) => i.itemId);
      const menuItems = await MenuItem.find({ _id: { $in: itemIds }, restaurantId: order.restaurantId, isAvailable: true });
      const availableItemMap = new Map(menuItems.map((m) => [m._id.toString(), m]));

      const unavailableNames = order.items
            .filter((i) => !availableItemMap.has(i.itemId))
            .map((i) => i.name);

      const availableItems = order.items.filter((i) => availableItemMap.has(i.itemId));

      if (availableItems.length === 0) {
            return res.status(400).json({ success: false, message: "None of the items from this order are currently available.", error: true });
      }

      await Cart.deleteMany({ userId: user._id });

      const cartDocs = availableItems.map((item) => ({
            userId: user._id,
            restaurantId: order.restaurantId,
            itemId: item.itemId,
            quantity: item.quantity,
      }));

      await Cart.insertMany(cartDocs);

      return res.status(200).json({
            success: true,
            error: false,
            message: unavailableNames.length > 0
                  ? `Cart updated. Some items are no longer available: ${unavailableNames.join(", ")}.`
                  : "Cart updated with your previous order items.",
            data: { cartCount: availableItems.reduce((sum, i) => sum + i.quantity, 0), unavailableItems: unavailableNames }
      });
});
