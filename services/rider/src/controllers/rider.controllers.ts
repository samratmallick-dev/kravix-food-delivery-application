import axios from "axios";
import { Response } from "express";
import { getBuffer } from "../config/datauri.js";
import { AuthenticatedRequest } from "../middleware/isAuthenticated.js";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { Rider } from "../model/Rider.js";

export const addRiderProfile = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
      const user = req.user;
      if (!user) {
            return res.status(401).json({
                  success: false,
                  message: "User not authenticated",
                  error: true
            });
      }

      if (user.role !== "rider") {
            return res.status(403).json({
                  success: false,
                  message: "Access denied. Riders only.",
                  error: true
            });
      }

      const file = req.file;

      if (!file) {
            return res.status(400).json({
                  success: false,
                  message: "Rider Profile image is required",
                  error: true
            });
      }

      const fileBuffer = getBuffer(file);
      if (!fileBuffer) {
            return res.status(500).json({
                  success: false,
                  message: "Error processing the image file",
                  error: true
            });
      }

      const { data: uploadResult } = await axios.post(`${process.env.UTILS_SERVICE_URI}/api/v1/cloudinary/upload-image`, {
            image: fileBuffer
      });

      const { phoneNumber, aadhaarNumber, drivingLicesce, latitude, longitude } = req.body;

      if (!phoneNumber || !aadhaarNumber || !drivingLicesce || latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                  success: false,
                  message: "All fields are required",
                  error: true
            });
      }

      const existingRiderProfile = await Rider.findOne({ userId: user._id});

      if(existingRiderProfile){
            return res.status(409).json({
                  success: false,
                  message: "Rider profile already exists",
                  error: true
            });
      }

      const riderProfile = await Rider.create({
            userId: user._id,
            picture: uploadResult.url,
            phoneNumber,
            aadhaarNumber,
            drivingLicesce: drivingLicesce,
            location: {
                  type: "Point",
                  coordinates: [longitude, latitude]
            }
      });

      return res.status(201).json({
            success: true,
            message: "Rider profile created successfully",
            error: false,
            data: riderProfile
      });

});

export const fetchMyProfile = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
      const user = req.user;
      if (!user) {
            return res.status(401).json({
                  success: false,
                  message: "User not authenticated",
                  error: true
            });
      }

      if (user.role !== "rider") {
            return res.status(403).json({
                  success: false,
                  message: "Access denied. Riders only.",
                  error: true
            });
      }

      const riderProfile = await Rider.findOne({ userId: user._id });

      if (!riderProfile) {
            return res.status(404).json({
                  success: false,
                  message: "Rider profile not found",
                  error: true
            });
      }

      return res.status(200).json({
            success: true,
            message: "Rider profile fetched successfully",
            error: false,
            data: riderProfile
      });
      
});

export const toggleRiderAvailability = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
      const user = req.user;
      if (!user) {
            return res.status(401).json({
                  success: false,
                  message: "User not authenticated",
                  error: true
            });
      }

      if (user.role !== "rider") {
            return res.status(403).json({
                  success: false,
                  message: "Access denied. Riders only.",
                  error: true
            });
      }

      const riderProfile = await Rider.findOne({ userId: user._id });

      if (!riderProfile) {
            return res.status(404).json({
                  success: false,
                  message: "Rider profile not found",
                  error: true
            });
      }

      const { isAvailable, latitude, longitude } = req.body;

      if (latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                  success: false,
                  message: "Location is required",
                  error: true
            });
      }

      if(typeof isAvailable !== "boolean"){
            return res.status(400).json({
                  success: false,
                  message: "Invalid availability status",
                  error: true
            });
      }

      if(isAvailable && !riderProfile.isVerified) {
            return res.status(403).json({
                  success: false,
                  message: "You need to be verified to go online",
                  error: true
            });
      }

      riderProfile.isAvailable = isAvailable;
      riderProfile.location = {
            type: "Point",
            coordinates: [longitude, latitude]
      };
      riderProfile.lastActiveAt = new Date();

      await riderProfile.save();

      return res.status(200).json({
            success: true,
            message: `Rider is now ${isAvailable ? "available" : "unavailable"}`,
            error: false,
            data: riderProfile
      });
});