import axios from "axios";
import { Response } from "express";
import { getBuffer } from "../config/datauri.js";
import { AuthenticatedRequest } from "../middleware/authenticate.js";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { riderService } from "../services/index.js";
import { createRiderSchema, updateRiderLocationSchema, toggleAvailabilitySchema } from "../validators/RiderValidator.js";
import { ValidationError, AuthenticationError } from "../utils/errors.js";

export const addRiderProfile = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) {
      throw new AuthenticationError("User not authenticated");
    }
    if (user.role !== "rider") {
      res.status(403).json({ success: false, message: "Access denied. Riders only.", error: true });
      return;
    }

    const { phoneNumber, aadhaarNumber, drivingLicesce, latitude, longitude, pictureUrl } = req.body;
    const validated = createRiderSchema.parse({
      phoneNumber,
      aadhaarNumber,
      drivingLicesce,
      latitude,
      longitude,
      pictureUrl
    });

    let resolvedPictureUrl = validated.pictureUrl || "";
    if (!resolvedPictureUrl) {
      const file = req.file;
      if (!file) {
        throw new ValidationError("Rider Profile image is required");
      }

      const fileBuffer = getBuffer(file);
      if (!fileBuffer) {
        throw new ValidationError("Error processing the image file");
      }

      const { data: uploadResult } = await axios.post(
        `${process.env.UTILS_SERVICE_URI}/api/v1/cloudinary/images`,
        { image: fileBuffer },
        { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! } }
      );
      resolvedPictureUrl = uploadResult.url;
    }

    const data = await riderService.createProfile(user._id.toString(), {
      phoneNumber: validated.phoneNumber,
      aadhaarNumber: validated.aadhaarNumber,
      drivingLicesce: validated.drivingLicesce,
      latitude: validated.latitude,
      longitude: validated.longitude,
      pictureUrl: resolvedPictureUrl
    });

    res.status(201).json({
      success: true,
      message: "Rider profile created successfully",
      error: false,
      data
    });
  }
);

export const updateRiderProfile = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) {
      throw new AuthenticationError("User not authenticated");
    }
    if (user.role !== "rider") {
      res.status(403).json({ success: false, message: "Access denied. Riders only.", error: true });
      return;
    }

    const { phoneNumber, aadhaarNumber, drivingLicesce, pictureUrl } = req.body;
    const updates: any = {};
    if (phoneNumber) updates.phoneNumber = phoneNumber;
    if (aadhaarNumber) updates.aadhaarNumber = aadhaarNumber;
    if (drivingLicesce) updates.drivingLicesce = drivingLicesce;

    const file = req.file;
    if (file) {
      const fileBuffer = getBuffer(file);
      if (!fileBuffer) {
        throw new ValidationError("Error processing the image file");
      }

      const { data: uploadResult } = await axios.post(
        `${process.env.UTILS_SERVICE_URI}/api/v1/cloudinary/images`,
        { image: fileBuffer },
        { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! } }
      );
      updates.picture = uploadResult.url;
    } else if (pictureUrl) {
      updates.picture = pictureUrl;
    }

    if (Object.keys(updates).length === 0) {
      throw new ValidationError("No fields to update");
    }

    const data = await riderService.updateProfile(user._id.toString(), updates);

    res.status(200).json({
      success: true,
      message: "Rider profile updated successfully",
      error: false,
      data
    });
  }
);

export const fetchMyProfile = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) {
      throw new AuthenticationError("User not authenticated");
    }
    if (user.role !== "rider") {
      res.status(403).json({ success: false, message: "Access denied. Riders only.", error: true });
      return;
    }

    const data = await riderService.getProfile(user._id.toString());

    res.status(200).json({
      success: true,
      message: "Rider profile fetched successfully",
      error: false,
      data
    });
  }
);

export const toggleRiderAvailability = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) {
      throw new AuthenticationError("User not authenticated");
    }
    if (user.role !== "rider") {
      res.status(403).json({ success: false, message: "Access denied. Riders only.", error: true });
      return;
    }

    const { isAvailable, latitude, longitude } = req.body;
    const validated = toggleAvailabilitySchema.parse({ isAvailable, latitude, longitude });

    const data = await riderService.toggleAvailability(
      user._id.toString(),
      validated.isAvailable,
      validated.latitude,
      validated.longitude
    );

    res.status(200).json({
      success: true,
      message: `Rider is now ${validated.isAvailable ? "available" : "unavailable"}`,
      error: false,
      data
    });
  }
);

export const acceptOrder = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) {
      throw new AuthenticationError("User not authenticated");
    }

    const { orderId } = req.params;
    if (!orderId) {
      throw new ValidationError("Order ID is required");
    }

    const data = await riderService.acceptOrder(user._id.toString(), user.name, orderId as string);

    res.status(200).json({
      success: true,
      message: "Order accepted successfully",
      error: false,
      data
    });
  }
);

export const fetchCurrentOrder = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) {
      throw new AuthenticationError("User not authenticated");
    }

    const data = await riderService.getCurrentOrder(user._id.toString());

    res.status(200).json({
      success: true,
      message: "Current order fetched successfully",
      error: false,
      data
    });
  }
);

export const updateOrderStatus = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) {
      throw new AuthenticationError("User not authenticated");
    }

    const data = await riderService.updateOrderStatus(user._id.toString(), req.body);

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      error: false,
      data
    });
  }
);

export const generateDeliveryOtp = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) {
      throw new AuthenticationError("User not authenticated");
    }

    const { orderId } = req.body;
    if (!orderId) {
      throw new ValidationError("Order ID is required");
    }

    await riderService.generateDeliveryOtp(user._id.toString(), orderId);

    res.status(200).json({
      success: true,
      message: "OTP generated and sent to customer",
      error: false
    });
  }
);

export const updateLiveLocation = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) {
      throw new AuthenticationError("User not authenticated");
    }

    const { latitude, longitude, orderId, customerUserId } = req.body;
    const validated = updateRiderLocationSchema.parse({
      latitude,
      longitude,
      orderId,
      customerUserId
    });

    await riderService.updateLiveLocation(user._id.toString(), validated);

    res.status(200).json({
      success: true,
      error: false
    });
  }
);

export const fetchEarnings = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) {
      throw new AuthenticationError("User not authenticated");
    }

    const data = await riderService.getEarnings(user._id.toString());

    res.status(200).json({
      success: true,
      message: "Earnings fetched successfully",
      error: false,
      data
    });
  }
);

export const fetchDeliveryHistory = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) {
      throw new AuthenticationError("User not authenticated");
    }

    const data = await riderService.getDeliveryHistory(user._id.toString());

    res.status(200).json({
      success: true,
      message: "Delivery history fetched successfully",
      error: false,
      data
    });
  }
);
