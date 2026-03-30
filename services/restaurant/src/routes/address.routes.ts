import { Router } from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { addAddress, deleteAddress, getMyAddress } from "../controllers/address.controllers.js";

const router = Router();

router.route("/").post(isAuthenticated, addAddress);
router.route("/").get(isAuthenticated, getMyAddress);
router.route("/:addressId").delete(isAuthenticated, deleteAddress);

export default router;