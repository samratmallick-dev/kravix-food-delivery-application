import { UserRepository } from "../repositories/user.repository.js";
import { RestaurantRepository } from "../repositories/restaurant.repository.js";
import { RiderRepository } from "../repositories/rider.repository.js";
import { OrderRepository } from "../repositories/order.repository.js";
import { AdminEventPublisher } from "../events/AdminEvents.js";
import { AdminService } from "./AdminService.js";
import { DashboardService } from "./DashboardService.js";
import { UserModerationService } from "./UserModerationService.js";
import { RestaurantModerationService } from "./RestaurantModerationService.js";
import { RiderModerationService } from "./RiderModerationService.js";
import { OrderModerationService } from "./OrderModerationService.js";

export const userRepository = new UserRepository();
export const restaurantRepository = new RestaurantRepository();
export const riderRepository = new RiderRepository();
export const orderRepository = new OrderRepository();
export const eventPublisher = new AdminEventPublisher();

export const adminService = new AdminService();
export const dashboardService = new DashboardService(userRepository, restaurantRepository, riderRepository, orderRepository);
export const userModerationService = new UserModerationService(userRepository, riderRepository, restaurantRepository, eventPublisher);
export const restaurantModerationService = new RestaurantModerationService(restaurantRepository, eventPublisher);
export const riderModerationService = new RiderModerationService(riderRepository, eventPublisher);
export const orderModerationService = new OrderModerationService(orderRepository, eventPublisher);
