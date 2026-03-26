import { RequestHandler, Request, Response, NextFunction } from "express";

export const TryCatch = (handler: RequestHandler): RequestHandler => {
      return async (req: Request, res: Response, next: NextFunction) => {
            try {
                  await handler(req, res, next);
            } catch (error: any) {
                  const body: Record<string, unknown> = {
                        success: false,
                        message: error.message || "Something went wrong",
                        error: true,
                        data: {}
                  };
                  if (process.env.NODE_ENV === "development") body["stack"] = error.stack;
                  return res.status(500).json(body);
            }
      }
};