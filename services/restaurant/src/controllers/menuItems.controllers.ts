import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/isAuthenticated.js";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { menuItemService, restaurantService } from "../services/index.js";
import { RestaurantResponseMapper } from "../mappers/restaurant-response.mapper.js";
import { getBuffer } from "../config/datauri.js";
import axios from "axios";
import { ValidationError, NotFoundError } from "../utils/errors.js";
import { successResponse, errorResponse } from "../utils/response.js";

export const addMenuItems = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return errorResponse(res, 401, "User not authenticated", "UNAUTHORIZED");
  }

  const restaurant = await restaurantService.getMyRestaurant(user._id.toString());
  const { name, description, price, isVeg, category } = req.body;

  if ([name, price, category].some((field) => !field || String(field).trim() === "")) {
    throw new ValidationError("Name, price and category are required fields");
  }

  const file = req.file;
  if (!file) {
    throw new ValidationError("Menu item image is required");
  }

  const fileBuffer = getBuffer(file);
  if (!fileBuffer) {
    throw new ValidationError("Failed to process image file");
  }

  const { data: updateResult } = await axios.post(
    `${process.env.UTILS_SERVICE_URI}/api/v1/uploads/images`,
    { image: fileBuffer },
    {
      headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    }
  );

  const menuItems = await menuItemService.createMenuItem(restaurant.id, {
    name,
    description,
    price: Number(price),
    imageUrl: updateResult.data.url,
    isAvailable: true,
    isVeg: isVeg === "true" || isVeg === true,
    category
  });

  return successResponse(res, 201, "Menu item added successfully", RestaurantResponseMapper.toMenuItemDto(menuItems));
});

export const getAllMenuItems = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return errorResponse(res, 401, "User not authenticated", "UNAUTHORIZED");
  }

  const restaurantId = req.params["restaurantId"] as string;
  if (!restaurantId) {
    throw new ValidationError("Restaurant ID is required");
  }

  const menuItems = await menuItemService.getMenuItems(restaurantId);
  return successResponse(res, 200, "Menu items fetched successfully", menuItems.map(RestaurantResponseMapper.toMenuItemDto));
});

export const deleteMenuItem = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return errorResponse(res, 401, "User not authenticated", "UNAUTHORIZED");
  }

  const itemId = req.params["menuItemId"] as string;
  if (!itemId) {
    throw new ValidationError("Menu Item ID is required");
  }

  const restaurant = await restaurantService.getMyRestaurant(user._id.toString());
  const items = await menuItemService.getMenuItems(restaurant.id);
  const found = items.find((i) => i.id === itemId);
  if (!found) {
    throw new NotFoundError("Menu item not found in restaurant");
  }

  await menuItemService.deleteMenuItem(restaurant.id, itemId);
  return successResponse(res, 200, "Menu item deleted successfully");
});

export const searchByFood = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { search = "", latitude, longitude, radius = 5000 } = req.query;

  if (!latitude || !longitude) {
    throw new ValidationError("Latitude and longitude are required");
  }

  const { results, correctedQuery } = await menuItemService.searchByFood(
    search as string,
    Number(longitude),
    Number(latitude),
    Number(radius)
  );

  return successResponse(res, 200, "Food search results fetched successfully", results, correctedQuery ? { correctedQuery } : undefined);
});

export const autocomplete = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { q = "", latitude, longitude, radius = 10000 } = req.query;
  const query = (q as string).trim();

  if (!query) {
    return successResponse(res, 200, "Suggestions fetched successfully", []);
  }
  if (!latitude || !longitude) {
    throw new ValidationError("Latitude and longitude are required");
  }

  const suggestions = await menuItemService.autocomplete(
    query,
    Number(longitude),
    Number(latitude),
    Number(radius)
  );

  return successResponse(res, 200, "Suggestions fetched successfully", suggestions);
});

export const toggleMenuItemAvailability = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return errorResponse(res, 401, "User not authenticated", "UNAUTHORIZED");
  }

  const itemId = req.params["itemId"] as string;
  if (!itemId) {
    throw new ValidationError("Menu Item ID is required");
  }

  const updated = await menuItemService.toggleMenuItemAvailability(itemId, user._id.toString());
  return successResponse(res, 200, "Menu item availability toggled successfully", RestaurantResponseMapper.toMenuItemDto(updated));
});

export const updateMenuItem = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return errorResponse(res, 401, "User not authenticated", "UNAUTHORIZED");
  }

  const menuItemId = req.params["menuItemId"] as string;
  if (!menuItemId) {
    throw new ValidationError("Menu Item ID is required");
  }

  const { name, description, price, isVeg, category } = req.body;
  if ([name, price, category].some((field) => !field || String(field).trim() === "")) {
    throw new ValidationError("Name, price and category are required fields");
  }

  const file = req.file;
  let imageUrl: string | undefined;

  if (file) {
    const fileBuffer = getBuffer(file);
    if (!fileBuffer) {
      throw new ValidationError("Failed to process image file");
    }

    const { data: uploadResult } = await axios.post(
      `${process.env.UTILS_SERVICE_URI}/api/v1/uploads/images`,
      { image: fileBuffer },
      {
        headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );
    imageUrl = uploadResult.data.url;
  }

  const updated = await menuItemService.updateMenuItem(menuItemId, user._id.toString(), {
    name,
    description,
    price: Number(price),
    imageUrl,
    isVeg: isVeg === "true" || isVeg === true,
    category
  });

  return successResponse(res, 200, "Menu item updated successfully", RestaurantResponseMapper.toMenuItemDto(updated));
});

export const getAvailableCategories = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const categories = await menuItemService.getAvailableCategories();
  return successResponse(res, 200, "Available food categories fetched successfully", categories);
});
