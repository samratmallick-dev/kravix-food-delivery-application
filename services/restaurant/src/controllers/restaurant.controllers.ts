import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/isAuthenticated.js";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { restaurantService } from "../services/index.js";
import { RestaurantResponseMapper } from "../mappers/restaurant-response.mapper.js";
import { getBuffer } from "../config/datauri.js";
import axios from "axios";
import jwt from "jsonwebtoken";
import { ValidationError } from "../utils/errors.js";
import { successResponse, errorResponse } from "../utils/response.js";

interface TokenPayload {
  _id: string;
  name: string;
  email: string;
  image: string;
  role: string | null;
  restaurantId?: string;
}

const tokengenerator = (user: TokenPayload): string => {
  const secretkey = process.env.JWT_SECRET;
  if (!secretkey) throw new Error("JWT_SECRET environment variable is not set");
  return jwt.sign(user, secretkey, { expiresIn: "15d" });
};

export const createRestaurant = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return errorResponse(res, 401, "User not authenticated", "UNAUTHORIZED");
  }

  const { name, description, latitude, longitude, formattedAddress, phone } = req.body;

  if ([name, latitude, longitude].some((field) => !field || String(field).trim() === "")) {
    throw new ValidationError("Name, latitude and longitude are required fields");
  }

  const file = req.file;
  if (!file) {
    throw new ValidationError("Image file is required");
  }

  const fileBuffer = getBuffer(file);
  if (!fileBuffer) {
    throw new ValidationError("Failed to create file buffer.");
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

  const restaurant = await restaurantService.createRestaurant(
    user._id.toString(),
    name as string,
    (description as string) || "",
    updateResult.data.url,
    Number(phone),
    [Number(longitude), Number(latitude)],
    formattedAddress as string
  );

  const token = tokengenerator({
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    image: user.image || "",
    role: user.role,
    restaurantId: restaurant.id
  });

  return successResponse(res, 201, "Restaurant created successfully", {
    restaurant: RestaurantResponseMapper.toRestaurantDto(restaurant),
    token
  });
});

export const addRestaurant = createRestaurant;

export const fetchMyRestaurant = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return errorResponse(res, 401, "User not authenticated", "UNAUTHORIZED");
  }

  const restaurant = await restaurantService.getMyRestaurant(user._id.toString());

  if (!req.user?.restaurantId) {
    const token = tokengenerator({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      image: user.image || "",
      role: user.role,
      restaurantId: restaurant.id
    });
    return successResponse(res, 200, "Restaurant retrieved successfully", {
      restaurant: RestaurantResponseMapper.toRestaurantDto(restaurant),
      token
    });
  }

  return successResponse(res, 200, "Restaurant retrieved successfully", RestaurantResponseMapper.toRestaurantDto(restaurant));
});

export const updateRestaurantStatus = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return errorResponse(res, 401, "User not authenticated", "UNAUTHORIZED");
  }

  const { status } = req.body;
  if (typeof status !== "boolean") {
    throw new ValidationError("Status must be a boolean value");
  }

  const restaurant = await restaurantService.updateRestaurantStatus(user._id.toString(), status);
  return successResponse(res, 200, "Restaurant status updated successfully", RestaurantResponseMapper.toRestaurantDto(restaurant));
});

export const updateRestaurant = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return errorResponse(res, 401, "User not authenticated", "UNAUTHORIZED");
  }

  const { name, description } = req.body;
  const updates: { name?: string; description?: string; image?: string } = {};
  if (name) updates.name = name as string;
  if (description !== undefined) updates.description = description as string;

  const file = req.file;
  if (file) {
    const fileBuffer = getBuffer(file);
    if (!fileBuffer) {
      throw new ValidationError("Failed to create file buffer.");
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
    updates.image = uploadResult.data.url;
  }

  const restaurant = await restaurantService.updateRestaurant(user._id.toString(), updates);
  return successResponse(res, 200, "Restaurant updated successfully", RestaurantResponseMapper.toRestaurantDto(restaurant));
});

export const getNearestRestaurant = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { latitude, longitude, radius = 5000, search = "" } = req.query;
  if (!latitude || !longitude) {
    throw new ValidationError("Latitude and longitude are required");
  }

  const { restaurants, correctedQuery } = await restaurantService.getNearestRestaurants(
    Number(longitude),
    Number(latitude),
    Number(radius),
    search as string
  );

  const dtos = restaurants.map(RestaurantResponseMapper.toRestaurantDto);
  return successResponse(res, 200, "Nearest restaurants fetched successfully", dtos, correctedQuery ? { correctedQuery } : undefined);
});

export const fetchSingleRestaurant = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const restaurant = await restaurantService.getRestaurantDetails(id as string);
  return successResponse(res, 200, "Restaurant fetched successfully", RestaurantResponseMapper.toRestaurantDto(restaurant));
});
