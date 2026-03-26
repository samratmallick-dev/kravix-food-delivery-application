import "dotenv/config";
import { app } from "./app.js";
import connectDb from "./config/db/db.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";
import { startAdminOrderConsumer } from "./config/adminOrderConsumer.js";

const PORT = process.env.PORT || 6000;

Promise.all([connectDb(), connectRabbitMQ()]).then(() => {
      startAdminOrderConsumer();
      const server = app.listen(PORT, () => {
            console.log(`[Admin Service]: Admin Service is running at http://localhost:${PORT}`);
      });

      server.on("error", (err) => {
            console.log("Err: ", err);
            process.exit(1);
      });
}).catch((err) => {
      console.log("Connection failed !!! ", err);
      process.exit(1);
});
