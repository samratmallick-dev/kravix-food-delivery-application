import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/isAuthenticated.js";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { Address } from "../model/Address.js";
import { Cart } from "../model/Cart.js";
import { IMenuItem } from "../model/MenuItems.js";
import { Restaurant } from "../model/Restaurant.js";
import { Order } from "../model/Order.js";
import axios from "axios";

export const createOrder = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
      const user = req.user;
      if (!user) {
            return res.status(401).json({
                  success: false,
                  message: "Unauthorized User",
                  error: true
            });
      }

      const { paymentMethod, addressId } = req.body;

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
      const foodGST = +(subTotal * 0.05).toFixed(2);
      const deliveryGST = +(deliveryFee * 0.18).toFixed(2);
      const totalGST = +(foodGST + deliveryGST).toFixed(2);
      const totalAmount = subTotal + deliveryFee + platformFee + totalGST;

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
            totalAmount: totalAmount,
            addressId: addressId.toString(),
            deliveryAddress: {
                  formatedAddress: address.formatedAddress,
                  mobile: address.mobile,
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

      await axios.post(`${process.env.REALTIME_SOCKET_SERVICE_URI!}/api/v1/socket/emit`, {
            event: "order:update",
            room: `user:${order.userId}`,
            payload: {
                  orderId: order._id,
                  status: order.status
            }
      }, {
            headers: {
                  "x-internal-key": process.env.INTERNAL_SERVICE_KEY!
            }
      });

      return res.status(200).json({
            success: true,
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

      if(order.userId !== user._id.toString()) {
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