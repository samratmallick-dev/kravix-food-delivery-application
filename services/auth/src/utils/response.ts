import { Response } from "express";

export const successResponse = (res: Response, status = 200, message: string, data: any = {}, meta?: any) => {
  return res.status(status).json({
    success: true,
    message,
    data,
    ...(meta ? { meta } : {}),
    error: false
  });
};

export const errorResponse = (res: Response, status = 500, message: string, code = "INTERNAL_SERVER_ERROR", details: any[] = []) => {
  return res.status(status).json({
    success: false,
    message,
    error: true,
    code,
    details
  });
};

export const paginatedResponse = (res: Response, status = 200, message: string, data: any[], page: number, limit: number, total: number) => {
  const totalPages = Math.ceil(total / limit);
  return res.status(status).json({
    success: true,
    message,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1
    },
    error: false
  });
};
