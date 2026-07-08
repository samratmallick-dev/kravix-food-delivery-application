import "dotenv/config";
import "./config/env.config.js";
import express from "express";
import corsPackage from "cors";
import { corsOptions } from "./config/cors/cors.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";

import restaurantRouter from "./routes/restaurant.routes.js";
import menuItemRouter from "./routes/menuItem.routes.js";
import cartRouter from "./routes/cart.routes.js";
import addressRouter from "./routes/address.routes.js";
import orderRouter from "./routes/order.routes.js";
import couponRouter from "./routes/coupon.routes.js";
import reviewRouter from "./routes/review.routes.js";

const app = express();

app.use(corsPackage(corsOptions));
app.options("/{*path}", corsPackage(corsOptions));

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(requestLogger("restaurant"));

app.use("/api/v1/restaurants", restaurantRouter);
app.use("/api/v1/menu", menuItemRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/address", addressRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/coupons", couponRouter);
app.use("/api/v1/reviews", reviewRouter);

app.get("/", (_req, res) => {
  res.send("Hello World!");
});

app.use(errorHandler);

export { app };