import { Response } from "express";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { AdminRequest } from "../middleware/isAdminAuthenticated.js";
import { Order } from "../models/Order.js";

const PLATFORM_COMMISSION_RATE = 0.10; // 10% — configurable

export const getFinances = TryCatch(async (req: AdminRequest, res: Response) => {
  const { from, to } = req.query;

  const dateFilter: Record<string, Date> = {};
  if (from) dateFilter["$gte"] = new Date(from as string);
  if (to) dateFilter["$lte"] = new Date(to as string);

  const matchStage: Record<string, unknown> = { paymentStatus: "paid" };
  if (Object.keys(dateFilter).length) matchStage["createdAt"] = dateFilter;

  const [restaurantRows, riderRows] = await Promise.all([
    // Per-restaurant aggregation
    Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$restaurantId",
          entityName: { $first: "$restaurantName" },
          totalOrders: { $sum: 1 },
          grossRevenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { grossRevenue: -1 } },
    ]),

    // Per-rider aggregation
    Order.aggregate([
      { $match: { ...matchStage, riderId: { $ne: null }, status: "delivered" } },
      {
        $group: {
          _id: "$riderId",
          entityName: { $first: "$riderName" },
          totalOrders: { $sum: 1 },
          grossRevenue: { $sum: "$riderAmount" },
        },
      },
      { $sort: { grossRevenue: -1 } },
    ]),
  ]);

  const buildRows = (raw: typeof restaurantRows, type: "restaurant" | "rider") =>
    raw.map((r) => {
      const gross = r.grossRevenue ?? 0;
      const commission = Math.round(gross * PLATFORM_COMMISSION_RATE);
      return {
        entityId: String(r._id),
        entityName: r.entityName ?? String(r._id),
        entityType: type,
        totalOrders: r.totalOrders,
        grossRevenue: gross,
        platformCommission: commission,
        netPayout: gross - commission,
        payoutStatus: "pending" as const, // real payout tracking would need a Payout model
      };
    });

  const rows = [...buildRows(restaurantRows, "restaurant"), ...buildRows(riderRows, "rider")];

  const totalPayouts = rows.reduce((s, r) => s + r.netPayout, 0);
  const platformCommission = rows.reduce((s, r) => s + r.platformCommission, 0);
  const pendingSettlements = rows
    .filter((r) => r.payoutStatus === "pending")
    .reduce((s, r) => s + r.netPayout, 0);

  return res.status(200).json({
    success: true,
    message: "Finances fetched successfully",
    error: false,
    data: { totalPayouts, platformCommission, pendingSettlements, rows },
  });
});

export const exportFinancesCSV = TryCatch(async (req: AdminRequest, res: Response) => {
  const { from, to } = req.body as { from?: string; to?: string };

  const dateFilter: Record<string, Date> = {};
  if (from) dateFilter["$gte"] = new Date(from);
  if (to) dateFilter["$lte"] = new Date(to);

  const matchStage: Record<string, unknown> = { paymentStatus: "paid" };
  if (Object.keys(dateFilter).length) matchStage["createdAt"] = dateFilter;

  const orders = await Order.find(matchStage)
    .select("restaurantId restaurantName riderId riderName totalAmount riderAmount status createdAt")
    .lean()
    .cursor();

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="finances-${Date.now()}.csv"`);

  res.write("Order ID,Restaurant,Rider,Total Amount,Rider Amount,Status,Date\n");

  for await (const order of orders) {
    const row = [
      order._id.toString(),
      `"${(order.restaurantName ?? "").replace(/"/g, '""')}"`,
      `"${(order.riderName ?? "").replace(/"/g, '""')}"`,
      order.totalAmount,
      order.riderAmount,
      order.status,
      new Date(order.createdAt).toISOString(),
    ].join(",");
    res.write(row + "\n");
  }

  res.end();
});
