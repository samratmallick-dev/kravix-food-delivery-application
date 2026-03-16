import { AuthenticatedRequest } from "../middleware/isAuthenticated.js";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { Response } from "express";
import { Restaurant } from "../model/Restaurant.js";
import { getBuffer } from "../config/datauri.js";
import axios from "axios";
import jwt from "jsonwebtoken";

interface TokenPayload {
      _id: string;
      name: string;
      email: string;
      image: string;
      role: string | null;
      restaurantId?: string;
}

const tokengenerator = (user: TokenPayload): string => {
      const secretkey = process.env.JWT_SECRET as string || "default_secret_key";

      const token = jwt.sign(user, secretkey, { expiresIn: "15d" });

      return token;
};

export const addRestaurant = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
      const user = req.user;

      if (!user) {
            return res.status(403).json({
                  message: "User not authenticated",
                  success: false,
                  error: true
            });
      }

      const existingRestaurantSerller = await Restaurant.findOne({
            ownerId: user?._id
      });

      if (existingRestaurantSerller) {
            return res.status(400).json({
                  message: "Seller already has a restaurant",
                  success: false,
                  error: true
            });
      }

      const { name, description, latitude, longitude, formattedAddress, phone } = req.body;

      if ([name, latitude, longitude].some((field) => !field || field.trim() === "")) {
            return res.status(400).json({
                  message: "Name, latitude and longitude are required fields",
                  success: false,
                  error: true
            });
      }

      const file = req.file;
      if (!file) {
            return res.status(400).json({
                  message: "Image file is required",
                  success: false,
                  error: true
            });
      }

      const fileBuffer = getBuffer(file);
      if (!fileBuffer) {
            return res.status(500).json({
                  message: "Field to create file buffer.",
                  success: false,
                  error: true
            });
      }

      const { data: updateResult } = await axios.post(`${process.env.UTILS_SERVICE_URI}/api/v1/cloudinary/upload-image`, {
            image: fileBuffer
      });


      const restaurant = await Restaurant.create({
            name,
            description,
            image: updateResult.url,
            ownerId: user._id,
            phone,
            autoLocation: {
                  type: "Point",
                  coordinates: [Number(longitude), Number(latitude)],
                  formattedAddress
            }
      });

      const token = tokengenerator({
            _id: user._id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
            restaurantId: restaurant._id.toString()
      });

      return res.status(201).json({
            message: "Restaurant created successfully",
            success: true,
            error: false,
            data: restaurant,
            token
      });
});

export const fetchMyRestaurant = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
      const user = req.user;
      if (!user) {
            return res.status(403).json({
                  message: "User not authenticated",
                  success: false,
                  error: true
            });
      }
      const restaurant = await Restaurant.findOne({
            ownerId: user._id
      });
      if (!restaurant) {
            return res.status(404).json({
                  message: "Restaurant not found for this seller",
                  success: false,
                  error: true
            });
      }

      if (!req.user?.restaurantId) {
            const token = tokengenerator({
                  _id: user._id,
                  name: user.name,
                  email: user.email,
                  image: user.image,
                  role: user.role,
                  restaurantId: restaurant._id.toString()
            });

            return res.status(200).json({
                  message: "Restaurant retrieved successfully",
                  success: true,
                  error: false,
                  data: restaurant,
                  token
            });
      }

      return res.status(200).json({
            message: "Restaurant retrieved successfully",
            success: true,
            error: false,
            data: restaurant
      });
});

export const updateRestaurantStatus = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
      const user = req.user;
      if (!user) {
            return res.status(403).json({
                  message: "User not authenticated",
                  success: false,
                  error: true
            });
      }

      const { status } = req.body;
      if (typeof status !== "boolean") {
            return res.status(400).json({
                  message: "Status must be a boolean value",
                  success: false,
                  error: true
            });
      }

      const updateRestaurantStatus = await Restaurant.findOneAndUpdate(
            { ownerId: user._id },
            { isOpen: status },
            { new: true }
      );

      if (!updateRestaurantStatus) {
            return res.status(400).json({
                  message: "Failed to update restaurant status",
                  success: false,
                  error: true
            });
      }

      return res.status(200).json({
            message: "Restaurant status updated successfully",
            success: true,
            error: false,
            data: updateRestaurantStatus
      });
});

export const updateRestaurant = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
      const user = req.user;
      if (!user) {
            return res.status(403).json({
                  message: "User not authenticated",
                  success: false,
                  error: true
            });
      }

      const { name, description } = req.body;

      const updateRestaurant = await Restaurant.findOneAndUpdate(
            { ownerId: user._id },
            { name, description },
            { new: true }
      );

      if(!updateRestaurant) {
            return res.status(400).json({
                  message: "Failed to update restaurant",
                  success: false,
                  error: true
            });
      }

      return res.status(200).json({
            message: "Restaurant updated successfully",
            success: true,
            error: false,
            data: updateRestaurant
      });
});