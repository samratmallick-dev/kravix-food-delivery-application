import mongoose from "mongoose";

export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-");
};

export const getUniqueSlug = async (name: string, id: string): Promise<string> => {
  const baseSlug = generateSlug(name);
  let slug = baseSlug;
  let counter = 1;
  const RestaurantModel = mongoose.model("Restaurant");
  while (true) {
    // Only exclude by _id when updating an existing restaurant (id is non-empty)
    const filter: Record<string, any> = { slug };
    if (id) {
      filter._id = { $ne: id };
    }
    const existing = await RestaurantModel.findOne(filter);
    if (!existing) {
      break;
    }
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
  return slug;
};
