import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/isAuthenticated.js";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { restaurantService } from "../services/index.js";
import { RestaurantResponseMapper } from "../mappers/restaurant-response.mapper.js";
import { getBuffer } from "../config/datauri.js";
import axios from "axios";
import jwt from "jsonwebtoken";
import { ValidationError } from "../utils/errors.js";

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
    return res.status(401).json({ message: "User not authenticated", success: false, error: true });
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
    `${process.env.UTILS_SERVICE_URI}/api/v1/cloudinary/images`,
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
    updateResult.url,
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

  return res.status(201).json({
    message: "Restaurant created successfully",
    success: true,
    error: false,
    data: RestaurantResponseMapper.toRestaurantDto(restaurant),
    token
  });
});

export const addRestaurant = createRestaurant;

export const fetchMyRestaurant = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "User not authenticated", success: false, error: true });
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

    return res.status(200).json({
      message: "Restaurant retrieved successfully",
      success: true,
      error: false,
      data: RestaurantResponseMapper.toRestaurantDto(restaurant),
      token
    });
  }

  return res.status(200).json({
    message: "Restaurant retrieved successfully",
    success: true,
    error: false,
    data: RestaurantResponseMapper.toRestaurantDto(restaurant)
  });
});

export const updateRestaurantStatus = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "User not authenticated", success: false, error: true });
  }

  const { status } = req.body;
  if (typeof status !== "boolean") {
    throw new ValidationError("Status must be a boolean value");
  }

  const restaurant = await restaurantService.updateRestaurantStatus(user._id.toString(), status);

  return res.status(200).json({
    message: "Restaurant status updated successfully",
    success: true,
    error: false,
    data: RestaurantResponseMapper.toRestaurantDto(restaurant)
  });
});

export const updateRestaurant = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "User not authenticated", success: false, error: true });
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
      `${process.env.UTILS_SERVICE_URI}/api/v1/cloudinary/images`,
      { image: fileBuffer },
      {
        headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );
    updates.image = uploadResult.url;
  }

  const restaurant = await restaurantService.updateRestaurant(user._id.toString(), updates);

  return res.status(200).json({
    message: "Restaurant updated successfully",
    success: true,
    error: false,
    data: RestaurantResponseMapper.toRestaurantDto(restaurant)
  });
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

  return res.status(200).json({
    success: true,
    message: "Nearest restaurants fetched successfully",
    error: false,
    data: dtos,
    ...(correctedQuery ? { correctedQuery } : {})
  });
});

export const fetchSingleRestaurant = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const restaurant = await restaurantService.getRestaurantDetails(id as string);
  return res.status(200).json({
    message: "Restaurant fetched successfully",
    success: true,
    error: false,
    data: RestaurantResponseMapper.toRestaurantDto(restaurant)
  });
});