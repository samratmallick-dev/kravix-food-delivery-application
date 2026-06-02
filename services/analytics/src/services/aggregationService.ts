import { Order, Restaurant, User, Rider } from "../model/SharedModels.js";

const buildMatchStage = (
      startDate?: Date,
      endDate?: Date,
      restaurantId?: string,
) => {
      const match: any = { paymentStatus: "paid" };

      if (restaurantId) {
            match.restaurantId = restaurantId;
      }

      if (startDate || endDate) {
            match.createdAt = {};
            if (startDate) {
                  match.createdAt.$gte = startDate;
            }
            if (endDate) {
                  const end = new Date(endDate);
                  end.setHours(23, 59, 59, 999);
                  match.createdAt.$lte = end;
            }
      }

      return match;
};

export const computeDashboardSummary = async (
      startDate?: Date,
      endDate?: Date,
      restaurantId?: string,
) => {
      const matchStage = buildMatchStage(startDate, endDate, restaurantId);

      const orderStats = await Order.aggregate([
            { $match: matchStage },
            {
                  $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        totalRevenue: { $sum: "$totalAmount" },
                        subtotalSum: { $sum: "$subtotal" },
                        deliveryFeeSum: { $sum: "$deliveryFee" },
                        platformFeeSum: { $sum: "$platformFee" },
                        discountSum: { $sum: "$discountAmount" },
                  },
            },
      ]);

      const stats = orderStats[0] || {
            totalOrders: 0,
            totalRevenue: 0,
            subtotalSum: 0,
            deliveryFeeSum: 0,
            platformFeeSum: 0,
            discountSum: 0,
      };

      const commission = stats.platformFeeSum + stats.subtotalSum * 0.05;
      let activeRestaurants = 0;
      let activeRiders = 0;
      let totalCustomers = 0;

      if (!restaurantId) {
            activeRestaurants = await Restaurant.countDocuments({ isVerified: true });
            activeRiders = await Rider.countDocuments({});
            totalCustomers = await User.countDocuments({ role: "customer" });
      } else {
            const distinctCustomers = (await (Order as any).distinct(
                  "userId",
                  matchStage,
            )) as string[];
            totalCustomers = distinctCustomers.length;
      }

      return {
            totalOrders: stats.totalOrders,
            totalRevenue: Math.round(stats.totalRevenue * 100) / 100,
            totalCommission: Math.round(commission * 100) / 100,
            averageOrderValue:
                  stats.totalOrders > 0
                        ? Math.round((stats.totalRevenue / stats.totalOrders) * 100) / 100
                        : 0,
            totalDiscounts: Math.round(stats.discountSum * 100) / 100,
            totalDeliveryFees: Math.round(stats.deliveryFeeSum * 100) / 100,
            totalPlatformFees: Math.round(stats.platformFeeSum * 100) / 100,
            activeRestaurants,
            activeRiders,
            totalCustomers,
      };
};

