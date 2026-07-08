import { Response, NextFunction } from "express";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { AdminRequest } from "../middleware/isAdminAuthenticated.js";
import { restaurantModerationService } from "../services/index.js";
import { AdminResponseMapper } from "../mappers/admin-response.mapper.js";
import { AdminValidator } from "../validators/admin.validator.js";
import { successResponse, paginatedResponse } from "../utils/response.js";

export const getAllRestaurants = TryCatch(async (req: AdminRequest, res: Response, next: NextFunction) => {
  const page = Math.max(1, parseInt(req.query["page"] as string) || 1);
  const limit = Math.min(100, parseInt(req.query["limit"] as string) || 20);
  const isVerified = req.query["isVerified"] as string | undefined;

  const { restaurants, total } = await restaurantModerationService.getAllRestaurants(page, limit, isVerified);
  return paginatedResponse(res, 200, "Restaurants fetched successfully", restaurants.map(AdminResponseMapper.toRestaurantDto), page, limit, total);
});

export const getRestaurantById = TryCatch(async (req: AdminRequest, res: Response, next: NextFunction) => {
  const restaurantId = req.params["restaurantId"] as string;
  const { restaurant, menuItems } = await restaurantModerationService.getRestaurantById(restaurantId);
  return successResponse(res, 200, "Restaurant fetched successfully", {
    restaurant: AdminResponseMapper.toRestaurantDto(restaurant),
    menuItems
  });
});

export const verifyRestaurant = TryCatch(async (req: AdminRequest, res: Response, next: NextFunction) => {
  const restaurantId = req.params["restaurantId"] as string;
  const validData = AdminValidator.validateVerify(req.body);
  const restaurant = await restaurantModerationService.verifyRestaurant(restaurantId, validData.isVerified);
  return successResponse(res, 200, `Restaurant ${restaurant.isVerified ? "verified" : "unverified"} successfully`, AdminResponseMapper.toRestaurantDto(restaurant));
});

export const deleteRestaurant = TryCatch(async (req: AdminRequest, res: Response, next: NextFunction) => {
  const restaurantId = req.params["restaurantId"] as string;
  await restaurantModerationService.deleteRestaurant(restaurantId);
  return successResponse(res, 200, "Restaurant and its menu items deleted");
});
