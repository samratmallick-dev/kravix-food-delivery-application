import mongoose from "mongoose";
import "dotenv/config";
import connectDb from "../config/db/db.js";
import { Restaurant as RestaurantModel } from "../model/Restaurant.js";

export const runLocationMigration = async () => {
  const restaurants = await RestaurantModel.find({
    $or: [
      { location: { $exists: false } },
      { location: null }
    ]
  });

  for (const restaurant of restaurants) {
    if (restaurant.autoLocation) {
      const [longitude, latitude] = restaurant.autoLocation.coordinates;
      const address = restaurant.autoLocation.formattedAddress || "Unknown Address";
      await RestaurantModel.findByIdAndUpdate(restaurant._id, {
        $set: {
          location: {
            address,
            city: "Unknown City",
            state: "Unknown State",
            country: "Unknown Country",
            pincode: "000000",
            landmark: "",
            latitude,
            longitude,
            placeId: "",
            deliveryRadius: 5000,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          locationReviewStatus: null,
          pendingLocation: null,
          locationUpdatedAt: restaurant.updatedAt || new Date(),
          locationVersion: 0
        }
      });
    }
  }
};

const runStandalone = async () => {
  try {
    await connectDb();
    await runLocationMigration();
    await mongoose.connection.close();
  } catch (err) {
    process.exit(1);
  }
};

const isMain = process.argv[1]?.includes("initialize-locations");
if (isMain) {
  runStandalone();
}
