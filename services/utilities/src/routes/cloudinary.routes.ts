import { Router, Request, Response } from "express";
import cloudinary from "../config/cloudinary.js";

const router = Router();

router.route("/images").post(async (req: Request, res: Response) => {
      try {
            if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
                  return res.status(403).json({
                        success: false,
                        message: "Forbidden: Invalid or missing internal key",
                        error: true,
                        data: {},
                  });
            }

            const { image } = req.body;

            if (!image) {
                  return res.status(400).json({
                        success: false,
                        message: "Image is required",
                        error: true,
                        data: {},
                  });
            }

            const uploadImage = await cloudinary.uploader.upload(image, {
                  folder: "uploads",
            });
            let url = uploadImage.secure_url;
            if (!url) {
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
                  url: url,
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