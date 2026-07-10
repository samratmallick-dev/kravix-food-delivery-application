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
    const existing = await RestaurantModel.findOne({ slug, _id: { $ne: id } });
    if (!existing) {
      break;
    }
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
  return slug;
};
