import { Router } from "express";
import restaurantRouter from "./restaurant.routes.js";
import menuItemRouter from "./menuItem.routes.js";
import cartRouter from "./cart.routes.js";
import addressRouter from "./address.routes.js";
import orderRouter from "./order.routes.js";
import couponRouter from "./coupon.routes.js";
import reviewRouter from "./review.routes.js";
import searchRouter from "./search.routes.js";
import { ROUTES } from "../constants/routes.js";

const masterRouter = Router();

masterRouter.use(ROUTES.RESTAURANTS.BASE, restaurantRouter);
masterRouter.use(ROUTES.MENU_ITEMS.BASE, menuItemRouter);
masterRouter.use(ROUTES.CART.BASE, cartRouter);
masterRouter.use(ROUTES.ADDRESSES.BASE, addressRouter);
masterRouter.use(ROUTES.ORDERS.BASE, orderRouter);
masterRouter.use(ROUTES.COUPONS.BASE, couponRouter);
masterRouter.use(ROUTES.REVIEWS.BASE, reviewRouter);
masterRouter.use(ROUTES.SEARCH.BASE, searchRouter);

export default masterRouter;
