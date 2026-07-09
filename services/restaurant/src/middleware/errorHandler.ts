import { ErrorRequestHandler } from "express";
import { AppError } from "../utils/errors.js";
import { ZodError } from "zod";

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message
    }));
    res.status(400).json({
      success: false,
      message: "Validation failed",
      error: true,
      code: "VALIDATION_ERROR",
      details
    });
    return;
  }

  const status = err instanceof AppError ? err.status : (err.status ?? 500);
  const message = err.message ?? "Something went wrong";
  const statusCodeMap: Record<number, string> = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    502: "EXTERNAL_SERVICE_ERROR"
  };
  const code = (err instanceof AppError ? err.code : undefined) ?? statusCodeMap[status] ?? "INTERNAL_SERVER_ERROR";

  const responseBody: Record<string, any> = {
    success: false,
    message,
    error: true,
    code,
    details: []
  };

  if (process.env.NODE_ENV === "development" && err.stack) {
    responseBody.stack = err.stack;
  }

  res.status(status).json(responseBody);
};
