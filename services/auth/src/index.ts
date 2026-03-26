import "dotenv/config";
import { app } from './app.js';
import ConnectDb from "./config/db/db.js";

const PORT = process.env.PORT || 8000;

const server = app.listen(PORT, () => {
      console.log(`[Auth server]: Auth Server is running at http://localhost:${PORT}`);
      ConnectDb().catch((err) => {
            console.error("MongoDB connection failed: ", err);
      });
});

server.on("error", (err) => {
      console.log("Err: ", err);
      process.exit(1);
});

process.on("unhandledRejection", (reason) => {
      console.error("[Auth] Unhandled Rejection:", reason);
});