import { Router } from "express";
import {
  addUserRole,
  getUserProfile,
  loginController,
  registerWithEmail,
  loginWithEmail,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controllers.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";

const router = Router();

router.route("/sessions").post(loginController);
router.route("/me/role").patch(isAuthenticated, addUserRole);
router.route("/me").get(isAuthenticated, getUserProfile);

router.route("/register").post(registerWithEmail);
router.route("/login").post(loginWithEmail);
router.route("/verify-email").get(verifyEmail);
router.route("/resend-verification").post(resendVerificationEmail);
router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password").post(resetPassword);

export default router;