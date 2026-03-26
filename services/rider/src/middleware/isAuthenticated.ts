import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface IUser {
      _id: string;
      name: string;
      email: string;
      image: string;
      role: string;
      restaurantId:string;
};

export interface AuthenticatedRequest extends Request {
      user?: IUser | null;
}

export const isAuthenticated = async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
): Promise<void> => {
      if (req.method === "OPTIONS") return next();

      try {
            const authHeader = req.headers.authorization;

            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                  res.status(401).json({
                        message: "Unauthorized - No Auth Token in Headers",
                        success: false,
                        error: true
                  });
                  return;
            }

            const token = authHeader.split(" ")[1];

            if (!token) {
                  res.status(401).json({
                        message: "Unauthorized - Missing Auth Token",
                        success: false,
                        error: true
                  });
                  return;
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

            const decodedToken = jwt.verify(
                  token,
                  secretKey
            ) as JwtPayload;

            if (!decodedToken || !decodedToken._id) {
                  res.status(401).json({
                        message: "Invalid Token",
                        success: false,
                        error: true
                  });
                  return;
            }

            req.user = decodedToken as unknown as IUser;

            next();
      } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                  res.status(401).json({ message: "Token expired", success: false, error: true });
                  return;
            }
            if (error instanceof jwt.JsonWebTokenError) {
                  res.status(401).json({ message: "Invalid token", success: false, error: true });
                  return;
            }
            res.status(500).json({ message: "Internal Server error", success: false, error: true });
      }
};

export const isSeller = async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
): Promise<void> => {
      if (req.method === "OPTIONS") return next();

      const user = req.user;

      if (!user || user.role !== "seller") {
            res.status(403).json({
                  message: "Forbidden - Seller access only",
                  success: false,
                  error: true
            });
            return;
      }
      next();
};