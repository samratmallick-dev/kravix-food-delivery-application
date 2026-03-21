import "dotenv/config";
import { app } from './app.js';
import ConnectDb from "./config/db.js";

const PORT = process.env.PORT || 7000;

ConnectDb().then(() => {
      const server = app.listen(PORT, () => {
            console.log(`[Rider server]: Rider Server is running at http://localhost:${PORT}`);
      });
      
      server.on("error", (err) => {
            console.log("Err: ", err);
            process.exit(1);
      });
}).catch((err) => {
      console.log("Mongodb connection failed !!! ", err);
      process.exit(1);
});