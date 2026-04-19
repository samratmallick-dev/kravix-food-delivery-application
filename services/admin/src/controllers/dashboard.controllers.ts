import { Response } from "express";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { AdminRequest } from "../middleware/isAdminAuthenticated.js";
import { User } from "../models/User.js";
import { Restaurant } from "../models/Restaurant.js";
import { Rider } from "../models/Rider.js";
import { Order } from "../models/Order.js";

export const getDashboard = TryCatch(async (_req: AdminRequest, res: Response) => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [
            usersByRole,
            restaurantStats,
            riderStats,
            ordersByStatus,
            revenueResult,
            todayOrdersResult,
      ] = await Promise.all([
            User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
            Restaurant.aggregate([{ $group: { _id: "$isVerified", count: { $sum: 1 } } }]),
            Rider.aggregate([{ $group: { _id: "$isVerified", count: { $sum: 1 } } }]),
            Order.aggregate([{ $match: { paymentStatus: "paid" } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
            Order.aggregate([
                  { $match: { paymentStatus: "paid" } },
                  { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
            ]),
            Order.aggregate([
                  { $match: { createdAt: { $gte: todayStart } } },
                  {
                        $group: {
                              _id: null,
                              count: { $sum: 1 },
                              revenue: {
                                    $sum: {
                                          $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$totalAmount", 0],
                                    },
                              },
                        },
                  },
            ]),
      ]);

      const users = usersByRole.reduce<Record<string, number>>((acc, cur) => {
            acc[cur._id ?? "unassigned"] = cur.count;
            return acc;
      }, {});

      const restaurants = restaurantStats.reduce<Record<string, number>>((acc, cur) => {
            acc[cur._id ? "verified" : "unverified"] = cur.count;
            return acc;
      }, {});

      const riders = riderStats.reduce<Record<string, number>>((acc, cur) => {
            acc[cur._id ? "verified" : "unverified"] = cur.count;
            return acc;
      }, {});

      const orders = ordersByStatus.reduce<Record<string, number>>((acc, cur) => {
            acc[cur._id] = cur.count;
            return acc;
      }, {});

      const totalRevenue = revenueResult[0]?.totalRevenue ?? 0;
      const todayOrders = todayOrdersResult[0]?.count ?? 0;
      const todayRevenue = todayOrdersResult[0]?.revenue ?? 0;

      return res.status(200).json({
            success: true,
            message: "Dashboard stats fetched successfully",
            error: false,
            data: {
                  users,
                  restaurants,
                  riders,
                  orders,
                  totalRevenue,
                  today: { orders: todayOrders, revenue: todayRevenue },
            },
      });
});
