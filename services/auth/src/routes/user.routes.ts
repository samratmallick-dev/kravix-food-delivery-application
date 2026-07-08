import { Router } from "express";
import { getUserProfile, updateUserProfile, addUserRole } from "../controllers/auth.controllers.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { ROUTES } from "../constants/routes.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { profileUpdateSchema, roleSchema } from "../validators/auth.validator.js";

const router = Router();

router.get(ROUTES.USERS.ME, isAuthenticated, getUserProfile);
router.patch(ROUTES.USERS.ME, isAuthenticated, validateRequest(profileUpdateSchema), updateUserProfile);
router.patch(ROUTES.USERS.ME_ROLE, isAuthenticated, validateRequest(roleSchema), addUserRole);

export default router;