export const computeRevenueTrends = async (
      startDate?: Date,
      endDate?: Date,
      interval: "daily" | "weekly" | "monthly" = "daily",
      restaurantId?: string,
) => {
      const matchStage = buildMatchStage(startDate, endDate, restaurantId);

      let groupId: any;
      if (interval === "daily") {
            groupId = {
                  year: { $year: "$createdAt" },
                  month: { $month: "$createdAt" },
                  day: { $dayOfMonth: "$createdAt" },
            };
      } else if (interval === "weekly") {
            groupId = {
                  year: { $year: "$createdAt" },
                  week: { $week: "$createdAt" },
            };
      } else {
            groupId = {
                  year: { $year: "$createdAt" },
                  month: { $month: "$createdAt" },
            };
      }

      const trends = await Order.aggregate([
            { $match: matchStage },
            {
                  $group: {
                        _id: groupId,
                        orders: { $sum: 1 },
                        revenue: { $sum: "$totalAmount" },
                        deliveryFees: { $sum: "$deliveryFee" },
                        platformFees: { $sum: "$platformFee" },
                        commission: {
                              $sum: { $add: ["$platformFee", { $multiply: ["$subtotal", 0.05] }] },
                        },
                  },
            },
            { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.week": 1 } },
      ]);

      return trends.map((t) => {
            let label = "";
            if (interval === "daily") {
                  label = `${t._id.year}-${String(t._id.month).padStart(2, "0")}-${String(t._id.day).padStart(2, "0")}`;
            } else if (interval === "weekly") {
                  label = `${t._id.year} Wk ${t._id.week}`;
            } else {
                  label = `${t._id.year}-${String(t._id.month).padStart(2, "0")}`;
            }

            return {
                  label,
                  orders: t.orders,
                  revenue: Math.round(t.revenue * 100) / 100,
                  deliveryFees: Math.round(t.deliveryFees * 100) / 100,
                  platformFees: Math.round(t.platformFees * 100) / 100,
                  commission: Math.round(t.commission * 100) / 100,
            };
      });
};

export const computeTopRestaurants = async (
      startDate?: Date,
      endDate?: Date,
      limit: number = 5,
) => {
      const matchStage = buildMatchStage(startDate, endDate);

      const topRestaurants = await Order.aggregate([
            { $match: matchStage },
            {
                  $group: {
                        _id: "$restaurantId",
                        name: { $first: "$restaurantName" },
                        ordersCount: { $sum: 1 },
                        revenue: { $sum: "$totalAmount" },
                  },
            },
            { $sort: { revenue: -1 } },
            { $limit: limit },
      ]);

      return topRestaurants.map((r) => ({
            restaurantId: r._id,
            name: r.name || "Unknown Restaurant",
            ordersCount: r.ordersCount,
            revenue: Math.round(r.revenue * 100) / 100,
      }));
};

export const computeTopSellingFoods = async (
      startDate?: Date,
      endDate?: Date,
      limit: number = 5,
      restaurantId?: string,
) => {
      const matchStage = buildMatchStage(startDate, endDate, restaurantId);

      const topFoods = await Order.aggregate([
            { $match: matchStage },
            { $unwind: "$items" },
            {
                  $group: {
                        _id: "$items.itemId",
                        name: { $first: "$items.name" },
                        quantitySold: { $sum: "$items.quantity" },
                        totalSales: {
                              $sum: { $multiply: ["$items.price", "$items.quantity"] },
                        },
                  },
            },
            { $sort: { quantitySold: -1 } },
            { $limit: limit },
      ]);

      return topFoods.map((f) => ({
            itemId: f._id,
            name: f.name || "Unknown Item",
            quantitySold: f.quantitySold,
            totalSales: Math.round(f.totalSales * 100) / 100,
      }));
};

export const computePeakOrderHours = async (
      startDate?: Date,
      endDate?: Date,
      restaurantId?: string,
) => {
      const matchStage = buildMatchStage(startDate, endDate, restaurantId);

      const hours = await Order.aggregate([
            { $match: matchStage },
            {
                  $group: {
                        _id: { $hour: "$createdAt" },
                        ordersCount: { $sum: 1 },
                  },
            },
            { $sort: { _id: 1 } },
      ]);

      const fullHours = Array.from({ length: 24 }, (_, i) => {
            const found = hours.find((h) => h._id === i);
            return {
                  hour: i,
                  hourLabel: `${String(i).padStart(2, "0")}:00`,
                  ordersCount: found ? found.ordersCount : 0,
            };
      });

      return fullHours;
};

export const computeUserGrowth = async (startDate?: Date, endDate?: Date) => {
      const match: any = {};
      if (startDate || endDate) {
            match.createdAt = {};
            if (startDate) match.createdAt.$gte = startDate;
            if (endDate) {
                  const end = new Date(endDate);
                  end.setHours(23, 59, 59, 999);
                  match.createdAt.$lte = end;
            }
      }

      const users = await User.aggregate([
            { $match: match },
            {
                  $group: {
                        _id: {
                              year: { $year: "$createdAt" },
                              month: { $month: "$createdAt" },
                              day: { $dayOfMonth: "$createdAt" },
                        },
                        count: { $sum: 1 },
                  },
            },
            { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
      ]);

      let cumulative = 0;
      return users.map((u) => {
            cumulative += u.count;
            return {
                  date: `${u._id.year}-${String(u._id.month).padStart(2, "0")}-${String(u._id.day).padStart(2, "0")}`,
                  newRegistrations: u.count,
                  totalUsers: cumulative,
            };
      });
};

export const computeRiderPerformance = async (limit: number = 10) => {
      const performance = await Rider.aggregate([
            {
                  $lookup: {
                        from: "users",
                        let: { rUserId: "$userId" },
                        pipeline: [
                              {
                                    $match: { $expr: { $eq: ["$_id", { $toObjectId: "$$rUserId" }] } },
                              },
                        ],
                        as: "riderUser",
                  },
            },
            {
                  $project: {
                        name: { $arrayElemAt: ["$riderUser.name", 0] },
                        rating: 1,
                        ratingCount: 1,
                        totalEarnings: 1,
                        totalDeliveries: 1,
                  },
            },
            { $sort: { totalDeliveries: -1 } },
            { $limit: limit },
      ]);

      return performance.map((rp) => ({
            riderId: rp._id,
            name: rp.name || "Rider",
            rating: rp.rating || 0,
            ratingCount: rp.ratingCount || 0,
            totalEarnings: rp.totalEarnings || 0,
            totalDeliveries: rp.totalDeliveries || 0,
      }));
};
