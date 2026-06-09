import { AuthenticatedRequest } from "../middleware/isAuthenticated.js";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { Response } from "express";
import { Restaurant } from "../model/Restaurant.js";
import { MenuItem } from "../model/MenuItems.js";
import { Order } from "../model/Order.js";
import { User } from "../model/User.js";
import { getBuffer } from "../config/datauri.js";
import axios from "axios";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { normalizeSearchQuery } from "../utils/searchNormalizer.js";

interface TokenPayload {
      _id: string;
      name: string;
      email: string;
      image: string;
      role: string | null;
      restaurantId?: string;
}

const tokengenerator = (user: TokenPayload): string => {
      const secretkey = process.env.JWT_SECRET;
      if (!secretkey) throw new Error("JWT_SECRET environment variable is not set");

      return jwt.sign(user, secretkey, { expiresIn: "15d" });
};

export const addRestaurant = TryCatch(
      async (req: AuthenticatedRequest, res: Response) => {
            const user = req.user;

            if (!user) {
                  return res.status(401).json({
                        message: "User not authenticated",
                        success: false,
                        error: true,
                  });
            }

            const existingRestaurant = await Restaurant.findOne({
                  ownerId: user?._id,
            });

            if (existingRestaurant) {
                  return res.status(400).json({
                        message: "Seller already has a restaurant",
                        success: false,
                        error: true,
                  });
            }

            const { name, description, latitude, longitude, formattedAddress, phone } =
                  req.body;

            if (
                  [name, latitude, longitude].some((field) => !field || field.trim() === "")
            ) {
                  return res.status(400).json({
                        message: "Name, latitude and longitude are required fields",
                        success: false,
                        error: true,
                  });
            }

            const file = req.file;
            if (!file) {
                  return res.status(400).json({
                        message: "Image file is required",
                        success: false,
                        error: true,
                  });
            }

            const fileBuffer = getBuffer(file);
            if (!fileBuffer) {
                  return res.status(500).json({
                        message: "Failed to create file buffer.",
                        success: false,
                        error: true,
                  });
            }

            const { data: updateResult } = await axios.post(
                  `${process.env.UTILS_SERVICE_URI}/api/v1/cloudinary/images`,
                  {
                        image: fileBuffer,
                  },
                  {
                        headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY },
                        maxContentLength: Infinity,
                        maxBodyLength: Infinity,
                  },
            );

            const restaurant = await Restaurant.create({
                  name,
                  description,
                  image: updateResult.url,
                  ownerId: user._id,
                  phone,
                  autoLocation: {
                        type: "Point",
                        coordinates: [Number(longitude), Number(latitude)],
                        formattedAddress,
                  },
            });

            const token = tokengenerator({
                  _id: user._id,
                  name: user.name,
                  email: user.email,
                  image: user.image,
                  role: user.role,
                  restaurantId: restaurant._id.toString(),
            });

            return res.status(201).json({
                  message: "Restaurant created successfully",
                  success: true,
                  error: false,
                  data: restaurant,
                  token,
            });
      },
);

export const fetchMyRestaurant = TryCatch(
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
                        message: "Restaurant not found for this seller",
                        success: false,
                        error: true,
                  });
            }

            if (!req.user?.restaurantId) {
                  const token = tokengenerator({
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        image: user.image,
                        role: user.role,
                        restaurantId: restaurant._id.toString(),
                  });

                  return res.status(200).json({
                        message: "Restaurant retrieved successfully",
                        success: true,
                        error: false,
                        data: restaurant,
                        token,
                  });
            }

            return res.status(200).json({
                  message: "Restaurant retrieved successfully",
                  success: true,
                  error: false,
                  data: restaurant,
            });
      },
);

