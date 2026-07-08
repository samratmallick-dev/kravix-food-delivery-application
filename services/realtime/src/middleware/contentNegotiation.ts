import { Request, Response, NextFunction } from "express";

export const contentNegotiation = (req: Request, res: Response, next: NextFunction): void => {
  if (req.method === "OPTIONS") return next();

  const acceptHeader = req.headers["accept"];
  if (acceptHeader && acceptHeader !== "*/*" && !acceptHeader.includes("application/json")) {
    res.status(415).json({
      success: false,
      message: "Unsupported Media Type: Only application/json is accepted",
      error: true,
      code: "UNSUPPORTED_MEDIA_TYPE",
      details: []
    });
    return;
  }

  if (
    req.method !== "GET" &&
    req.method !== "DELETE" &&
    req.method !== "HEAD" &&
    req.headers["content-type"] &&
    !req.headers["content-type"].includes("application/json") &&
    !req.headers["content-type"].includes("multipart/form-data") &&
    !req.headers["content-type"].includes("application/x-www-form-urlencoded")
  ) {
    res.status(415).json({
      success: false,
      message: "Unsupported Media Type: Content-Type must be application/json",
      error: true,
      code: "UNSUPPORTED_MEDIA_TYPE",
      details: []
    });
    return;
  }

  next();
};
