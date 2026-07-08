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
                  res.status(401).json({ success: false, message: "Unauthorized - No Auth Token in Headers", error: true, code: "UNAUTHORIZED", details: [] });
                  return;
            }

            const token = authHeader.split(" ")[1];

            if (!token) {
                  res.status(401).json({ success: false, message: "Unauthorized - Missing Auth Token", error: true, code: "UNAUTHORIZED", details: [] });
                  return;
            }

            const secretKey = process.env.JWT_SECRET as string;

            if (!secretKey) {
                  res.status(500).json({ success: false, message: "Server configuration error", error: true, code: "INTERNAL_SERVER_ERROR", details: [] });
                  return;
            }

            const decoded = jwt.verify(token, secretKey) as JwtPayload;

            if (!decoded?._id || decoded.role !== "admin") {
                  res.status(403).json({ success: false, message: "Forbidden - Admin access only", error: true, code: "FORBIDDEN", details: [] });
                  return;
            }

            req.admin = decoded as unknown as IAdminPayload;
            next();
      } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                  res.status(401).json({ success: false, message: "Token expired", error: true, code: "TOKEN_EXPIRED", details: [] });
                  return;
            }
            if (error instanceof jwt.JsonWebTokenError) {
                  res.status(401).json({ success: false, message: "Invalid token", error: true, code: "UNAUTHORIZED", details: [] });
                  return;
            }
            res.status(500).json({ success: false, message: "Internal Server error", error: true, code: "INTERNAL_SERVER_ERROR", details: [] });
      }
};
