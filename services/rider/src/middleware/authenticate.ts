import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { User } from "../model/User.js";
import { AuthenticationError, AuthorizationError } from "../utils/errors.js";

export interface IUser {
  _id: string;
  name: string;
  email: string;
  image: string;
  role: string;
  restaurantId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: IUser | null;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (req.method === "OPTIONS") {
    return next();
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AuthenticationError("Unauthorized - No Auth Token in Headers");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new AuthenticationError("Unauthorized - Missing Auth Token");
    }

    const secretKey = process.env.JWT_SECRET as string;
    if (!secretKey) {
      res.status(500).json({
        message: "Server configuration error",
        success: false,
        error: true
      });
      return;
    }

    const decodedToken = jwt.verify(token, secretKey) as JwtPayload;
    if (!decodedToken || !decodedToken._id) {
      throw new AuthenticationError("Invalid Token");
    }

    req.user = decodedToken as unknown as IUser;
    next();
  } catch (error) {
    next(error);
  }
};

export const checkBlocked = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = req.user?._id;
  if (!userId) {
    return next();
  }

  const dbUser = await User.findById(userId)
    .select("isBlocked blockedUntil")
    .lean();

  if (!dbUser) {
    return next();
  }

  if (
    dbUser.isBlocked &&
    dbUser.blockedUntil &&
    new Date(dbUser.blockedUntil) > new Date()
  ) {
    throw new AuthorizationError("Your account has been blocked. Access restricted.");
  }

  if (
    dbUser.isBlocked &&
    dbUser.blockedUntil &&
    new Date(dbUser.blockedUntil) <= new Date()
  ) {
    await User.findByIdAndUpdate(userId, {
      isBlocked: false,
      blockedUntil: null
    });
  }

  next();
};
