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
import { successResponse, errorResponse } from "../utils/response.js";

const checkDbReady = (): void => {
  if (mongoose.connection.readyState !== 1) {
    throw new DatabaseError("Service temporarily unavailable. Please try again.");
  }
};

export const registerEmailController = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  checkDbReady();
  await registrationService.register(req.body.name, req.body.email, req.body.password);
  return successResponse(res, 201, "Registration successful. Please verify your email before signing in.");
});

export const registerGoogleController = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  checkDbReady();
  const { code } = req.body as { code?: string };
  if (!code) {
    return errorResponse(res, 400, "Authorization code is required", "VALIDATION_ERROR");
  }
  const email = await googleRegistrationService.registerWithGoogle(code);
  return successResponse(res, 201, "Registration successful. Please verify your email before signing in.", { email });
});

export const loginEmailController = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  checkDbReady();
  const user = await emailLoginService.login(req.body.email, req.body.password);
  const token = jwtService.generateToken(user);
  return successResponse(res, 200, "Login successful", {
    token,
    needsRoleSelection: !user.role,
    user: AuthResponseMapper.toResponseDto(user)
  });
});

export const loginGoogleController = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  checkDbReady();
  const { code } = req.body as { code?: string };
  if (!code) {
    return errorResponse(res, 400, "Authorization code is required", "VALIDATION_ERROR");
  }
  const user = await googleLoginService.loginWithGoogle(code);
  const token = jwtService.generateToken(user);
  return successResponse(res, 200, "Login successful", {
    token,
    needsRoleSelection: !user.role,
    user: AuthResponseMapper.toResponseDto(user)
  });
});

export const verifyEmailController = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  const { token } = req.query as { token?: string };
  if (!token) {
    return errorResponse(res, 400, "Verification link is invalid or has expired.", "VALIDATION_ERROR");
  }
  await verificationService.verifyEmail(token);
  return successResponse(res, 200, "Email verified successfully. You can now sign in.");
});

export const resendVerificationController = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body as { email?: string };
  if (!email) {
    return errorResponse(res, 400, "Email is required", "VALIDATION_ERROR");
  }
  await verificationService.resendVerification(email);
  return successResponse(res, 200, "If your email is registered and unverified, a new verification link has been sent.");
});

export const forgotPasswordController = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body as { email?: string };
  if (!email) {
    return errorResponse(res, 400, "Email is required", "VALIDATION_ERROR");
  }
  await passwordResetService.forgotPassword(email);
  return successResponse(res, 200, "If an account with that email exists, a password reset link has been sent.");
});

export const resetPasswordController = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  await passwordResetService.resetPassword(req.body.token, req.body.newPassword);
  return successResponse(res, 200, "Password reset successful. You can now sign in.");
});

export const getUserProfile = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userPayload = req.user;
  if (!userPayload || !userPayload._id) {
    return errorResponse(res, 401, "Unauthorized user", "UNAUTHORIZED");
  }
  const user = await profileService.getUserProfile(userPayload._id.toString());
  return successResponse(res, 200, "User profile retrieved successfully", AuthResponseMapper.toResponseDto(user));
});

export const updateUserProfile = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userPayload = req.user;
  if (!userPayload || !userPayload._id) {
    return errorResponse(res, 401, "Unauthorized user", "UNAUTHORIZED");
  }
  const updatedUser = await profileService.updateUserProfile(userPayload._id.toString(), req.body.name, req.body.image);
  const token = jwtService.generateToken(updatedUser);
  return successResponse(res, 200, "Profile updated successfully", {
    token,
    user: AuthResponseMapper.toResponseDto(updatedUser)
  });
});

export const addUserRole = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userPayload = req.user;
  if (!userPayload || !userPayload._id) {
    return errorResponse(res, 401, "Unauthorized user", "UNAUTHORIZED");
  }
  const updatedUser = await profileService.addUserRole(userPayload._id.toString(), req.body.role);
  const token = jwtService.generateToken(updatedUser);
  return successResponse(res, 200, "Role updated successfully", {
    token,
    user: AuthResponseMapper.toResponseDto(updatedUser)
  });
});
