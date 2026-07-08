import { Router } from "express";
import {
  registerEmailController,
  registerGoogleController,
  loginEmailController,
  loginGoogleController,
  verifyEmailController,
  resendVerificationController,
  forgotPasswordController,
  resetPasswordController,
  getUserProfile,
  updateUserProfile,
  addUserRole,
} from "../controllers/auth.controllers.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";

const router = Router();

router.post("/register", registerEmailController);
router.post("/register/google", registerGoogleController);

router.post("/login", loginEmailController);
router.post("/login/google", loginGoogleController);

router.get("/verify-email", verifyEmailController);
router.post("/resend-verification", resendVerificationController);

router.post("/forgot-password", forgotPasswordController);
router.post("/reset-password", resetPasswordController);

router.get("/me", isAuthenticated, getUserProfile);
router.patch("/me", isAuthenticated, updateUserProfile);
router.patch("/me/role", isAuthenticated, addUserRole);

export default router;
