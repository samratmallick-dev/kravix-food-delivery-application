import { RequestHandler, Request, Response, NextFunction } from "express";

export const TryCatch = <P = any, ResBody = any, ReqBody = any, ReqQuery = any>(
  handler: (req: Request<P, ResBody, ReqBody, ReqQuery>, res: Response, next: NextFunction) => Promise<any>
): RequestHandler<any, any, any, any> => {
  return async (req, res, next) => {
    try {
      await handler(req as Request<P, ResBody, ReqBody, ReqQuery>, res, next);
    } catch (error: unknown) {
      next(error);
    }
  };
};