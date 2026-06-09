import { AuthenticatedRequest } from "../middleware/isAuthenticated.js";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { Response } from "express";
import { Restaurant } from "../model/Restaurant.js";
import { getBuffer } from "../config/datauri.js";
import axios from "axios";
import { MenuItem } from "../model/MenuItems.js";
import mongoose from "mongoose";
import { normalizeSearchQuery, prefixExpand } from "../utils/searchNormalizer.js";

export const addMenuItems = TryCatch(
      async (req: AuthenticatedRequest, res: Response) => {
            const user = req.user;
            if (!user) {
                  return res.status(401).json({
                        message: "User not authenticated",
                        success: false,
                        error: true,
                  });
            }

            const restaurant = await Restaurant.findOne({
                  ownerId: user._id,
            });

            if (!restaurant) {
                  return res.status(404).json({
                        message: "Restaurant not found",
                        success: false,
                        error: true,
                  });
            }

            const { name, description, price } = req.body;

            if ([name, price].some((field) => !field || field.trim() === "")) {
                  return res.status(400).json({
                        message: "Name and price are required fields",
                        success: false,
                        error: true,
                  });
            }

            const file = req.file;
            if (!file) {
                  return res.status(400).json({
                        message: "Menu item image is required",
                        success: false,
                        error: true,
                  });
            }

            const fileBuffer = getBuffer(file);
            if (!fileBuffer) {
                  return res.status(400).json({
                        message: "Failed to process image file. Please upload a valid image.",
                        success: false,
                        error: true,
                  });
            }

            const { data: updateResult } = await axios.post(
                  `${process.env.UTILS_SERVICE_URI}/api/v1/cloudinary/images`,
                  { image: fileBuffer },
                  {
                        headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY },
                        maxContentLength: Infinity,
                        maxBodyLength: Infinity,
                  },
            );

            const menuItems = await MenuItem.create({
                  restaurantId: restaurant._id,
                  name,
                  description,
                  price,
                  imageUrl: updateResult.url,
            });

            return res.status(201).json({
                  message: "Menu item added successfully",
                  success: true,
                  error: false,
                  data: menuItems,
            });
      },
);

export const getAllMenuItems = TryCatch(
      async (req: AuthenticatedRequest, res: Response) => {
            const user = req.user;
            if (!user) {
                  return res.status(401).json({
                        message: "User not authenticated",
                        success: false,
                        error: true,
                  });
            }

            const { restaurantId } = req.params;
            if (!restaurantId) {
                  return res.status(400).json({
                        message: "Restaurant ID is required",
                        success: false,
                        error: true,
                  });
            }

            const menuItems = await MenuItem.find({ restaurantId });
            return res.status(200).json({
                  message: "Menu items fetched successfully",
                  success: true,
                  error: false,
                  data: menuItems,
            });
      },
);

export const deleteMenuItem = TryCatch(
      async (req: AuthenticatedRequest, res: Response) => {
            const user = req.user;
            if (!user) {
                  return res.status(401).json({
                        message: "User not authenticated",
                        success: false,
                        error: true,
                  });
            }

            const { itemId } = req.params;
            if (!itemId) {
                  return res.status(400).json({
                        message: "Menu Item ID is required",
                        success: false,
                        error: true,
                  });
            }

            const menuItem = await MenuItem.findById(itemId);
            if (!menuItem) {
                  return res.status(404).json({
                        message: "Menu item not found",
                        success: false,
                        error: true,
                  });
            }

            const restaurant = await Restaurant.findOne({
                  _id: menuItem.restaurantId,
                  ownerId: user._id,
            });

            if (!restaurant) {
                  return res.status(403).json({
                        message: "Access denied. You don't own this restaurant.",
                        success: false,
                        error: true,
                  });
            }

            await menuItem.deleteOne();

            axios
                  .post(
                        `${process.env.REALTIME_SOCKET_SERVICE_URI}/api/v1/socket/events`,
                        {
                              event: "menuitem:deleted",
                              room: `Restaurant:${menuItem.restaurantId}`,
                              payload: { itemId: menuItem._id.toString() },
                        },
                        { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } },
                  )
                  .catch((err) => console.error("Socket emit failed:", err.message));

            return res.status(200).json({
                  message: "Menu item deleted successfully",
                  success: true,
                  error: false,
                  data: {},
            });
      },
);

