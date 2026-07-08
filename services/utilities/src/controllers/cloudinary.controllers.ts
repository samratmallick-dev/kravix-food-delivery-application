import { Request, Response } from "express";
import { cloudinaryClient } from "../services/index.js";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { ValidationError } from "../utils/errors.js";
import DataUriParser from "datauri/parser.js";
import path from "path";
import { successResponse } from "../utils/response.js";

export const uploadImage = TryCatch(async (req: Request, res: Response) => {
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
  return successResponse(res, 200, "Image uploaded successfully", { url });
});
