import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { AuthenticatedRequest } from "../middleware/isAuthenticated.js";
import { AuthValidator } from "../validators/auth.validator.js";
import { AuthResponseMapper } from "../mappers/auth-response.mapper.js";
import {
  registrationService,
  googleRegistrationService,
  emailLoginService,
  googleLoginService,
  verificationService,
  passwordResetService,
  profileService,
  jwtService
} from "../services/index.js";
import { DatabaseError } from "../utils/errors.js";

const checkDbReady = (): void => {
  if (mongoose.connection.readyState !== 1) {
    throw new DatabaseError("Service temporarily unavailable. Please try again.");
  }
};

export const registerEmailController = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  checkDbReady();
  const validData = AuthValidator.validateRegister(req.body);
  await registrationService.register(validData.name, validData.email, validData.password);
  return res.status(201).json({
    success: true,
    message: "Registration successful. Please verify your email before signing in.",
    error: false
  });
});

export const registerGoogleController = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  checkDbReady();
  const { code } = req.body as { code?: string };
  if (!code) {
    return res.status(400).json({ success: false, message: "Authorization code is required", error: true });
  }
  await googleRegistrationService.registerWithGoogle(code);
  return res.status(201).json({
    success: true,
    message: "Registration successful. Please verify your email before signing in.",
    error: false
  });
});

export const loginEmailController = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  checkDbReady();
  const validData = AuthValidator.validateLogin(req.body);
  const user = await emailLoginService.login(validData.email, validData.password);
  const token = jwtService.generateToken(user);
  return res.status(200).json({
    success: true,
    message: "Login successful",
    error: false,
    token,
    needsRoleSelection: !user.role,
    user: AuthResponseMapper.toResponseDto(user)
  });
});

export const loginGoogleController = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  checkDbReady();
  const { code } = req.body as { code?: string };
  if (!code) {
    return res.status(400).json({ success: false, message: "Authorization code is required", error: true });
  }
  const user = await googleLoginService.loginWithGoogle(code);
  const token = jwtService.generateToken(user);
  return res.status(200).json({
    success: true,
    message: "Login successful",
    error: false,
    token,
    needsRoleSelection: !user.role,
    user: AuthResponseMapper.toResponseDto(user)
  });
});

export const verifyEmailController = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  const { token } = req.query as { token?: string };
  if (!token) {
    return res.status(400).json({ success: false, message: "Verification link is invalid or has expired.", error: true });
  }
  await verificationService.verifyEmail(token);
  return res.status(200).json({ success: true, message: "Email verified successfully. You can now sign in.", error: false });
});

export const resendVerificationController = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body as { email?: string };
  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required", error: true });
  }
  await verificationService.resendVerification(email);
  return res.status(200).json({
    success: true,
    message: "If your email is registered and unverified, a new verification link has been sent.",
    error: false
  });
});

export const forgotPasswordController = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body as { email?: string };
  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required", error: true });
  }
  await passwordResetService.forgotPassword(email);
  return res.status(200).json({
    success: true,
    message: "If an account with that email exists, a password reset link has been sent.",
    error: false
  });
});

export const resetPasswordController = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  const validData = AuthValidator.validateResetPassword(req.body);
  await passwordResetService.resetPassword(validData.token, validData.newPassword);
  return res.status(200).json({ success: true, message: "Password reset successful. You can now sign in.", error: false });
});

export const getUserProfile = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userPayload = req.user;
  if (!userPayload || !userPayload._id) {
    return res.status(401).json({ success: false, message: "Unauthorized user", error: true, user: null });
  }
  const user = await profileService.getUserProfile(userPayload._id.toString());
  return res.status(200).json({
    success: true,
    message: "User profile retrieved successfully",
    error: false,
    data: AuthResponseMapper.toResponseDto(user)
  });
});

export const updateUserProfile = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userPayload = req.user;
  if (!userPayload || !userPayload._id) {
    return res.status(401).json({ success: false, message: "Unauthorized user", error: true });
  }
  const validData = AuthValidator.validateProfileUpdate(req.body);
  const updatedUser = await profileService.updateUserProfile(userPayload._id.toString(), validData.name, validData.image);
  const token = jwtService.generateToken(updatedUser);
  return res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    error: false,
    token,
    data: AuthResponseMapper.toResponseDto(updatedUser)
  });
});

export const addUserRole = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userPayload = req.user;
  if (!userPayload || !userPayload._id) {
    return res.status(401).json({ success: false, message: "Unauthorized user", error: true });
  }
  const validData = AuthValidator.validateRole(req.body);
  const updatedUser = await profileService.addUserRole(userPayload._id.toString(), validData.role);
  const token = jwtService.generateToken(updatedUser);
  return res.status(200).json({
    success: true,
    message: "Role Updated Successfully",
    token,
    data: AuthResponseMapper.toResponseDto(updatedUser)
  });
});
