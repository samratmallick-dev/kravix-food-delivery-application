import { Response } from "express";
import axios from "axios";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { AdminRequest } from "../middleware/isAdminAuthenticated.js";
import { Order } from "../models/Order.js";

export const getAllOrders = TryCatch(
      async (req: AdminRequest, res: Response) => {
            const page = Math.max(1, parseInt(req.query["page"] as string) || 1);
            const limit = Math.min(100, parseInt(req.query["limit"] as string) || 20);
            const { status, paymentStatus, from, to } = req.query;

            const filter: Record<string, unknown> = {};
            if (status) filter["status"] = status;
            if (paymentStatus) filter["paymentStatus"] = paymentStatus;
            if (from || to) {
                  const dateFilter: Record<string, Date> = {};
                  if (from) dateFilter["$gte"] = new Date(from as string);
                  if (to) dateFilter["$lte"] = new Date(to as string);
                  filter["createdAt"] = dateFilter;
            }

            const [orders, total] = await Promise.all([
                  Order.find(filter)
                        .sort({ createdAt: -1 })
                        .skip((page - 1) * limit)
                        .limit(limit)
                        .lean(),
                  Order.countDocuments(filter),
            ]);

            return res.status(200).json({
                  success: true,
                  message: "Orders fetched successfully",
                  error: false,
                  data: {
                        orders,
                        total,
                        page,
                        pages: Math.ceil(total / limit),
                  },
            });
      },
);

export const getOrderById = TryCatch(
      async (req: AdminRequest, res: Response) => {
            const order = await Order.findById(req.params["orderId"]).lean();
            if (!order)
                  return res.status(404).json({
                        success: false,
                        message: "Order not found",
                        error: true,
                  });
            return res.status(200).json({
                  success: true,
                  message: "Order fetched successfully",
                  error: false,
                  data: order,
            });
      },
);

export const cancelOrder = TryCatch(
      async (req: AdminRequest, res: Response) => {
            const order = await Order.findOneAndUpdate(
                  { _id: req.params["orderId"], status: { $ne: "cancelled" } },
                  { status: "cancelled" },
                  { new: true },
            ).lean();

            if (!order) {
                  return res.status(404).json({
                        success: false,
                        message: "Order not found or already cancelled",
                        error: true,
                  });
            }
            const emitUrl = `${process.env.REALTIME_SOCKET_SERVICE_URI}/api/v1/socket/events`;
            const emitHeaders = { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! };
            const payload = { orderId: order._id.toString(), status: "cancelled" };

            const emits = [
                  axios.post(
                        emitUrl,
                        { event: "order:update", room: `User:${order.userId}`, payload },
                        { headers: emitHeaders },
                  ),
                  axios.post(
                        emitUrl,
                        {
                              event: "order:update",
                              room: `Restaurant:${order.restaurantId}`,
                              payload,
                        },
                        { headers: emitHeaders },
                  ),
            ];

            if (order.riderId) {
                  emits.push(
                        axios.post(
                              emitUrl,
                              { event: "order:update", room: `Rider:${order.riderId}`, payload },
                              { headers: emitHeaders },
                        ),
                  );
            }

            Promise.allSettled(emits).then((results) => {
                  results.forEach((r) => {
                        if (r.status === "rejected")
                              console.error("Socket emit failed:", r.reason?.message);
                  });
            });

            return res.status(200).json({
                  success: true,
                  message: "Order cancelled successfully",
                  error: false,
                  data: order,
            });
      },
);
