import { Response } from "express";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { AdminRequest } from "../middleware/isAdminAuthenticated.js";
import { Order } from "../models/Order.js";
import { Rider } from "../models/Rider.js";

const rangeToMs: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };

export const getAnalytics = TryCatch(async (req: AdminRequest, res: Response) => {
  const rangeKey = (req.query["range"] as string) || "30d";
  const days = rangeToMs[rangeKey] ?? 30;
  const from = new Date(Date.now() - days * 86400000);

  const [heatmapRaw, topRestaurantsRaw, topRidersRaw, retentionRaw, deliveryTrendRaw] = await Promise.all([
    // Heatmap: orders by day-of-week × hour
    Order.aggregate([
      { $match: { createdAt: { $gte: from }, paymentStatus: "paid" } },
      {
        $group: {
          _id: {
            dow: { $dayOfWeek: "$createdAt" }, // 1=Sun
            hour: { $hour: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
    ]),

    // Top 10 restaurants by revenue
    Order.aggregate([
      { $match: { createdAt: { $gte: from }, paymentStatus: "paid" } },
      { $group: { _id: "$restaurantId", name: { $first: "$restaurantName" }, revenue: { $sum: "$totalAmount" } } },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]),

    // Top 10 riders by deliveries
    Order.aggregate([
      { $match: { createdAt: { $gte: from }, status: "delivered", riderId: { $ne: null } } },
      { $group: { _id: "$riderId", name: { $first: "$riderName" }, deliveries: { $sum: 1 } } },
      { $sort: { deliveries: -1 } },
      { $limit: 10 },
    ]),

    // Retention: new vs returning customers by month
    Order.aggregate([
      { $match: { createdAt: { $gte: from }, paymentStatus: "paid" } },
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: "$userId",
          firstOrder: { $first: "$createdAt" },
          orderCount: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$firstOrder" },
            month: { $month: "$firstOrder" },
          },
          newCustomers: { $sum: 1 },
          returning: { $sum: { $cond: [{ $gt: ["$orderCount", 1] }, 1, 0] } },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),

    // Avg delivery time trend by day (placed → delivered)
    Order.aggregate([
      { $match: { createdAt: { $gte: from }, status: "delivered" } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          avgMs: {
            $avg: { $subtract: ["$updatedAt", "$createdAt"] as unknown as number },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]),
  ]);

  // Build 7×24 heatmap matrix (day 0=Sun, hour 0-23)
  const heatmap: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));
  for (const entry of heatmapRaw) {
    const dow = ((entry._id as { dow: number; hour: number }).dow - 1) % 7;
    const hour = (entry._id as { dow: number; hour: number }).hour;
    const row = heatmap[dow];
    if (row) row[hour] = entry.count as number;
  }

  const topRestaurants = topRestaurantsRaw.map((r) => ({ name: r.name ?? r._id, revenue: r.revenue }));
  const topRiders = topRidersRaw.map((r) => ({ name: r.name ?? r._id, deliveries: r.deliveries }));

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const retention = retentionRaw.map((r) => ({
    month: `${MONTHS[(r._id.month as number) - 1] ?? ""} ${r._id.year as number}`,
    newCustomers: r.newCustomers as number,
    returning: r.returning as number,
  }));

  const avgDeliveryTrend = (deliveryTrendRaw as Array<{ _id: { year: number; month: number; day: number }; avgMs: number }>).map((r) => ({
    date: `${r._id.year}-${String(r._id.month).padStart(2, "0")}-${String(r._id.day).padStart(2, "0")}`,
    avgMinutes: Math.round((r.avgMs ?? 0) / 60000),
  }));

  return res.status(200).json({
    success: true,
    message: "Analytics fetched successfully",
    error: false,
    data: { heatmap, topRestaurants, topRiders, retention, avgDeliveryTrend },
  });
});
