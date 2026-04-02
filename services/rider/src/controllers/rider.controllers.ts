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

      const { data: uploadResult } = await axios.post(`${process.env.UTILS_SERVICE_URI}/api/v1/cloudinary/images`, {
            image: fileBuffer
      }, {
            headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! }
      });

      const { phoneNumber, aadhaarNumber, drivingLicesce, latitude, longitude } = req.body;

      if (!phoneNumber || !aadhaarNumber || !drivingLicesce || latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                  success: false,
                  message: "All fields are required",
                  error: true
            });
      }

      const lat = Number(latitude);
      const lng = Number(longitude);

      if (isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({
                  success: false,
                  message: "Latitude and longitude must be valid numbers",
                  error: true
            });
      }

      const existingRiderProfile = await Rider.findOne({ userId: user._id });

      if (existingRiderProfile) {
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
                  coordinates: [lng, lat]
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

      const [storedLng, storedLat] = riderProfile.location.coordinates;

      return res.status(200).json({
            success: true,
            message: "Rider profile fetched successfully",
            error: false,
            data: {
                  ...riderProfile.toObject(),
                  location: {
                        type: "Point",
                        coordinates: [storedLng, storedLat],
                        longitude: storedLng,
                        latitude: storedLat
                  }
            }
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

      const lat = Number(latitude);
      const lng = Number(longitude);

      if (isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({
                  success: false,
                  message: "Latitude and longitude must be valid numbers",
                  error: true
            });
      }

      if (typeof isAvailable !== "boolean") {
            return res.status(400).json({
                  success: false,
                  message: "Invalid availability status",
                  error: true
            });
      }

      if (isAvailable && !riderProfile.isVerified) {
            return res.status(403).json({
                  success: false,
                  message: "You need to be verified to go online",
                  error: true
            });
      }

      riderProfile.isAvailable = isAvailable;
      riderProfile.location = {
            type: "Point",
            coordinates: [lng, lat]
      };
      riderProfile.lastActiveAt = new Date();

      await riderProfile.save();

      axios.post(`${process.env.REALTIME_SOCKET_SERVICE_URI}/api/v1/socket/events`,
            {
                  event: "admin:rider:availability",
                  room: "Admin",
                  payload: { riderId: riderProfile._id.toString(), isAvailable }
            },
            {
                  headers: {
                        "x-internal-key": process.env.INTERNAL_SERVICE_KEY!
                  }
            }
      ).catch((err) => console.error("Admin socket emit failed:", err.message));

      return res.status(200).json({
            success: true,
            message: `Rider is now ${isAvailable ? "available" : "unavailable"}`,
            error: false,
            data: riderProfile
      });
});

export const acceptOrder = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
      const riderUserId = req.user?._id;

      if (!riderUserId) {
            return res.status(401).json({
                  success: false,
                  message: "User not authenticated",
                  error: true
            });
      }

      const { orderId } = req.params;

      const rider = await Rider.findOne({
            userId: riderUserId.toString(),
            isAvailable: true,
            isVerified: true
      });

      if (!rider) {
            return res.status(404).json({
                  success: false,
                  message: "Rider not found or not available",
                  error: true
            });
      }

      try {
            const { data } = await axios.patch(`${process.env.RESTAURANT_SERVICE_URI}/api/v1/orders/internal/rider-assignment`,
                  {
                        orderId,
                        riderId: rider._id.toString(),
                        riderUserId: rider.userId,
                        riderName: req.user?.name,
                        riderPhoneNumber: rider.phoneNumber
                  },
                  {
                        headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! }
                  }
            );

            if (!data.success) {
                  throw new Error(data.message);
            }

            const riderDetails = await Rider.findOneAndUpdate(
                  { userId: riderUserId, isAvailable: true, },
                  { isAvailable: false },
                  { new: true }
            );

            return res.status(200).json({
                  success: true,
                  message: "Order accepted successfully",
                  error: false,
                  data: riderDetails
            });
      } catch (error: any) {
            return res.status(400).json({
                  success: false,
                  message: error instanceof Error ? error.message : "Failed to accept order",
                  error: true
            });
      }
});

