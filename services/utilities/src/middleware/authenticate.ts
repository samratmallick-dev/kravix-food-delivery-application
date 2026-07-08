import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { AuthenticationError } from "../utils/errors.js";

export interface IUser {
  _id: string;
  name: string;
  email: string;
  image: string;
  role: string;
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
