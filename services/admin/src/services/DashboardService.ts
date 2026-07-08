import { IDashboardService } from "../interfaces/IDashboardService.js";
import { IUserRepository } from "../interfaces/IUserRepository.js";
import { IRestaurantRepository } from "../interfaces/IRestaurantRepository.js";
import { IRiderRepository } from "../interfaces/IRiderRepository.js";
import { IOrderRepository } from "../interfaces/IOrderRepository.js";

export class DashboardService implements IDashboardService {
  constructor(
    private userRepository: IUserRepository,
    private restaurantRepository: IRestaurantRepository,
    private riderRepository: IRiderRepository,
    private orderRepository: IOrderRepository
  ) {}

  async getDashboardStats(): Promise<any> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      usersByRole,
      restaurantStats,
      riderStats,
      ordersByStatus,
      totalRevenue,
      todayOrdersResult
    ] = await Promise.all([
      this.userRepository.countByRole(),
      this.restaurantRepository.countByVerification(),
      this.riderRepository.countByVerification(),
      this.orderRepository.countByStatusPaid(),
      this.orderRepository.getTotalPaidRevenue(),
      this.orderRepository.getTodayStats(todayStart)
    ]);

    const users = usersByRole.reduce((acc: any, cur: any) => {
      acc[cur._id ?? "unassigned"] = cur.count;
      return acc;
    }, {});

    const restaurants = restaurantStats.reduce((acc: any, cur: any) => {
      acc[cur._id ? "verified" : "unverified"] = cur.count;
      return acc;
    }, {});

    const riders = riderStats.reduce((acc: any, cur: any) => {
      acc[cur._id ? "verified" : "unverified"] = cur.count;
      return acc;
    }, {});

    const orders = ordersByStatus.reduce((acc: any, cur: any) => {
      acc[cur._id] = cur.count;
      return acc;
    }, {});

    const todayOrders = todayOrdersResult[0]?.count ?? 0;
    const todayRevenue = todayOrdersResult[0]?.revenue ?? 0;

    return {
      users,
      restaurants,
      riders,
      orders,
      totalRevenue,
      today: { orders: todayOrders, revenue: todayRevenue }
    };
  }
}
