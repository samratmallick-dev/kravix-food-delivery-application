import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./authenticate.js";
import { AuthorizationError } from "../utils/errors.js";

export const requireRole = (role: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.method === "OPTIONS") {
      return next();
    }

    const user = req.user;
    if (!user || user.role !== role) {
      throw new AuthorizationError(`Forbidden - ${role} access only`);
    }

    next();
  };
};