export const searchByFood = TryCatch(
      async (req: AuthenticatedRequest, res: Response) => {
            const { search = "", latitude, longitude, radius = 5000 } = req.query;

            if (!latitude || !longitude) {
                  return res.status(400).json({
                        message: "Latitude and longitude are required",
                        success: false,
                        error: true,
                  });
            }

            const { normalized: normalizedSearch, corrected } = await normalizeSearchQuery(search as string);

            const tokens = normalizedSearch.trim().split(/\s+/).filter(Boolean);
            const regexPattern = tokens.map((t) => `(?=.*${t})`).join("");
            const searchRegex = new RegExp(regexPattern, "i");

            let matchingItems = await MenuItem.find({
                  name: { $regex: searchRegex },
                  isAvailable: true,
            })
                  .select("restaurantId name price imageUrl description isAvailable")
                  .limit(50);

            if (!matchingItems.length && tokens.length > 1) {
                  const broadRegex = new RegExp(tokens.join("|"), "i");
                  matchingItems = await MenuItem.find({
                        name: { $regex: broadRegex },
                        isAvailable: true,
                  })
                        .select("restaurantId name price imageUrl description isAvailable")
                        .limit(50);
            }

            if (!matchingItems.length) {
                  return res.status(200).json({
                        message: "No food items found",
                        success: true,
                        error: false,
                        data: [],
                        correctedQuery: corrected ? normalizedSearch : undefined,
                  });
            }

            const restaurantIds = [
                  ...new Set(matchingItems.map((item) => item.restaurantId.toString())),
            ];

            const restaurants = await Restaurant.aggregate([
                  {
                        $geoNear: {
                              near: {
                                    type: "Point",
                                    coordinates: [Number(longitude), Number(latitude)],
                              },
                              distanceField: "distance",
                              maxDistance: Number(radius),
                              spherical: true,
                              query: {
                                    _id: {
                                          $in: restaurantIds.map((id) => new mongoose.Types.ObjectId(id)),
                                    },
                                    isVerified: true,
                              },
                        },
                  },
                  { $sort: { distance: 1, isOpen: -1 } },
                  {
                        $addFields: {
                              distanceKm: { $round: [{ $divide: ["$distance", 1000] }, 2] },
                        },
                  },
            ]);

            const restaurantMap = new Map(
                  restaurants.map((r: any) => [r._id.toString(), r]),
            );

            const results = matchingItems
                  .filter((item) => restaurantMap.has(item.restaurantId.toString()))
                  .slice(0, 25)
                  .map((item) => ({
                        item: {
                              _id: item._id,
                              name: item.name,
                              price: item.price,
                              imageUrl: item.imageUrl,
                              description: item.description,
                              isAvailable: item.isAvailable,
                        },
                        restaurant: restaurantMap.get(item.restaurantId.toString()),
                  }));

            return res.status(200).json({
                  message: "Food search results fetched successfully",
                  success: true,
                  error: false,
                  data: results,
                  ...(corrected ? { correctedQuery: normalizedSearch } : {}),
            });
      },
);

