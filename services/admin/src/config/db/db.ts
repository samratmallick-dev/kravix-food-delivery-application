import mongoose from "mongoose";

if (!(process.env.MONGO_URI && process.env.DB_NAME)) {
      console.error("MONGO_URI and DB_NAME must be defined");
      throw new Error("MONGO_URI and DB_NAME must be defined");
}

const connectDb = async () => {
      if (mongoose.connection.readyState >= 1) return;
      try {
            const connectionInstance = await mongoose.connect(
                  process.env.MONGO_URI as string,
                  {
                        dbName: process.env.DB_NAME as string,
                        serverSelectionTimeoutMS: 30000,
                        socketTimeoutMS: 45000,
                        connectTimeoutMS: 30000,
                  },
            );
            console.log(
                  `MongoDB connected successfully to host: ${connectionInstance.connection.host}`,
            );
      } catch (error) {
            console.error(`MongoDB Connection Failed: ${error}`);
            throw new Error(`MongoDB Connection Failed: ${error}`);
      }
};

export default connectDb;
