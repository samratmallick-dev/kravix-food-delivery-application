import "dotenv/config";
import { app } from "./app.js";
import ConnectDb from "./config/db/db.js";

const PORT = process.env.PORT || 8000;

const start = async () => {
      try {
            await ConnectDb();
            const server = app.listen(PORT, () => {
                  console.log(`[Auth server]: Auth Server is running at http://localhost:${PORT}`);
            });
            server.on("error", (err) => {
                  console.error("Server error:", err);
                  process.exit(1);
            });
      } catch (err) {
            console.error("MongoDB failed to connect. Server not started:", err);
            process.exit(1);
      }
};

start();

process.on("unhandledRejection", (reason) => {
      console.error("[Auth] Unhandled Rejection:", reason);
});