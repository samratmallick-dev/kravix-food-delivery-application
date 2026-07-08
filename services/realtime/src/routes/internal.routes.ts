import { Router } from "express";
import { socketEmit } from "../controllers/socket.controllers.js";
import { ROUTES } from "../constants/routes.js";

const router = Router();

router.route(ROUTES.SOCKET.EVENTS).post(socketEmit);

export default router;