export const updateRestaurantStatus = TryCatch(
      async (req: AuthenticatedRequest, res: Response) => {
            const user = req.user;
            if (!user) {
                  return res.status(401).json({
                        message: "User not authenticated",
                        success: false,
                        error: true,
                  });
            }

            const { status } = req.body;
            if (typeof status !== "boolean") {
                  return res.status(400).json({
                        message: "Status must be a boolean value",
                        success: false,
                        error: true,
                  });
            }

            if (status === false) {
                  const restaurant = await Restaurant.findOne({ ownerId: user._id });
                  if (restaurant) {
                        const activeOrder = await Order.findOne({
                              restaurantId: restaurant._id.toString(),
                              paymentStatus: "paid",
                              status: { $nin: ["delivered", "cancelled"] },
                        });
                        if (activeOrder) {
                              return res.status(400).json({
                                    message:
                                          "Cannot close restaurant with active orders. Please complete all orders first.",
                                    success: false,
                                    error: true,
                              });
                        }
                  }
            }

            const updateRestaurantStatus = await Restaurant.findOneAndUpdate(
                  { ownerId: user._id },
                  { isOpen: status },
                  { new: true },
            );

            if (!updateRestaurantStatus) {
                  return res.status(404).json({
                        message: "Failed to update restaurant status",
                        success: false,
                        error: true,
                  });
            }
            axios
                  .post(
                        `${process.env.REALTIME_SOCKET_SERVICE_URI}/api/v1/socket/events`,
                        {
                              event: "restaurant:status",
                              room: `Restaurant:${updateRestaurantStatus._id}`,
                              payload: {
                                    isOpen: updateRestaurantStatus.isOpen,
                                    restaurantId: updateRestaurantStatus._id.toString(),
                              },
                        },
                        { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } },
                  )
                  .catch((err) => console.error("Socket emit failed:", err.message));

            axios
                  .post(
                        `${process.env.REALTIME_SOCKET_SERVICE_URI}/api/v1/socket/events`,
                        {
                              event: "admin:restaurant:status",
                              room: "Admin",
                              payload: {
                                    restaurantId: updateRestaurantStatus._id.toString(),
                                    isOpen: updateRestaurantStatus.isOpen,
                              },
                        },
                        { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } },
                  )
                  .catch((err) => console.error("Admin socket emit failed:", err.message));

            return res.status(200).json({
                  message: "Restaurant status updated successfully",
                  success: true,
                  error: false,
                  data: updateRestaurantStatus,
            });
      },
);

export const updateRestaurant = TryCatch(
      async (req: AuthenticatedRequest, res: Response) => {
            const user = req.user;
            if (!user) {
                  return res.status(401).json({
                        message: "User not authenticated",
                        success: false,
                        error: true,
                  });
            }

            const { name, description } = req.body;
            const updates: { name?: string; description?: string; image?: string } = {};
            if (name) updates.name = name;
            if (description !== undefined) updates.description = description;

            const file = req.file;
            if (file) {
                  const fileBuffer = getBuffer(file);
                  if (!fileBuffer) {
                        return res.status(500).json({
                              message: "Failed to create file buffer.",
                              success: false,
                              error: true,
                        });
                  }
                  const { data: uploadResult } = await axios.post(
                        `${process.env.UTILS_SERVICE_URI}/api/v1/cloudinary/images`,
                        { image: fileBuffer },
                        {
                              headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY },
                              maxContentLength: Infinity,
                              maxBodyLength: Infinity,
                        },
                  );
                  updates.image = uploadResult.url;
            }

            const updatedRestaurant = await Restaurant.findOneAndUpdate(
                  { ownerId: user._id },
                  updates,
                  { new: true },
            );

            if (!updatedRestaurant) {
                  return res.status(404).json({
                        message: "Failed to update restaurant",
                        success: false,
                        error: true,
                  });
            }

            return res.status(200).json({
                  message: "Restaurant updated successfully",
                  success: true,
                  error: false,
                  data: updatedRestaurant,
            });
      },
);

