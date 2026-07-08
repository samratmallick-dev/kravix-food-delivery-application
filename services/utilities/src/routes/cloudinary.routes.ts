import { Router } from "express";
import multer from "multer";
import { uploadImage } from "../controllers/cloudinary.controllers.js";
import { internalAuth } from "../middleware/internalAuth.js";
import { ROUTES } from "../constants/routes.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.route(ROUTES.UPLOADS.IMAGES).post(internalAuth, upload.single("image"), uploadImage);

export default router;