export const autocomplete = TryCatch(
      async (req: AuthenticatedRequest, res: Response) => {
            const { q = "", latitude, longitude, radius = 10000 } = req.query;
            const query = (q as string).trim();

            if (!query) return res.status(200).json({ success: true, data: [] });
            if (!latitude || !longitude) {
                  return res.status(400).json({ message: "Latitude and longitude are required", success: false, error: true });
            }

            const lower = query.toLowerCase();

            const rawTokens = lower.split(/\s+/).filter(Boolean);
            const expandedTokens = rawTokens.map((t) => prefixExpand(t) ?? t);

            const allUnchanged = expandedTokens.every((t, i) => t === rawTokens[i]);
            let finalTokens = expandedTokens;
            if (allUnchanged && lower.length >= 5) {
                  const { normalized } = await normalizeSearchQuery(lower);
                  finalTokens = normalized.trim().split(/\s+/).filter(Boolean);
            }

            const expandedRegex = new RegExp(finalTokens.map((t) => `(?=.*${t})`).join(""), "i");
            const rawRegex = new RegExp(lower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

            let nearbyIds: any[] = await Restaurant.aggregate([
                  {
                        $geoNear: {
                              near: { type: "Point", coordinates: [Number(longitude), Number(latitude)] },
                              distanceField: "distance",
                              maxDistance: Number(radius),
                              spherical: true,
                              query: { isVerified: true },
                        },
                  },
                  { $project: { _id: 1 } },
                  { $limit: 200 },
            ]).then((rs: any[]) => rs.map((r) => r._id));

            if (nearbyIds.length === 0) {
                  nearbyIds = await Restaurant.aggregate([
                        {
                              $geoNear: {
                                    near: { type: "Point", coordinates: [Number(longitude), Number(latitude)] },
                                    distanceField: "distance",
                                    maxDistance: 50000,
                                    spherical: true,
                                    query: { isVerified: true },
                              },
                        },
                        { $project: { _id: 1 } },
                        { $limit: 200 },
                  ]).then((rs: any[]) => rs.map((r) => r._id));
            }

            const proximityFilter = nearbyIds.length > 0 ? { $in: nearbyIds } : { $exists: true };

            const [foodByExpanded, restByExpanded, restByRaw] = await Promise.all([
                  MenuItem.find({
                        name: { $regex: expandedRegex },
                        isAvailable: true,
                        restaurantId: proximityFilter,
                  }).select("name imageUrl restaurantId price").limit(5).lean(),

                  Restaurant.find({
                        $or: [{ name: { $regex: expandedRegex } }, { description: { $regex: expandedRegex } }],
                        isVerified: true,
                        _id: proximityFilter,
                  }).select("name image").limit(4).lean(),

                  Restaurant.find({
                        $or: [{ name: { $regex: rawRegex } }, { description: { $regex: rawRegex } }],
                        isVerified: true,
                        _id: proximityFilter,
                  }).select("name image").limit(4).lean(),
            ]);

            const finalFood = foodByExpanded.length > 0
                  ? foodByExpanded
                  : await MenuItem.find({
                        name: { $regex: rawRegex },
                        isAvailable: true,
                        restaurantId: proximityFilter,
                  }).select("name imageUrl restaurantId price").limit(5).lean();

            const seenIds = new Set<string>();
            const finalRestaurants: any[] = [];
            for (const r of [...restByExpanded, ...restByRaw]) {
                  const key = r._id.toString();
                  if (!seenIds.has(key)) { seenIds.add(key); finalRestaurants.push(r); }
            }

            const suggestions = [
                  ...finalRestaurants.slice(0, 4).map((r: any) => ({
                        id: r._id.toString(),
                        name: r.name,
                        image: r.image || "",
                        type: "Restaurant" as const,
                  })),
                  ...finalFood.slice(0, 5).map((f: any) => ({
                        id: f._id.toString(),
                        name: f.name,
                        image: f.imageUrl || "",
                        type: "Dish" as const,
                        restaurantId: f.restaurantId.toString(),
                  })),
            ];

            return res.status(200).json({ success: true, data: suggestions });
      },
);

export const toggleMenuItemAvailability = TryCatch(
      async (req: AuthenticatedRequest, res: Response) => {
            const user = req.user;
            if (!user) {
                  return res.status(401).json({
                        message: "User not authenticated",
                        success: false,
                        error: true,
                  });
            }

            const { itemId } = req.params;
            if (!itemId) {
                  return res.status(400).json({
                        message: "Menu Item ID is required",
                        success: false,
                        error: true,
                  });
            }

            const menuItem = await MenuItem.findById(itemId);
            if (!menuItem) {
                  return res.status(404).json({
                        message: "Menu item not found",
                        success: false,
                        error: true,
                  });
            }

            const restaurant = await Restaurant.findOne({
                  _id: menuItem.restaurantId,
                  ownerId: user._id,
            });

            if (!restaurant) {
                  return res.status(403).json({
                        message: "Access denied. You don't own this restaurant.",
                        success: false,
                        error: true,
                  });
            }

            menuItem.isAvailable = !menuItem.isAvailable;
            await menuItem.save();

            const payload: Record<string, any> = {
                  itemId: menuItem._id.toString(),
                  isAvailable: menuItem.isAvailable,
            };

            if (menuItem.isAvailable) {
                  payload.item = {
                        _id: menuItem._id,
                        name: menuItem.name,
                        price: menuItem.price,
                        imageUrl: menuItem.imageUrl,
                        description: menuItem.description,
                        isAvailable: true,
                  };
                  payload.restaurant = restaurant;
            }

            axios
                  .post(
                        `${process.env.REALTIME_SOCKET_SERVICE_URI}/api/v1/socket/events`,
                        {
                              event: "menuitem:availability",
                              room: `Restaurant:${menuItem.restaurantId}`,
                              payload,
                        },
                        { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } },
                  )
                  .catch((err) => console.error("Socket emit failed:", err.message));

            return res.status(200).json({
                  message: "Menu item availability toggled successfully",
                  success: true,
                  error: false,
                  data: menuItem,
            });
      },
);
