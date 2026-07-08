import { Request, Response } from "express";
import { cloudinaryClient } from "../services/index.js";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { ValidationError, AuthorizationError } from "../utils/errors.js";
import DataUriParser from "datauri/parser.js";
import path from "path";

export const uploadImage = TryCatch(async (req: Request, res: Response) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    throw new AuthorizationError("Forbidden: Invalid or missing internal key");
  }

  let imageSource: string | undefined;

  if (req.file) {
    const parser = new DataUriParser();
    const ext = path.extname(req.file.originalname).toString();
    imageSource = parser.format(ext, req.file.buffer)?.content ?? undefined;
  } else {
    imageSource = req.body?.image;
  }

  if (!imageSource) {
    throw new ValidationError("Image is required");
  }

  const url = await cloudinaryClient.uploadImage(imageSource);

  return res.status(200).json({
    success: true,
    message: "Image uploaded successfully",
    error: false,
    url
  });
});
