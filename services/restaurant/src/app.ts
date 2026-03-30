import express from 'express';
import cors from 'cors';
import { corsOptions } from "./config/cors/cors.js";

const app = express();

app.use(cors(corsOptions));
app.options("/{*path}", cors(corsOptions));
app.use((req, res, next) => {
      res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");
      next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import restaurantRouter from "./routes/restaurant.routes.js";
import menuItemRouter from "./routes/menuItem.routes.js";
import cartRouter from "./routes/cart.routes.js";
import addressRouter from "./routes/address.routes.js";
import orderRouter from "./routes/order.routes.js";
app.use('/api/v1/restaurants', restaurantRouter);
app.use('/api/v1/menu', menuItemRouter);
app.use('/api/v1/cart', cartRouter);
app.use('/api/v1/address', addressRouter);
app.use('/api/v1/orders', orderRouter);
app.get('/', (req, res) => {
      res.send('Hello World!');
});

export { app };