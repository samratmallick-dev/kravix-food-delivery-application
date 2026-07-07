import "dotenv/config";
import { app } from "./app.js";
import connectDb from "./config/db/db.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";

const PORT = process.env.PORT || 6000;

const start = async () => {
      try {
            await connectDb();
            connectRabbitMQ();

            const server = app.listen(PORT, () => {
                  console.log(`✅ [Admin Service] Running at http://localhost:${PORT}`);
            });

            server.on("error", (err) => {
                  console.error("[Admin Service] HTTP server error:", err);
                  process.exit(1);
            });

      } catch (err) {
            console.error("[Admin Service] Startup failed:", err);
            process.exit(1);
      }
};

start();
