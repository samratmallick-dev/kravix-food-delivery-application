import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import axios from "axios";
import { google } from "googleapis";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { User } from "../model/User.js";
import { AuthenticatedRequest } from "../middleware/isAuthenticated.js";
import { publishAuthEvent } from "../config/authPublisher.js";
import {
  publishVerificationEmail,
  publishPasswordResetEmail,
} from "../utils/email.publisher.js";

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
      message:
        "Authorization code has already been used. Please try logging in again.",
      error: true,
    });
  }

  usedCodes.add(code);
  setTimeout(() => usedCodes.delete(code), 5 * 60 * 1000);

  const freshClient = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "postmessage",
  );

  let googleResponse;
  try {
    googleResponse = await freshClient.getToken(code);
  } catch (err: unknown) {
    usedCodes.delete(code);
    const msg =
      (
        err as {
          response?: { data?: { error_description?: string } };
          message?: string;
        }
      )?.response?.data?.error_description ??
      (err instanceof Error ? err.message : "Google token exchange failed");
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
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleResponse.tokens.access_token}`,
    );
  } catch (err: unknown) {
    const msg =
      (
        err as {
          response?: { data?: { error_description?: string } };
          message?: string;
        }
      )?.response?.data?.error_description ??
      (err instanceof Error
        ? err.message
        : "Failed to fetch user info from Google");
    return res.status(401).json({ success: false, message: msg, error: true });
  }

  const { email, name, picture } = userResponse.data as {
    email: string;
    name: string;
    picture: string;
  };

  let user = await User.findOne({ email });
  let isNewUser = false;

  if (!user) {
    user = await User.create({
      email,
      name,
      image: picture,
      authProvider: "google",
      isEmailVerified: true,
    });
    isNewUser = true;
  }

  const token = tokengenerator({
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role ?? null,
  });

  if (isNewUser) {
    publishAuthEvent("USER_REGISTERED", {
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      image: user.image,
    });
  }

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
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized user", error: true });
  }

  const { role } = req.body as { role: AllowedRoleType };

  if (!allowedRole.includes(role)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid role", error: true });
  }

  const updateUser = await User.findByIdAndUpdate(
    user._id,
    { role },
    { returnDocument: "after" },
  );

  if (!updateUser) {
    return res
      .status(404)
      .json({ success: false, message: "User not found", error: true });
  }

  const token = tokengenerator({
    _id: updateUser._id.toString(),
    name: updateUser.name,
    email: updateUser.email,
    image: updateUser.image,
    role: updateUser.role ?? null,
  });

  publishAuthEvent("USER_ROLE_UPDATED", {
    userId: updateUser._id.toString(),
    name: updateUser.name,
    email: updateUser.email,
    role: updateUser.role ?? null,
  });

  return res.status(200).json({
    success: true,
    message: "Role Updated Successfully",
    token,
    data: updateUser,
  });
});

export const getUserProfile = TryCatch(
  async (req: AuthenticatedRequest, res) => {
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
      data: {
        ...freshUser,
        restaurantId: (user as { restaurantId?: string }).restaurantId ?? null,
      },
    });
  },
);

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const registerWithEmail = TryCatch(
  async (req: Request, res: Response) => {
    const { name, email, password } = req.body as {
      name: string;
      email: string;
      password: string;
    };

    if (!name || name.trim().length < 2 || name.trim().length > 50) {
      return res
        .status(400)
        .json({ message: "Name must be between 2 and 50 characters." });
    }
    if (!email || !EMAIL_REGEX.test(email)) {
      return res
        .status(400)
        .json({ message: "Please provide a valid email address." });
    }
    if (!password || !PASSWORD_REGEX.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters with one uppercase letter and one digit.",
      });
    }

    const normalizedEmail = email.toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });

    if (existing) {
      if (existing.authProvider === "google") {
        return res.status(409).json({
          message:
            "An account with this email already exists using Google Sign-In. Please sign in with Google.",
        });
      }
      return res
        .status(409)
        .json({ message: "This email is already registered." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const rawToken = crypto.randomBytes(32).toString("hex");
    const emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await User.create({
      name: name.trim(),
      email: normalizedEmail,
      image: "",
      authProvider: "email",
      isEmailVerified: false,
      passwordHash,
      emailVerificationToken: rawToken,
      emailVerificationExpiry,
    });

    publishVerificationEmail(normalizedEmail, name.trim(), rawToken);

    return res.status(201).json({
      message:
        "Registration successful. Please check your email to verify your account.",
    });
  },
);

export const loginWithEmail = TryCatch(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  const normalizedEmail = email?.toLowerCase() ?? "";

  const user = await User.findOne({ email: normalizedEmail }).select(
    "+passwordHash",
  );

  if (!user || user.authProvider !== "email") {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  if (!user.isEmailVerified) {
    return res
      .status(403)
      .json({
        message: "Please verify your email before logging in.",
        code: "EMAIL_NOT_VERIFIED",
      });
  }

  const passwordMatch = await bcrypt.compare(
    password ?? "",
    user.passwordHash ?? "",
  );
  if (!passwordMatch) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const token = tokengenerator({
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role ?? null,
  });

  return res.status(200).json({
    token,
    needsRoleSelection: !user.role,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      authProvider: user.authProvider,
      profileImage: user.image,
    },
  });
});

export const verifyEmail = TryCatch(async (req: Request, res: Response) => {
  const { token } = req.query as { token?: string };

  if (!token) {
    return res
      .status(400)
      .json({ message: "Verification link is invalid or has expired." });
  }

  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpiry: { $gt: new Date() },
  }).select("+emailVerificationToken");

  if (!user) {
    return res
      .status(400)
      .json({ message: "Verification link is invalid or has expired." });
  }

  user.isEmailVerified = true;
  await User.findByIdAndUpdate(user._id, {
    $set: { isEmailVerified: true },
    $unset: { emailVerificationToken: "", emailVerificationExpiry: "" },
  });

  return res
    .status(200)
    .json({ message: "Email verified successfully. You can now sign in." });
});

export const resendVerificationEmail = TryCatch(
  async (req: Request, res: Response) => {
    const { email } = req.body as { email: string };
    const normalizedEmail = email?.toLowerCase() ?? "";

    const successMsg = {
      message:
        "If your email is registered and unverified, a new verification link has been sent.",
    };

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+emailVerificationToken +emailVerificationExpiry",
    );

    if (user && !user.isEmailVerified) {
      const lastSentAt = user.emailVerificationExpiry
        ? user.emailVerificationExpiry.getTime() - 24 * 60 * 60 * 1000
        : 0;
      const canResend = Date.now() - lastSentAt > 60 * 1000;

      if (canResend) {
        const rawToken = crypto.randomBytes(32).toString("hex");
        user.emailVerificationToken = rawToken;
        user.emailVerificationExpiry = new Date(
          Date.now() + 24 * 60 * 60 * 1000,
        );
        await user.save();
        publishVerificationEmail(normalizedEmail, user.name, rawToken);
      }
    }

    return res.status(200).json(successMsg);
  },
);

export const forgotPassword = TryCatch(async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };
  const normalizedEmail = email?.toLowerCase() ?? "";

  const successMsg = {
    message:
      "If an account with that email exists, a password reset link has been sent.",
  };

  const user = await User.findOne({ email: normalizedEmail });

  if (user && user.authProvider === "email" && user.isEmailVerified) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.passwordResetToken = hashedToken;
    user.passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    publishPasswordResetEmail(normalizedEmail, user.name, rawToken);
  }

  return res.status(200).json(successMsg);
});

export const resetPassword = TryCatch(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body as {
    token: string;
    newPassword: string;
  };

  if (!token) {
    return res
      .status(400)
      .json({ message: "Password reset link is invalid or has expired." });
  }

  if (!newPassword || !PASSWORD_REGEX.test(newPassword)) {
    return res.status(400).json({
      message:
        "Password must be at least 8 characters with one uppercase letter and one digit.",
    });
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpiry: { $gt: new Date() },
  }).select("+passwordResetToken");

  if (!user) {
    return res
      .status(400)
      .json({ message: "Password reset link is invalid or has expired." });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await User.findByIdAndUpdate(user._id, {
    $set: { passwordHash: user.passwordHash },
    $unset: { passwordResetToken: "", passwordResetExpiry: "" },
  });

  return res
    .status(200)
    .json({ message: "Password reset successful. You can now sign in." });
});
