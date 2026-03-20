import { Router } from "express";
import { socketEmit } from "../controllers/socket.controllers.js";

const router = Router();

router.route("/emit").post(socketEmit);

export default router;