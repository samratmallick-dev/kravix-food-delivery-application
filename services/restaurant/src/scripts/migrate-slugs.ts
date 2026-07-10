import mongoose from "mongoose";
import "dotenv/config";
import connectDb from "../config/db/db.js";
import { Restaurant as RestaurantModel } from "../model/Restaurant.js";
import { getUniqueSlug } from "../utils/slugify.js";

export const runMigration = async () => {
  const restaurants = await RestaurantModel.find({
    $or: [
      { slug: { $exists: false } },
      { slug: null },
      { slug: "" }
    ]
  });

  for (const restaurant of restaurants) {
    const slug = await getUniqueSlug(restaurant.name, restaurant._id.toString());
    await RestaurantModel.findByIdAndUpdate(restaurant._id, { $set: { slug } });
  }
};

const runStandalone = async () => {
  try {
    await connectDb();
    await runMigration();
    await mongoose.connection.close();
  } catch (err) {
    process.exit(1);
  }
};

const isMain = process.argv[1]?.includes("migrate-slugs");
if (isMain) {
  runStandalone();
}
