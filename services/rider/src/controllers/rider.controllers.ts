import axios from "axios";
import { Request, Response } from "express";
import { getBuffer } from "../config/datauri.js";
import { AuthenticatedRequest } from "../middleware/authenticate.js";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { riderService } from "../services/index.js";
import { createRiderSchema, updateRiderLocationSchema, toggleAvailabilitySchema } from "../validators/RiderValidator.js";
import { ValidationError, AuthenticationError, AuthorizationError } from "../utils/errors.js";
import { successResponse, errorResponse } from "../utils/response.js";

export const addRiderProfile = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) {
      throw new AuthenticationError("User not authenticated");
    }
    if (user.role !== "rider") {
      return errorResponse(res, 403, "Access denied. Riders only.", "FORBIDDEN");
    }

    const { phoneNumber, aadhaarNumber, drivingLicesce, latitude, longitude, pictureUrl, panNumber } = req.body;
    const validated = createRiderSchema.parse({ phoneNumber, aadhaarNumber, drivingLicesce, panNumber, latitude, longitude, pictureUrl });

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
        `${process.env.UTILS_SERVICE_URI}/api/v1/uploads/images`,
        { image: fileBuffer },
        { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! } }
      );
      resolvedPictureUrl = uploadResult.data.url;
    }

    const data = await riderService.createProfile(user._id.toString(), {
      phoneNumber: validated.phoneNumber,
      aadhaarNumber: validated.aadhaarNumber,
      drivingLicesce: validated.drivingLicesce,
      panNumber: validated.panNumber,
      latitude: validated.latitude,
      longitude: validated.longitude,
      pictureUrl: resolvedPictureUrl
    });

    return successResponse(res, 201, "Rider profile created successfully", data);
  }
);

export const updateRiderProfile = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) {
      throw new AuthenticationError("User not authenticated");
    }
    if (user.role !== "rider") {
      return errorResponse(res, 403, "Access denied. Riders only.", "FORBIDDEN");
    }

    const { phoneNumber, aadhaarNumber, drivingLicesce, pictureUrl, panNumber } = req.body;
    const updates: any = {};
    if (phoneNumber) updates.phoneNumber = phoneNumber;
    if (aadhaarNumber) updates.aadhaarNumber = aadhaarNumber;
    if (drivingLicesce) updates.drivingLicesce = drivingLicesce;
    if (panNumber) updates.panNumber = panNumber.toUpperCase();

    const file = req.file;
    if (file) {
      const fileBuffer = getBuffer(file);
      if (!fileBuffer) {
        throw new ValidationError("Error processing the image file");
      }

      const { data: uploadResult } = await axios.post(
        `${process.env.UTILS_SERVICE_URI}/api/v1/uploads/images`,
        { image: fileBuffer },
        { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! } }
      );
      updates.picture = uploadResult.data.url;
    } else if (pictureUrl) {
      updates.picture = pictureUrl;
    }

    if (Object.keys(updates).length === 0) {
      throw new ValidationError("No fields to update");
    }

    const data = await riderService.updateProfile(user._id.toString(), updates);
    return successResponse(res, 200, "Rider profile updated successfully", data);
  }
);

export const fetchMyProfile = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) {
      throw new AuthenticationError("User not authenticated");
    }
    if (user.role !== "rider") {
      return errorResponse(res, 403, "Access denied. Riders only.", "FORBIDDEN");
    }

    const data = await riderService.getProfile(user._id.toString());
    return successResponse(res, 200, "Rider profile fetched successfully", data);
  }
);

export const toggleRiderAvailability = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) {
      throw new AuthenticationError("User not authenticated");
    }
    if (user.role !== "rider") {
      return errorResponse(res, 403, "Access denied. Riders only.", "FORBIDDEN");
    }

    const { isAvailable, latitude, longitude } = req.body;
    const validated = toggleAvailabilitySchema.parse({ isAvailable, latitude, longitude });

    const data = await riderService.toggleAvailability(
      user._id.toString(),
      validated.isAvailable,
      validated.latitude,
      validated.longitude
    );

    return successResponse(res, 200, `Rider is now ${validated.isAvailable ? "available" : "unavailable"}`, data);
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
    return successResponse(res, 200, "Order accepted successfully", data);
  }
);

export const fetchCurrentOrder = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) {
      throw new AuthenticationError("User not authenticated");
    }

    const data = await riderService.getCurrentOrder(user._id.toString());
    return successResponse(res, 200, "Current order fetched successfully", data);
  }
);

export const updateOrderStatus = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) {
      throw new AuthenticationError("User not authenticated");
    }

    const data = await riderService.updateOrderStatus(user._id.toString(), req.body);
    return successResponse(res, 200, "Order status updated successfully", data);
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
    return successResponse(res, 200, "OTP generated and sent to customer");
  }
);

export const updateLiveLocation = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) {
      throw new AuthenticationError("User not authenticated");
    }

    const { latitude, longitude, orderId, customerUserId } = req.body;
    const validated = updateRiderLocationSchema.parse({ latitude, longitude, orderId, customerUserId });

    await riderService.updateLiveLocation(user._id.toString(), validated);
    return successResponse(res, 200, "Location updated successfully");
  }
);

export const fetchEarnings = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) {
      throw new AuthenticationError("User not authenticated");
    }

    const data = await riderService.getEarnings(user._id.toString());
    return successResponse(res, 200, "Earnings fetched successfully", data);
  }
);

export const fetchDeliveryHistory = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) {
      throw new AuthenticationError("User not authenticated");
    }

    const data = await riderService.getDeliveryHistory(user._id.toString());
    return successResponse(res, 200, "Delivery history fetched successfully", data);
  }
);

export const getRiderLocation = TryCatch(
  async (req: Request<{ riderId: string }>, res: Response) => {
    const { riderId } = req.params;
    const data = await riderService.getRiderLocation(riderId);
    return successResponse(res, 200, "Rider location fetched", data);
  }
);
