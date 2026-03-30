import { Router } from "express";
import {
      addUserRole,
      getUserProfile,
      loginController
} from "../controllers/auth.controllers.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";

const router = Router();

router.route("/sessions").post(loginController);
router.route("/me/role").patch(isAuthenticated, addUserRole);
router.route("/me").get(isAuthenticated, getUserProfile);


export default router;