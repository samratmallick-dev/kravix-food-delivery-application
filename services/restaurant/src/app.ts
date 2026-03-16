import "dotenv/config";
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
app.use('/api/v1/restaurants', restaurantRouter);
app.use('/api/v1/menu', menuItemRouter);
app.get('/', (req, res) => {
      res.send('Hello World!');
});

export { app };