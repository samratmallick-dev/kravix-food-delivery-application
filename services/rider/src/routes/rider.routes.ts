import { Router } from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { upload } from "../middleware/multer.js";
import { addRiderProfile, fetchMyProfile, toggleRiderAvailability } from "../controllers/rider.controllers.js";

const router = Router();

router.route("/add-profile").post(isAuthenticated, upload, addRiderProfile);
router.route("/fetch-profile").get(isAuthenticated, fetchMyProfile);
router.route("/toggle-profile").patch(isAuthenticated, toggleRiderAvailability);

export default router; 