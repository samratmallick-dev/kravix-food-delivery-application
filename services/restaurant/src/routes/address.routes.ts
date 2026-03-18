import { Router } from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { addAddress, deleteAddress, getMyAddress } from "../controllers/address.controllers.js";

const router = Router();

router.route("/add").post(isAuthenticated, addAddress);
router.route("/delete/:addressId").delete(isAuthenticated, deleteAddress);
router.route("/all").get(isAuthenticated, getMyAddress);

export default router;