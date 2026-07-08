import { RequestHandler, Request, Response, NextFunction } from "express";

export const TryCatch = (handler: RequestHandler): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req, res, next);
    } catch (error: unknown) {
      const err = error as { message?: string; status?: number; code?: string; stack?: string };
      const status = err.status ?? 500;
      const body: Record<string, unknown> = {
        success: false,
        message: err.message ?? "Something went wrong",
        error: true,
      };
      if (err.code) body["code"] = err.code;
      if (process.env.NODE_ENV === "development") body["stack"] = err.stack;
      return res.status(status).json(body);
    }
  };
};
