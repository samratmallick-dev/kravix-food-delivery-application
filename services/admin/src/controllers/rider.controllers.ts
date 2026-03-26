import { Response } from "express";
import axios from "axios";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { AdminRequest } from "../middleware/isAdminAuthenticated.js";
import { Rider } from "../models/Rider.js";
import { publishAdminEvent } from "../config/rabbitmq.js";

export const getAllRiders = TryCatch(async (req: AdminRequest, res: Response) => {
      const page = Math.max(1, parseInt(req.query["page"] as string) || 1);
      const limit = Math.min(100, parseInt(req.query["limit"] as string) || 20);
      const { isVerified, isAvailable } = req.query;

      const filter: Record<string, unknown> = {};
      if (isVerified === "true") filter["isVerified"] = true;
      else if (isVerified === "false") filter["isVerified"] = false;
      if (isAvailable === "true") filter["isAvailable"] = true;
      else if (isAvailable === "false") filter["isAvailable"] = false;

      const [riders, total] = await Promise.all([
            Rider.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
            Rider.countDocuments(filter),
      ]);

      return res.status(200).json({
            success: true,
            message: "Riders fetched successfully",
            error: false,
            data: {
                  riders,
                  total,
                  page,
                  pages: Math.ceil(total / limit)
            },
      });
});

export const getRiderById = TryCatch(async (req: AdminRequest, res: Response) => {
      const rider = await Rider.findById(req.params["riderId"]).lean();
      if (!rider) return res.status(404).json({
            success: false,
            message: "Rider not found",
            error: true
      });
      return res.status(200).json({
            success: true,
            message: "Rider fetched successfully",
            error: false,
            data: rider
      });
});

export const verifyRider = TryCatch(async (req: AdminRequest, res: Response) => {
      const { isVerified } = req.body as { isVerified: boolean };
      if (typeof isVerified !== "boolean") {
            return res.status(400).json({
                  success: false,
                  message: "isVerified must be a boolean",
                  error: true
            });
      }

      const rider = await Rider.findByIdAndUpdate(
            req.params["riderId"],
            { isVerified },
            { new: true }
      ).lean();
      if (!rider) return res.status(404).json({
            success: false,
            message: "Rider not found",
            error: true
      });

      const eventData = {
            riderId: rider._id.toString(),
            userId: rider.userId,
            isVerified: rider.isVerified
      };

      axios.post(
            `${process.env.REALTIME_SOCKET_SERVICE_URI}/api/v1/socket/emit`,
            {
                  event: "rider:verified",
                  room: `Rider:${rider._id.toString()}`,
                  payload: eventData,
            },
            { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } }
      ).catch((err) => {
            console.error("Socket emit failed, publishing to admin_event_queue as fallback:", err.message);
            publishAdminEvent("RIDER_VERIFIED", eventData);
      });

      publishAdminEvent("RIDER_VERIFIED", eventData);

      return res.status(200).json({
            success: true,
            message: `Rider ${isVerified ? "verified" : "unverified"} successfully`,
            error: false,
            data: rider,
      });
});

export const deleteRider = TryCatch(async (req: AdminRequest, res: Response) => {
      const rider = await Rider.findByIdAndDelete(req.params["riderId"]);
      if (!rider) return res.status(404).json({
            success: false,
            message: "Rider not found",
            error: true
      });

      publishAdminEvent("RIDER_DELETED", {
            riderId: rider._id.toString(),
            userId: rider.userId,
      });

      return res.status(200).json({
            success: true,
            message: "Rider deleted successfully",
            error: false,
            data: {}
      });
});
