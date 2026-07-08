import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/isAuthenticated.js";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { menuItemService, restaurantService } from "../services/index.js";
import { RestaurantResponseMapper } from "../mappers/restaurant-response.mapper.js";
import { getBuffer } from "../config/datauri.js";
import axios from "axios";
import { ValidationError, NotFoundError } from "../utils/errors.js";

export const addMenuItems = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "User not authenticated", success: false, error: true });
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
    `${process.env.UTILS_SERVICE_URI}/api/v1/cloudinary/images`,
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
    imageUrl: updateResult.url,
    isAvailable: true
  });

  return res.status(201).json({
    message: "Menu item added successfully",
    success: true,
    error: false,
    data: RestaurantResponseMapper.toMenuItemDto(menuItems)
  });
});

export const getAllMenuItems = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "User not authenticated", success: false, error: true });
  }

  const restaurantId = req.params["restaurantId"] as string;
  if (!restaurantId) {
    throw new ValidationError("Restaurant ID is required");
  }

  const menuItems = await menuItemService.getMenuItems(restaurantId);
  const dtos = menuItems.map(RestaurantResponseMapper.toMenuItemDto);

  return res.status(200).json({
    message: "Menu items fetched successfully",
    success: true,
    error: false,
    data: dtos
  });
});

export const deleteMenuItem = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "User not authenticated", success: false, error: true });
  }

  const itemId = req.params["itemId"] as string;
  if (!itemId) {
    throw new ValidationError("Menu Item ID is required");
  }

  const sellerRestaurantId = (user.restaurantId as string) || "";
  const item = await menuItemService.getMenuItems(sellerRestaurantId);
  const found = item.find((i) => i.id === itemId);
  if (!found) {
    throw new NotFoundError("Menu item not found in restaurant");
  }

  await menuItemService.deleteMenuItem(sellerRestaurantId, itemId);

  return res.status(200).json({
    message: "Menu item deleted successfully",
    success: true,
    error: false,
    data: {}
  });
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

  return res.status(200).json({
    message: "Food search results fetched successfully",
    success: true,
    error: false,
    data: results,
    ...(correctedQuery ? { correctedQuery } : {})
  });
});

export const autocomplete = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { q = "", latitude, longitude, radius = 10000 } = req.query;
  const query = (q as string).trim();

  if (!query) {
    return res.status(200).json({ success: true, data: [] });
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

  return res.status(200).json({ success: true, data: suggestions });
});

export const toggleMenuItemAvailability = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "User not authenticated", success: false, error: true });
  }

  const itemId = req.params["itemId"] as string;
  if (!itemId) {
    throw new ValidationError("Menu Item ID is required");
  }

  const updated = await menuItemService.toggleMenuItemAvailability(itemId, user._id.toString());

  return res.status(200).json({
    message: "Menu item availability toggled successfully",
    success: true,
    error: false,
    data: RestaurantResponseMapper.toMenuItemDto(updated)
  });
});