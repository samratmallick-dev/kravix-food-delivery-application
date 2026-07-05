import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
    user?: JwtPayload;
}

export const isAuthenticated = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): void => {
    if (req.method === "OPTIONS") return next();

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({ message: "Unauthorized", success: false });
        return;
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET;
    if (!token || !secret) {
        res.status(500).json({ message: "Server configuration error", success: false });
        return;
    }

    try {
        const decoded = jwt.verify(token, secret) as JwtPayload;
        if (!decoded?._id) {
            res.status(401).json({ message: "Invalid token", success: false });
            return;
        }
        req.user = decoded;
        next();
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            res.status(401).json({ message: "Token expired", success: false });
        } else {
            res.status(401).json({ message: "Invalid token", success: false });
        }
    }
};
