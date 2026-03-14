import { Router } from "express";
import {
      addUserRole,
      getUserProfile,
      loginController
} from "../controllers/auth.controllers.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";

const router = Router();

router.route("/login").post(loginController);
router.route("/add-role").put(isAuthenticated, addUserRole);
router.route("/profile").get(isAuthenticated, getUserProfile);


export default router;