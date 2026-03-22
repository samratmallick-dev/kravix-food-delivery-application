import { RequestHandler, Request, Response, NextFunction } from "express";

export const TryCatch = (handler: RequestHandler): RequestHandler => {
      return async (req: Request, res: Response, next: NextFunction) => {
            try {
                  await handler(req, res, next);
            } catch (error: any) {
                  const statusCode = error.response?.status || 500;
                  const message = error.response?.data?.message || error.message || "Something went wrong";
                  return res.status(statusCode).json({
                        success: false,
                        message,
                        error: true,
                        stack: process.env.NODE_ENV === "development" ? error.stack : {},
                        data: {}
                  })
            }
      }
};