export const fetchCurrentOrder = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
      const riderUserId = req.user?._id;

      if (!riderUserId) {
            return res.status(401).json({
                  success: false,
                  message: "User not authenticated",
                  error: true
            });
      }

      const rider = await Rider.findOne({
            userId: riderUserId.toString(),
            isVerified: true
      });

      if (!rider) {
            return res.status(404).json({
                  success: false,
                  message: "Rider profile not found",
                  error: true
            });
      }

      try {
            const { data } = await axios.get(
                  `${process.env.RESTAURANT_SERVICE_URI}/api/v1/orders/internal/current?riderId=${rider._id.toString()}`,
                  {
                        headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! }
                  }
            );
            if (data.success) {
                  return res.status(200).json({
                        success: true,
                        message: "Current order fetched successfully",
                        error: false,
                        data: data.data
                  });
            } else {
                  return res.status(404).json({
                        success: false,
                        message: "No current order found",
                        error: true,
                        data: null
                  });
            }

      } catch (error: any) {
            if (error?.response?.status === 404) {
                  return res.status(404).json({
                        success: false,
                        message: "No current order found",
                        error: true,
                        data: null
                  });
            }
            const message = error?.response?.data?.message ?? error?.message ?? "Failed to fetch current order";
            return res.status(500).json({
                  success: false,
                  message,
                  error: true
            });
      }
});

export const updateOrderStatus = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
      const riderUserId = req.user?._id;

      if (!riderUserId) {
            return res.status(401).json({
                  success: false,
                  message: "User not authenticated",
                  error: true
            });
      }

      const rider = await Rider.findOne({
            userId: riderUserId.toString(),
            isVerified: true
      });

      if (!rider) {
            return res.status(404).json({
                  success: false,
                  message: "Rider profile not found",
                  error: true
            });
      }

      const { orderId, latitude, longitude } = req.body;

      const [riderLng, riderLat] = rider.location.coordinates;

      const effectiveLat = latitude !== undefined ? Number(latitude) : riderLat;
      const effectiveLng = longitude !== undefined ? Number(longitude) : riderLng;

      try {
            const { data } = await axios.patch(`${process.env.RESTAURANT_SERVICE_URI}/api/v1/orders/internal/status`,
                  { orderId, riderId: rider._id.toString(), riderLat: effectiveLat, riderLng: effectiveLng },
                  {
                        headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! }
                  }
            );

            if (data.data?.status === "delivered") {
                  await Rider.findOneAndUpdate(
                        { _id: rider._id },
                        { isAvailable: false }
                  );
            }

            return res.status(200).json({
                  success: true,
                  message: "Order status updated successfully",
                  error: false,
                  data: data.data
            });
      } catch (error: any) {
            const message = error?.response?.data?.message ?? error?.message ?? "Failed to update order status";
            return res.status(error?.response?.status ?? 500).json({
                  success: false,
                  message,
                  error: true
            });
      }
});

export const fetchDeliveryHistory = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
      const riderUserId = req.user?._id;

      if (!riderUserId) {
            return res.status(401).json({
                  success: false,
                  message: "User not authenticated",
                  error: true
            });
      }

      const rider = await Rider.findOne({
            userId: riderUserId.toString(),
            isVerified: true
      });

      if (!rider) {
            return res.status(404).json({
                  success: false,
                  message: "Rider profile not found",
                  error: true
            });
      }

      try {
            const { data } = await axios.get(
                  `${process.env.RESTAURANT_SERVICE_URI}/api/v1/orders/internal/delivery-history?riderId=${rider._id.toString()}`,
                  {
                        headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! }
                  }
            );

            return res.status(200).json({
                  success: true,
                  message: "Delivery history fetched successfully",
                  error: false,
                  data: data.data
            });
      } catch (error: any) {
            const message = error?.response?.data?.message ?? error?.message ?? "Failed to fetch delivery history";
            return res.status(error?.response?.status ?? 500).json({
                  success: false,
                  message,
                  error: true
            });
      }
});