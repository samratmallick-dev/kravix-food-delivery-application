import { RequestHandler, Request, Response, NextFunction } from "express";

export const TryCatch = (handler: RequestHandler): RequestHandler => {
      return async (req: Request, res: Response, next: NextFunction) => {
            try {
                  await handler(req, res, next);
            } catch (error: any) {
                  const statusCode = error.response?.status || 500;
                  const message = error.response?.data?.message || error.message || "Something went wrong";
                  const body: Record<string, unknown> = {
                        success: false,
                        message,
                        error: true,
                        data: {}
                  };
                  if (process.env.NODE_ENV === "development") body["stack"] = error.stack;
                  return res.status(statusCode).json(body);
            }
      }
};