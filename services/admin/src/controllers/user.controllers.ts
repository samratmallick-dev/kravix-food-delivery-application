import { Response } from "express";
import axios from "axios";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { AdminRequest } from "../middleware/isAdminAuthenticated.js";
import { User } from "../models/User.js";
import { Restaurant } from "../models/Restaurant.js";
import { publishAdminEvent } from "../config/rabbitmq.js";

export const getAllUsers = TryCatch(async (req: AdminRequest, res: Response) => {
      const page = Math.max(1, parseInt(req.query["page"] as string) || 1);
      const limit = Math.min(100, parseInt(req.query["limit"] as string) || 20);
      const { role } = req.query;

      const filter: Record<string, unknown> = {};
      if (role === "null") filter["role"] = null;
      else if (role) filter["role"] = role;

      const [users, total] = await Promise.all([
            User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
            User.countDocuments(filter),
      ]);

      return res.status(200).json({
            success: true, message: "Users fetched successfully", error: false,
            data: {
                  users,
                  total,
                  page,
                  pages: Math.ceil(total / limit)
            },
      });
});

export const getUserById = TryCatch(async (req: AdminRequest, res: Response) => {
      const user = await User.findById(req.params["userId"]).lean();
      if (!user) return res.status(404).json({
            success: false,
            message: "User not found",
            error: true
      });
      return res.status(200).json({
            success: true,
            message: "User fetched successfully",
            error: false,
            data: user
      });
});

const VALID_ROLES = ["customer", "seller", "rider"];

export const updateUser = TryCatch(async (req: AdminRequest, res: Response) => {
      const { name, email, role } = req.body as { name?: string; email?: string; role?: string };

      if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: "Invalid email format", error: true });
      }
      if (role !== undefined && !VALID_ROLES.includes(role)) {
            return res.status(400).json({ success: false, message: `Role must be one of: ${VALID_ROLES.join(", ")}`, error: true });
      }

      const updates: Record<string, unknown> = {};
      if (name !== undefined) updates["name"] = name.trim();
      if (email !== undefined) updates["email"] = email.toLowerCase().trim();
      if (role !== undefined) updates["role"] = role;

      if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: "No valid fields to update", error: true });
      }

      const user = await User.findByIdAndUpdate(
            req.params["userId"],
            updates,
            { new: true, runValidators: true }
      ).lean();

      if (!user) return res.status(404).json({ success: false, message: "User not found", error: true });

      const eventData = { userId: user._id.toString(), name: user.name, email: user.email, role: user.role };

      axios.post(
            `${process.env.REALTIME_SOCKET_SERVICE_URI}/api/v1/socket/events`,
            { event: "admin:user:updated", room: `User:${user._id.toString()}`, payload: eventData },
            { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } }
      ).catch((err) => {
            console.error("Socket emit failed for user update:", err.message);
            publishAdminEvent("USER_UPDATED", eventData);
      });

      publishAdminEvent("USER_UPDATED", eventData);

      return res.status(200).json({ success: true, message: "User updated successfully", error: false, data: user });
});

const BLOCK_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export const blockUser = TryCatch(async (req: AdminRequest, res: Response) => {
      const user = await User.findById(req.params["userId"]);
      if (!user) return res.status(404).json({ success: false, message: "User not found", error: true });

      const now = new Date();
      const isCurrentlyBlocked = user.isBlocked && user.blockedUntil && user.blockedUntil > now;

      if (isCurrentlyBlocked) {
            user.isBlocked = false;
            user.blockedUntil = null;
      } else {
            user.isBlocked = true;
            user.blockedUntil = new Date(now.getTime() + BLOCK_DURATION_MS);
      }

      await user.save();

      let restaurantId: string | null = null;
      if (user.role === "seller") {
            const restaurant = await Restaurant.findOne({ ownerId: user._id.toString() }).select("_id").lean();
            restaurantId = restaurant?._id?.toString() ?? null;
      }

      publishAdminEvent("USER_BLOCK_STATUS_CHANGED", {
            userId: user._id.toString(),
            role: user.role ?? null,
            isBlocked: user.isBlocked,
            blockedUntil: user.blockedUntil?.toISOString() ?? null,
            restaurantId,
      });

      return res.status(200).json({
            success: true,
            message: user.isBlocked ? "User blocked for 7 days" : "User unblocked",
            error: false,
            data: { isBlocked: user.isBlocked, blockedUntil: user.blockedUntil }
      });
});
