import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface IAdminPayload {
      _id: string;
      email: string;
      role: "admin";
}

export interface AdminRequest extends Request {
      admin?: IAdminPayload | null;
}

export const isAdminAuthenticated = async (
      req: AdminRequest,
      res: Response,
      next: NextFunction,
): Promise<void> => {
      if (req.method === "OPTIONS") return next();

      try {
            const authHeader = req.headers.authorization;

            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                  res.status(401).json({
                        message: "Unauthorized - No Auth Token in Headers",
                        success: false,
                        error: true,
                  });
                  return;
            }

            const token = authHeader.split(" ")[1];

            if (!token) {
                  res.status(401).json({
                        message: "Unauthorized - Missing Auth Token",
                        success: false,
                        error: true,
                  });
                  return;
            }

            const secretKey = process.env.JWT_SECRET as string;

            if (!secretKey) {
                  res.status(500).json({
                        message: "Server configuration error",
                        success: false,
                        error: true,
                  });
                  return;
            }

            const decoded = jwt.verify(token, secretKey) as JwtPayload;

            if (!decoded?._id || decoded.role !== "admin") {
                  res.status(403).json({
                        message: "Forbidden - Admin access only",
                        success: false,
                        error: true,
                  });
                  return;
            }

            req.admin = decoded as unknown as IAdminPayload;
            next();
      } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                  res
                        .status(401)
                        .json({ message: "Token expired", success: false, error: true });
                  return;
            }
            if (error instanceof jwt.JsonWebTokenError) {
                  res
                        .status(401)
                        .json({ message: "Invalid token", success: false, error: true });
                  return;
            }
            res
                  .status(500)
                  .json({ message: "Internal Server error", success: false, error: true });
      }
};
