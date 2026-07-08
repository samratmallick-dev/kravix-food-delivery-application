import { Router } from "express";
import authRouter from "./auth.routes.js";
import userRouter from "./user.routes.js";
import { ROUTES } from "../constants/routes.js";

const masterRouter = Router();

masterRouter.use(ROUTES.AUTH.BASE, authRouter);
masterRouter.use(ROUTES.USERS.BASE, userRouter);

export default masterRouter;
