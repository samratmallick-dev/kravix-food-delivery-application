import { AuthenticatedRequest } from "../middleware/isAuthenticated.js";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { Response } from "express";
import { Restaurant } from "../model/Restaurant.js";
import { getBuffer } from "../config/datauri.js";
import axios from "axios";
import jwt from "jsonwebtoken";

const tokengenerator = (user: any) => {
      const secretkey = process.env.JWT_SECRET as string || "default_secret_key";

      const token = jwt.sign(
            {user},
            secretkey,
            { expiresIn: "15d" }
      );

      return token;
};

export const addRestaurant = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
      const user = req.user;

      if (!user) {
            return res.status(401).json({
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

      return res.status(201).json({
            message: "Restaurant created successfully",
            success: true,
            error: false,
            data: restaurant
      });
});

export const fetchMyRestaurant = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
      const user = req.user;
      if (!user) {
            return res.status(401).json({
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

      const restaurantId = req.user?.restaurantId;
      if (!restaurantId) {
            const token = tokengenerator({
                  user: {
                        ...user,
                        restaurantId: restaurant._id
                  }
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