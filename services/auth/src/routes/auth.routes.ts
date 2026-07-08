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
} from "../controllers/auth.controllers.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { registrationSchema, loginSchema, resetPasswordSchema } from "../validators/auth.validator.js";
import { ROUTES } from "../constants/routes.js";

const router = Router();

router.post("/sessions", (req, res, next) => {
  res.setHeader("Warning", '299 - "Deprecated API"');
  console.warn(`[auth] Deprecated route accessed: POST /auth/sessions — use POST /auth/login/google`);
  return loginGoogleController(req, res, next);
});

router.post(ROUTES.AUTH.REGISTER, validateRequest(registrationSchema), registerEmailController);
router.post(ROUTES.AUTH.REGISTER_GOOGLE, registerGoogleController);

router.post(ROUTES.AUTH.LOGIN, validateRequest(loginSchema), loginEmailController);
router.post(ROUTES.AUTH.LOGIN_GOOGLE, loginGoogleController);

router.get(ROUTES.AUTH.VERIFY_EMAIL, verifyEmailController);
router.post(ROUTES.AUTH.RESEND_VERIFICATION, resendVerificationController);

router.post(ROUTES.AUTH.FORGOT_PASSWORD, forgotPasswordController);
router.post(ROUTES.AUTH.RESET_PASSWORD, validateRequest(resetPasswordSchema), resetPasswordController);

export default router;
