import "dotenv/config";
import { app } from './app.js';
import ConnectDb from "./config/db/db.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";
import { startPayment } from "./config/paymentConsumer.js";

const PORT = process.env.PORT || 4000;

Promise.all([ConnectDb(), connectRabbitMQ()]).then(() => {
      startPayment();
      const server = app.listen(PORT, () => {
            console.log(`[Restaurant server]: Restaurant Server is running at http://localhost:${PORT}`);
      });
      
      server.on("error", (err) => {
            console.log("Err: ", err);
            process.exit(1);
      });
}).catch((err) => {
      console.log("Connection failed !!! ", err);
      process.exit(1);
});