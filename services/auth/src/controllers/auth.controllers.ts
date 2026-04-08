import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import axios from "axios";
import { google } from "googleapis";
import mongoose from "mongoose";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { User } from "../model/User.js";
import { AuthenticatedRequest } from "../middleware/isAuthenticated.js";

interface TokenPayload {
      _id: string;
      name: string;
      email: string;
      image: string;
      role: string | null;
}

const tokengenerator = (user: TokenPayload): string => {
      const secretkey = process.env.JWT_SECRET;
      if (!secretkey) throw new Error("JWT_SECRET environment variable is not set");
      return jwt.sign(user, secretkey, { expiresIn: "15d" });
};

const usedCodes = new Set<string>();

export const loginController = TryCatch(async (req: Request, res: Response) => {

      if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                  success: false,
                  message: "Service temporarily unavailable. Please try again.",
                  error: true,
            });
      }

      const { code } = req.body;

      if (!code) {
            return res.status(400).json({
                  success: false,
                  message: "Authorization code is required",
                  error: true,
            });
      }

      if (usedCodes.has(code)) {
            return res.status(400).json({
                  success: false,
                  message: "Authorization code has already been used. Please try logging in again.",
                  error: true,
            });
      }

      usedCodes.add(code);

      setTimeout(() => usedCodes.delete(code), 5 * 60 * 1000);

      const freshClient = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            "postmessage"
      );

      let googleResponse;
      try {
            googleResponse = await freshClient.getToken(code);
      } catch (err: any) {
            usedCodes.delete(code);
            const msg =
                  err?.response?.data?.error_description ||
                  err?.message ||
                  "Google token exchange failed";
            return res.status(401).json({ success: false, message: msg, error: true });
      }

      if (!googleResponse.tokens.access_token) {
            usedCodes.delete(code);
            return res.status(401).json({
                  success: false,
                  message: "Failed to obtain access token from Google",
                  error: true,
            });
      }

      let userResponse;
      try {
            userResponse = await axios.get(
                  `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleResponse.tokens.access_token}`
            );
      } catch (err: any) {
            const msg =
                  err?.response?.data?.error_description ||
                  err?.message ||
                  "Failed to fetch user info from Google";
            return res.status(401).json({ success: false, message: msg, error: true });
      }

      const { email, name, picture } = userResponse.data;

      let user = await User.findOne({ email });

      if (!user) {
            user = await User.create({ email, name, image: picture });
      }

      const token = tokengenerator({
            _id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role ?? null,
      });

      return res.status(200).json({
            success: true,
            message: "Login successful",
            error: false,
            token,
            data: user,
      });
});

const allowedRole = ["customer", "rider", "seller"] as const;
type AllowedRoleType = (typeof allowedRole)[number];

export const addUserRole = TryCatch(async (req: AuthenticatedRequest, res) => {
      const user = req.user;

      if (!user) {
            return res.status(401).json({
                  success: false,
                  message: "Unauthorized user",
                  error: true,
            });
      }

      const { role } = req.body as { role: AllowedRoleType };

      if (!allowedRole.includes(role)) {
            return res.status(400).json({
                  success: false,
                  message: "Invalid role",
                  error: true,
            });
      }

      const updateUser = await User.findByIdAndUpdate(
            user._id,
            { role },
            { returnDocument: "after" }
      );

      if (!updateUser) {
            return res.status(404).json({
                  success: false,
                  message: "User not found",
                  error: true,
            });
      }

      const token = tokengenerator({
            _id: updateUser._id.toString(),
            name: updateUser.name,
            email: updateUser.email,
            image: updateUser.image,
            role: updateUser.role ?? null,
      });

      return res.status(200).json({
            success: true,
            message: "Role Updated Successfully",
            token,
            data: updateUser,
      });
});

export const getUserProfile = TryCatch(async (req: AuthenticatedRequest, res) => {
      const user = req.user;

      if (!user) {
            return res.status(401).json({
                  success: false,
                  message: "Unauthorized user",
                  error: true,
                  user: null,
            });
      }

      const freshUser = await User.findById(user._id).lean();

      return res.status(200).json({
            success: true,
            message: "User profile retrieved successfully",
            error: false,
            data: { ...freshUser, restaurantId: (user as any).restaurantId ?? null },
      });
});