export const getNearestRestaurant = TryCatch(
      async (req: AuthenticatedRequest, res: Response) => {
            const { latitude, longitude, radius = 5000, search = "" } = req.query;
            if (!latitude || !longitude) {
                  return res.status(400).json({
                        message: "Latitude and longitude are required",
                        success: false,
                        error: true,
                  });
            }

            const now = new Date();
            const blockedOwners = await User.find({
                  isBlocked: true,
                  blockedUntil: { $gt: now },
            }).distinct("_id");
            const blockedOwnerIds = blockedOwners.map((id: any) => id.toString());

            const geoNearStage = {
                  $geoNear: {
                        near: {
                              type: "Point" as const,
                              coordinates: [Number(longitude), Number(latitude)] as [
                                    number,
                                    number,
                              ],
                        },
                        distanceField: "distance",
                        maxDistance: Number(radius),
                        spherical: true,
                        query: {
                              isVerified: true,
                              ...(blockedOwnerIds.length > 0
                                    ? { ownerId: { $nin: blockedOwnerIds } }
                                    : {}),
                        },
                  },
            };

            const sortAndProject = [
                  { $sort: { distance: 1 as const, isOpen: -1 as const } },
                  {
                        $addFields: {
                              distanceKm: { $round: [{ $divide: ["$distance", 1000] }, 2] },
                        },
                  },
                  { $limit: 25 },
            ];

            let restaurants: any[] = [];
            let correctedQuery: string | undefined;

            if (search && typeof search === "string") {
                  const { normalized: normalizedSearch, corrected } = await normalizeSearchQuery(search);
                  if (corrected) correctedQuery = normalizedSearch;

                  const tokens = normalizedSearch.trim().split(/\s+/).filter(Boolean);
                  const nameRegex = new RegExp(tokens.join("|"), "i");

                  const byName = await Restaurant.aggregate([
                        {
                              ...geoNearStage,
                              $geoNear: {
                                    ...geoNearStage.$geoNear,
                                    query: {
                                          isVerified: true,
                                          name: { $regex: nameRegex },
                                          ...(blockedOwnerIds.length > 0 ? { ownerId: { $nin: blockedOwnerIds } } : {}),
                                    },
                              },
                        },
                        ...sortAndProject,
                  ]);

                  const matchingItems = await MenuItem.find({
                        name: { $regex: nameRegex },
                        isAvailable: true,
                  }).distinct("restaurantId");

                  const byMenuItems =
                        matchingItems.length > 0
                              ? await Restaurant.aggregate([
                                    {
                                          ...geoNearStage,
                                          $geoNear: {
                                                ...geoNearStage.$geoNear,
                                                query: {
                                                      isVerified: true,
                                                      _id: {
                                                            $in: matchingItems.map(
                                                                  (id: any) => new mongoose.Types.ObjectId(id.toString()),
                                                            ),
                                                      },
                                                      ...(blockedOwnerIds.length > 0 ? { ownerId: { $nin: blockedOwnerIds } } : {}),
                                                },
                                          },
                                    },
                                    ...sortAndProject,
                              ])
                              : [];

                  const seen = new Set<string>();
                  for (const r of [...byName, ...byMenuItems]) {
                        const key = r._id.toString();
                        if (!seen.has(key)) {
                              seen.add(key);
                              restaurants.push(r);
                        }
                  }
            } else {
                  restaurants = await Restaurant.aggregate([
                        geoNearStage,
                        ...sortAndProject,
                  ]);
            }

            return res.status(200).json({
                  message: "Restaurants fetched successfully",
                  success: true,
                  error: false,
                  count: restaurants.length,
                  data: restaurants,
                  ...(correctedQuery ? { correctedQuery } : {}),
            });
      },
);

export const fetchSingleRestaurant = TryCatch(
      async (req: AuthenticatedRequest, res: Response) => {
            const { id } = req.params;
            const restaurant = await Restaurant.findById({
                  _id: id,
            });
            if (!restaurant) {
                  return res.status(404).json({
                        message: "Restaurant not found",
                        success: false,
                        error: true,
                  });
            }
            return res.status(200).json({
                  message: "Restaurant fetched successfully",
                  success: true,
                  error: false,
                  data: restaurant,
            });
      },
);
