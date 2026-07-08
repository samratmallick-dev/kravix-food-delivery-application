import { RequestHandler, Request, Response, NextFunction } from "express";

export const TryCatch = (handler: RequestHandler): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req, res, next);
    } catch (error: unknown) {
      next(error);
    }
  };
};
