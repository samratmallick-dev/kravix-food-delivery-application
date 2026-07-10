import { IAnalyticsRepository } from "../interfaces/IAnalyticsRepository.js";
import { Order, Restaurant, User, Rider } from "../model/SharedModels.js";

export class AnalyticsRepository implements IAnalyticsRepository {
  private buildMatchStage(startDate?: Date, endDate?: Date, restaurantId?: string): any {
    const match: any = { paymentStatus: { $in: ["paid", "cod_paid"] } };

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
  }

  async computeDashboardSummary(startDate?: Date, endDate?: Date, restaurantId?: string): Promise<any> {
    const matchStage = this.buildMatchStage(startDate, endDate, restaurantId);

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
          discountSum: { $sum: "$discountAmount" }
        }
      }
    ]);

    const stats = orderStats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      subtotalSum: 0,
      deliveryFeeSum: 0,
      platformFeeSum: 0,
      discountSum: 0
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
      const distinctCustomers = (await (Order as any).distinct("userId", matchStage)) as string[];
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
      totalCustomers
    };
  }

  async computeRevenueTrends(startDate?: Date, endDate?: Date, interval: "daily" | "weekly" | "monthly" = "daily", restaurantId?: string): Promise<any[]> {
    const matchStage = this.buildMatchStage(startDate, endDate, restaurantId);

    let groupId: any;
    if (interval === "monthly") {
      groupId = {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" }
      };
    } else if (interval === "weekly") {
      groupId = {
        year: { $year: "$createdAt" },
        week: { $week: "$createdAt" }
      };
    } else {
      groupId = {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
        day: { $dayOfMonth: "$createdAt" }
      };
    }

    const trends = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupId,
          orders: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
          subtotalSum: { $sum: "$subtotal" },
          deliveryFees: { $sum: "$deliveryFee" },
          platformFees: { $sum: "$platformFee" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.week": 1 } }
    ]);

    return trends.map((t) => {
      let label = "";
      if (interval === "monthly") {
        label = `${t._id.year}-${String(t._id.month).padStart(2, "0")}`;
      } else if (interval === "weekly") {
        label = `${t._id.year}-W${String(t._id.week).padStart(2, "0")}`;
      } else {
        label = `${t._id.year}-${String(t._id.month).padStart(2, "0")}-${String(t._id.day).padStart(2, "0")}`;
      }

      const commission = t.platformFees + t.subtotalSum * 0.05;

      return {
        label,
        orders: t.orders,
        revenue: Math.round(t.revenue * 100) / 100,
        deliveryFees: Math.round(t.deliveryFees * 100) / 100,
        platformFees: Math.round(t.platformFees * 100) / 100,
        commission: Math.round(commission * 100) / 100
      };
    });
  }

  async computeTopSellingFoods(startDate?: Date, endDate?: Date, limit = 5, restaurantId?: string): Promise<any[]> {
    const matchStage = this.buildMatchStage(startDate, endDate, restaurantId);

    return await Order.aggregate([
      { $match: matchStage },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.itemId",
          name: { $first: "$items.name" },
          quantity: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
        }
      },
      { $sort: { quantity: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          itemId: "$_id",
          name: 1,
          quantitySold: "$quantity",
          revenue: { $round: ["$revenue", 2] }
        }
      }
    ]);
  }

  async computePeakOrderHours(startDate?: Date, endDate?: Date, restaurantId?: string): Promise<any[]> {
    const matchStage = this.buildMatchStage(startDate, endDate, restaurantId);

    const raw = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $hour: "$createdAt" },
          ordersCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const hourMap = new Map<number, number>();
    for (const entry of raw) {
      hourMap.set(entry._id, entry.ordersCount);
    }

    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      ordersCount: hourMap.get(hour) ?? 0
    }));
  }

  async computeTopRestaurants(startDate?: Date, endDate?: Date, limit = 5): Promise<any[]> {
    const matchStage = this.buildMatchStage(startDate, endDate);

    const raw = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$restaurantId",
          name: { $first: "$restaurantName" },
          orders: { $sum: 1 },
          revenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          restaurantId: "$_id",
          name: 1,
          ordersCount: "$orders",
          revenue: { $round: ["$revenue", 2] }
        }
      }
    ]);

    return raw;
  }

  async computeUserGrowth(startDate?: Date, endDate?: Date): Promise<any[]> {
    let initialCount = 0;
    if (startDate) {
      initialCount = await User.countDocuments({ createdAt: { $lt: startDate } });
    }

    const match: any = {};
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

    const rawGrowth = await User.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);

    let runningTotal = initialCount;
    return rawGrowth.map((g) => {
      const date = `${g._id.year}-${String(g._id.month).padStart(2, "0")}-${String(g._id.day).padStart(2, "0")}`;
      runningTotal += g.count;
      return {
        date,
        newRegistrations: g.count,
        totalUsers: runningTotal
      };
    });
  }

  async computeRiderPerformance(limit = 5): Promise<any[]> {
    const rawRiders = await (Rider as any).find({})
      .sort({ rating: -1, totalDeliveries: -1 })
      .limit(limit)
      .lean();

    return await Promise.all(
      rawRiders.map(async (r: any) => {
        const avgRating = r.ratingCount > 0 ? r.rating : null;
        let name = "Unknown Rider";
        if (r.userId) {
          const userDoc = await (User as any).findOne({ _id: r.userId }).lean();
          if (userDoc && userDoc.name) {
            name = userDoc.name;
          }
        }
        return {
          riderId: r._id ? r._id.toString() : "",
          userId: r.userId,
          name,
          totalDeliveries: r.totalDeliveries || 0,
          totalEarnings: r.totalEarnings || 0,
          rating: avgRating,
          ratingCount: r.ratingCount || 0
        };
      })
    );
  }
}
