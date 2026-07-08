import { ErrorRequestHandler } from "express";
import { AppError } from "../utils/errors.js";

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  const status = err instanceof AppError ? err.status : (err.status ?? 500);
  const message = err.message ?? "Something went wrong";
  const code = err instanceof AppError ? err.code : err.code;

  const responseBody: Record<string, any> = {
    success: false,
    message,
    error: true
  };

  if (code) {
    responseBody.code = code;
  }

  if (process.env.NODE_ENV === "development" && err.stack) {
    responseBody.stack = err.stack;
  }

  res.status(status).json(responseBody);
};
