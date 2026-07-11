import axios from "axios";
import { Response } from "express";
import { getBuffer } from "../config/datauri.js";
import { AuthenticatedRequest } from "../middleware/authenticate.js";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { riderService } from "../services/index.js";
import { createRiderSchema, updateRiderLocationSchema, toggleAvailabilitySchema } from "../validators/RiderValidator.js";
import { ValidationError, AuthenticationError } from "../utils/errors.js";
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

    const { phoneNumber, aadhaarNumber, drivingLicesce, latitude, longitude, pictureUrl } = req.body;
    const validated = createRiderSchema.parse({ phoneNumber, aadhaarNumber, drivingLicesce, latitude, longitude, pictureUrl });

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

    const { phoneNumber, aadhaarNumber, drivingLicesce, pictureUrl, address, emergencyContact } = req.body;
    const updates: any = {};
    if (phoneNumber) updates.phoneNumber = phoneNumber;
    if (aadhaarNumber) updates.aadhaarNumber = aadhaarNumber;
    if (drivingLicesce) updates.drivingLicesce = drivingLicesce;
    if (address) updates.address = address;
    if (emergencyContact) {
      try {
        updates.emergencyContact = typeof emergencyContact === "string" ? JSON.parse(emergencyContact) : emergencyContact;
      } catch (e) {
        updates.emergencyContact = emergencyContact;
      }
    }

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

    return successResponse(res, 200, `Rider availability updated`, data);
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

export const startShiftController = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) throw new AuthenticationError("User not authenticated");
    const data = await riderService.startShift(user._id.toString());
    return successResponse(res, 200, "Shift started successfully", data);
  }
);

export const endShiftController = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) throw new AuthenticationError("User not authenticated");
    const data = await riderService.endShift(user._id.toString());
    return successResponse(res, 200, "Shift ended successfully", data);
  }
);

export const pauseShiftController = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) throw new AuthenticationError("User not authenticated");
    const data = await riderService.pauseShift(user._id.toString());
    return successResponse(res, 200, "Shift paused successfully", data);
  }
);

export const resumeShiftController = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) throw new AuthenticationError("User not authenticated");
    const data = await riderService.resumeShift(user._id.toString());
    return successResponse(res, 200, "Shift resumed successfully", data);
  }
);

export const getShiftHistoryController = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) throw new AuthenticationError("User not authenticated");
    const data = await riderService.getShiftHistory(user._id.toString());
    return successResponse(res, 200, "Shift history fetched successfully", data);
  }
);

export const getVehicleController = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) throw new AuthenticationError("User not authenticated");
    const data = await riderService.getVehicle(user._id.toString());
    return successResponse(res, 200, "Vehicle details fetched successfully", data);
  }
);

export const updateVehicleController = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) throw new AuthenticationError("User not authenticated");
    const data = await riderService.updateVehicle(user._id.toString(), req.body);
    return successResponse(res, 200, "Vehicle details updated successfully", data);
  }
);

export const getWalletSummaryController = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) throw new AuthenticationError("User not authenticated");
    const data = await riderService.getWalletSummary(user._id.toString());
    return successResponse(res, 200, "Wallet summary fetched successfully", data);
  }
);

export const getWalletTransactionsController = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) throw new AuthenticationError("User not authenticated");
    const data = await riderService.getWalletTransactions(user._id.toString());
    return successResponse(res, 200, "Transactions history fetched successfully", data);
  }
);

export const getWalletSettlementsController = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) throw new AuthenticationError("User not authenticated");
    const data = await riderService.getWalletSettlements(user._id.toString());
    return successResponse(res, 200, "Settlements history fetched successfully", data);
  }
);

export const withdrawFundsController = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) throw new AuthenticationError("User not authenticated");
    const { amount } = req.body;
    if (!amount || Number(amount) <= 0) throw new ValidationError("Invalid amount requested");
    const data = await riderService.withdrawFunds(user._id.toString(), Number(amount));
    return successResponse(res, 200, "Withdrawal initiated successfully", data);
  }
);

export const configureBankDetailsController = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) throw new AuthenticationError("User not authenticated");
    const data = await riderService.configureBankDetails(user._id.toString(), req.body);
    return successResponse(res, 200, "Bank details configured successfully", data);
  }
);

export const getDocumentsController = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) throw new AuthenticationError("User not authenticated");
    const data = await riderService.getDocuments(user._id.toString());
    return successResponse(res, 200, "Documents details fetched successfully", data);
  }
);

export const uploadDocumentController = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) throw new AuthenticationError("User not authenticated");
    
    const { pictureUrl, drivingLicenseUrl, aadhaarUrl } = req.body;
    const updates: any = {};
    if (pictureUrl) updates.pictureUrl = pictureUrl;
    if (drivingLicenseUrl) updates.drivingLicenseUrl = drivingLicenseUrl;
    if (aadhaarUrl) updates.aadhaarUrl = aadhaarUrl;

    const file = req.file;
    if (file) {
      const fileBuffer = getBuffer(file);
      if (!fileBuffer) {
        throw new ValidationError("Error processing the uploaded document file");
      }

      const { data: uploadResult } = await axios.post(
        `${process.env.UTILS_SERVICE_URI}/api/v1/uploads/images`,
        { image: fileBuffer },
        { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! } }
      );
      updates.drivingLicenseUrl = uploadResult.data.url;
    }

    const data = await riderService.uploadDocument(user._id.toString(), updates);
    return successResponse(res, 200, "Document uploaded successfully", data);
  }
);

export const getNotificationsController = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) throw new AuthenticationError("User not authenticated");
    const data = await riderService.getNotifications(user._id.toString());
    return successResponse(res, 200, "Notifications fetched successfully", data);
  }
);

export const markNotificationReadController = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) throw new AuthenticationError("User not authenticated");
    const { id } = req.params;
    if (!id) throw new ValidationError("Notification ID is required");
    const data = await riderService.markNotificationRead(user._id.toString(), id as string);
    return successResponse(res, 200, "Notification marked as read", data);
  }
);

export const markAllNotificationsReadController = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) throw new AuthenticationError("User not authenticated");
    await riderService.markAllNotificationsRead(user._id.toString());
    return successResponse(res, 200, "All notifications marked as read");
  }
);

export const getPerformanceStatisticsController = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) throw new AuthenticationError("User not authenticated");
    const data = await riderService.getPerformanceStatistics(user._id.toString());
    return successResponse(res, 200, "Performance statistics fetched successfully", data);
  }
);

export const getLeaderboardController = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const data = await riderService.getLeaderboard();
    return successResponse(res, 200, "Leaderboard fetched successfully", data);
  }
);

export const getAnalyticsController = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) throw new AuthenticationError("User not authenticated");
    const data = await riderService.getAnalytics(user._id.toString());
    return successResponse(res, 200, "Rider analytics fetched successfully", data);
  }
);
