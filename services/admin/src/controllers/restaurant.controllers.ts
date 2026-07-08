import { Response, NextFunction } from "express";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { AdminRequest } from "../middleware/isAdminAuthenticated.js";
import { restaurantModerationService } from "../services/index.js";
import { AdminResponseMapper } from "../mappers/admin-response.mapper.js";
import { AdminValidator } from "../validators/admin.validator.js";

export const getAllRestaurants = TryCatch(async (req: AdminRequest, res: Response, next: NextFunction) => {
  const page = Math.max(1, parseInt(req.query["page"] as string) || 1);
  const limit = Math.min(100, parseInt(req.query["limit"] as string) || 20);
  const isVerified = req.query["isVerified"] as string | undefined;

  const { restaurants, total } = await restaurantModerationService.getAllRestaurants(page, limit, isVerified);
  const dtos = restaurants.map(AdminResponseMapper.toRestaurantDto);

  return res.status(200).json({
    success: true,
    message: "Restaurants fetched successfully",
    error: false,
    data: {
      restaurants: dtos,
      total,
      page,
      pages: Math.ceil(total / limit)
    }
  });
});

export const getRestaurantById = TryCatch(async (req: AdminRequest, res: Response, next: NextFunction) => {
  const restaurantId = req.params["restaurantId"] as string;
  const { restaurant, menuItems } = await restaurantModerationService.getRestaurantById(restaurantId);
  return res.status(200).json({
    success: true,
    message: "Restaurant fetched successfully",
    error: false,
    data: {
      restaurant: AdminResponseMapper.toRestaurantDto(restaurant),
      menuItems
    }
  });
});

export const verifyRestaurant = TryCatch(async (req: AdminRequest, res: Response, next: NextFunction) => {
  const restaurantId = req.params["restaurantId"] as string;
  const validData = AdminValidator.validateVerify(req.body);
  const restaurant = await restaurantModerationService.verifyRestaurant(restaurantId, validData.isVerified);
  return res.status(200).json({
    success: true,
    message: `Restaurant ${restaurant.isVerified ? "verified" : "unverified"} successfully`,
    error: false,
    data: AdminResponseMapper.toRestaurantDto(restaurant)
  });
});

export const deleteRestaurant = TryCatch(async (req: AdminRequest, res: Response, next: NextFunction) => {
  const restaurantId = req.params["restaurantId"] as string;
  await restaurantModerationService.deleteRestaurant(restaurantId);
  return res.status(200).json({
    success: true,
    message: "Restaurant and its menu items deleted",
    error: false,
    data: {}
  });
});
