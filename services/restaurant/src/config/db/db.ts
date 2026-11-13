import mongoose from "mongoose";

if (!(process.env.MONGO_URI && process.env.DB_NAME)) {
      throw new Error("MONGO_URI and DB_NAME must be defined");
}

let connectionPromise: Promise<typeof mongoose.connection> | null = null;

mongoose.connection.on("connected", () => console.log("MongoDB connection established"));
mongoose.connection.on("disconnected", () => console.log("MongoDB connection lost"));
mongoose.connection.on("error", (error) => console.error(`MongoDB connection error: ${error.message}`));

export const connectDB = async () => {
      if (mongoose.connection.readyState === 1) return mongoose.connection;
      if (connectionPromise) return connectionPromise;

      connectionPromise = mongoose
            .connect(process.env.MONGO_URI as string, {
                  dbName: process.env.DB_NAME as string,
                  serverSelectionTimeoutMS: 10000,
            })
            .then(({ connection }) => {
                  console.log(`MongoDB connected: ${connection.host}`);
                  return connection;
            })
            .catch((error) => {
                  connectionPromise = null;
                  throw new Error(`Failed to connect to MongoDB: ${error.message}`);
            });

      return connectionPromise;
};

export const disconnectDB = async () => {
      if (mongoose.connection.readyState === 0) return;
      await mongoose.disconnect();
      connectionPromise = null;
      console.log("MongoDB disconnected");
};
