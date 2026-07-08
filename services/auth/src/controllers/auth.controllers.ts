import { Request, Response } from "express";
import mongoose from "mongoose";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { AuthenticatedRequest } from "../middleware/isAuthenticated.js";
import { User } from "../model/User.js";
import { generateToken } from "../services/jwt.service.js";
import { registerWithEmailService } from "../services/emailRegistration.service.js";
import { registerWithGoogleService } from "../services/googleRegistration.service.js";
import { loginWithEmailService } from "../services/emailLogin.service.js";
import { loginWithGoogleService } from "../services/googleLogin.service.js";
import { verifyEmailService, resendVerificationEmailService } from "../services/emailVerification.service.js";
import { forgotPasswordService, resetPasswordService } from "../services/passwordReset.service.js";
import { publishAuthEvent } from "../config/authPublisher.js";

const dbReady = (res: Response): boolean => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ success: false, message: "Service temporarily unavailable. Please try again.", error: true });
    return false;
  }
  return true;
};


export const registerEmailController = TryCatch(async (req: Request, res: Response) => {
  if (!dbReady(res)) return;
  const { name, email, password } = req.body as { name: string; email: string; password: string };
  await registerWithEmailService(name, email, password);
  return res.status(201).json({
    success: true,
    message: "Registration successful. Please verify your email before signing in.",
    error: false,
  });
});

export const registerGoogleController = TryCatch(async (req: Request, res: Response) => {
  if (!dbReady(res)) return;
  const { code } = req.body as { code: string };
  if (!code) {
    return res.status(400).json({ success: false, message: "Authorization code is required", error: true });
  }
  await registerWithGoogleService(code);
  return res.status(201).json({
    success: true,
    message: "Registration successful. Please verify your email before signing in.",
    error: false,
  });
});


export const loginEmailController = TryCatch(async (req: Request, res: Response) => {
  if (!dbReady(res)) return;
  const { email, password } = req.body as { email: string; password: string };
  const user = await loginWithEmailService(email, password);
  const token = generateToken(user);
  return res.status(200).json({
    success: true,
    message: "Login successful",
    error: false,
    token,
    needsRoleSelection: !user.role,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role ?? null,
      isEmailVerified: user.isEmailVerified,
      authProviders: user.authProviders,
      image: user.image,
    },
  });
});

export const loginGoogleController = TryCatch(async (req: Request, res: Response) => {
  if (!dbReady(res)) return;
  const { code } = req.body as { code: string };
  if (!code) {
    return res.status(400).json({ success: false, message: "Authorization code is required", error: true });
  }
  const user = await loginWithGoogleService(code);
  const token = generateToken(user);
  return res.status(200).json({
    success: true,
    message: "Login successful",
    error: false,
    token,
    needsRoleSelection: !user.role,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role ?? null,
      isEmailVerified: user.isEmailVerified,
      authProviders: user.authProviders,
      image: user.image,
    },
  });
});


export const verifyEmailController = TryCatch(async (req: Request, res: Response) => {
  const { token } = req.query as { token?: string };
  if (!token) {
    return res.status(400).json({ success: false, message: "Verification link is invalid or has expired.", error: true });
  }
  await verifyEmailService(token);
  return res.status(200).json({ success: true, message: "Email verified successfully. You can now sign in.", error: false });
});

export const resendVerificationController = TryCatch(async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };
  await resendVerificationEmailService(email);
  return res.status(200).json({
    success: true,
    message: "If your email is registered and unverified, a new verification link has been sent.",
    error: false,
  });
});


export const forgotPasswordController = TryCatch(async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };
  await forgotPasswordService(email);
  return res.status(200).json({
    success: true,
    message: "If an account with that email exists, a password reset link has been sent.",
    error: false,
  });
});

export const resetPasswordController = TryCatch(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body as { token: string; newPassword: string };
  await resetPasswordService(token, newPassword);
  return res.status(200).json({ success: true, message: "Password reset successful. You can now sign in.", error: false });
});

// ─── Profile ──────────────────────────────────────────────────────────────────

export const getUserProfile = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized user", error: true, user: null });
  }
  return res.status(200).json({
    success: true,
    message: "User profile retrieved successfully",
    error: false,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role ?? null,
      restaurantId: (user as { restaurantId?: string }).restaurantId ?? null,
    },
  });
});

export const updateUserProfile = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized user", error: true });
  }

  const { name, image } = req.body as { name?: string; image?: string };

  if (name !== undefined && (name.trim().length < 2 || name.trim().length > 50)) {
    return res.status(400).json({ success: false, message: "Name must be between 2 and 50 characters.", error: true });
  }

  const updates: { name?: string; image?: string } = {};
  if (name !== undefined) updates.name = name.trim();
  if (image !== undefined) updates.image = image;

  const updatedUser = await User.findByIdAndUpdate(user._id, updates, { returnDocument: "after" });
  if (!updatedUser) {
    return res.status(404).json({ success: false, message: "User not found", error: true });
  }

  const token = generateToken(updatedUser);
  return res.status(200).json({ success: true, message: "Profile updated successfully", error: false, token, data: updatedUser });
});


const ALLOWED_ROLES = ["customer", "rider", "seller"] as const;
type AllowedRole = (typeof ALLOWED_ROLES)[number];

export const addUserRole = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized user", error: true });
  }

  const { role } = req.body as { role: AllowedRole };
  if (!ALLOWED_ROLES.includes(role)) {
    return res.status(400).json({ success: false, message: "Invalid role", error: true });
  }

  const updatedUser = await User.findByIdAndUpdate(user._id, { role }, { returnDocument: "after" });
  if (!updatedUser) {
    return res.status(404).json({ success: false, message: "User not found", error: true });
  }

  const token = generateToken(updatedUser);

  publishAuthEvent("USER_ROLE_UPDATED", {
    userId: updatedUser._id.toString(),
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role ?? null,
  });

  return res.status(200).json({ success: true, message: "Role Updated Successfully", token, data: updatedUser });
});
