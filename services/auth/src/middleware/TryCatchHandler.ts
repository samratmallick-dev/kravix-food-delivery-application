import { RequestHandler, Request, Response, NextFunction } from "express";

export const TryCatch = (handler: RequestHandler): RequestHandler => {
      return async (req: Request, res: Response, next: NextFunction) => {
            try {
                  await handler(req, res, next);
            } catch (error: any) {
                  return res.status(500).json({
                        success: false,
                        message: error.message || "Something went wrong",
                        error: true,
                        stack: process.env.NODE_ENV === "development" ? error.stack : {},
                        data: {}
                  })
            }
      }
};