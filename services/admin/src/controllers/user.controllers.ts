import { Response } from "express";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { AdminRequest } from "../middleware/isAdminAuthenticated.js";
import { User } from "../models/User.js";
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

export const deleteUser = TryCatch(async (req: AdminRequest, res: Response) => {
      const user = await User.findByIdAndDelete(req.params["userId"]);
      if (!user) return res.status(404).json({
            success: false,
            message: "User not found",
            error: true
      });
      publishAdminEvent("USER_DELETED", {
            userId: user._id.toString(),
            role: user.role ?? null,
      });

      return res.status(200).json({
            success: true,
            message: "User deleted successfully",
            error: false,
            data: {}
      });
});
