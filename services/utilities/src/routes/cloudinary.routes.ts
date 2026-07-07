import { Router, Request, Response } from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import DataUriParser from "datauri/parser.js";
import path from "path";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.route("/images").post(upload.single("image"), async (req: Request, res: Response) => {
      try {
            if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
                  return res.status(403).json({
                        success: false,
                        message: "Forbidden: Invalid or missing internal key",
                        error: true,
                        data: {},
                  });
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
                  return res.status(400).json({
                        success: false,
                        message: "Image is required",
                        error: true,
                        data: {},
                  });
            }

            const uploadResult = await cloudinary.uploader.upload(imageSource, { folder: "uploads" });
            if (!uploadResult.secure_url) {
                  return res.status(400).json({
                        success: false,
                        message: "Image not uploaded",
                        error: true,
                        data: {},
                  });
            }

            return res.status(200).json({
                  success: true,
                  message: "Image uploaded successfully",
                  error: false,
                  url: uploadResult.secure_url,
            });
      } catch (error: any) {
            return res.status(500).json({
                  success: false,
                  message: error.message || "Something went wrong",
                  error: true,
                  data: {},
            });
      }
});

export default router;