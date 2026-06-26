import { Response } from "express";
import axios from "axios";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { AdminRequest } from "../middleware/isAdminAuthenticated.js";
import { Restaurant } from "../models/Restaurant.js";
import { MenuItem } from "../models/MenuItem.js";
import { publishAdminEvent } from "../config/rabbitmq.js";

export const getAllRestaurants = TryCatch(
      async (req: AdminRequest, res: Response) => {
            const page = Math.max(1, parseInt(req.query["page"] as string) || 1);
            const limit = Math.min(100, parseInt(req.query["limit"] as string) || 20);
            const { isVerified } = req.query;

            const filter: Record<string, unknown> = {};
            if (isVerified === "true") filter["isVerified"] = true;
            else if (isVerified === "false") filter["isVerified"] = false;

            const [restaurants, total] = await Promise.all([
                  Restaurant.find(filter)
                        .sort({ createdAt: -1 })
                        .skip((page - 1) * limit)
                        .limit(limit)
                        .lean(),
                  Restaurant.countDocuments(filter),
            ]);

            return res.status(200).json({
                  success: true,

                  message: "Restaurants fetched successfully",
                  error: false,
                  data: {
                        restaurants,
                        total,
                        page,
                        pages: Math.ceil(total / limit),
                  },
            });
      },
);

export const getRestaurantById = TryCatch(
      async (req: AdminRequest, res: Response) => {
            const { restaurantId } = req.params;
            const [restaurant, menuItems] = await Promise.all([
                  Restaurant.findById(restaurantId).lean(),
                  MenuItem.find({ restaurantId }).lean(),
            ]);
            if (!restaurant)
                  return res.status(404).json({
                        success: false,
                        message: "Restaurant not found",
                        error: true,
                  });
            return res.status(200).json({
                  success: true,
                  message: "Restaurant fetched successfully",
                  error: false,
                  data: { restaurant, menuItems },
            });
      },
);
export const verifyRestaurant = TryCatch(
      async (req: AdminRequest, res: Response) => {
            let isVerified: boolean;
            if (req.body && typeof req.body.isVerified === "boolean") {
                  isVerified = req.body.isVerified;
            } else {
                  const existing = await Restaurant.findById(req.params["restaurantId"]);
                  if (!existing) {
                        return res.status(404).json({
                              success: false,
                              message: "Restaurant not found",
                              error: true,
                        });
                  }
                  isVerified = !existing.isVerified;
            }

            const restaurant = await Restaurant.findByIdAndUpdate(
                  req.params["restaurantId"],
                  { isVerified },
                  { new: true },
            ).lean();
            if (!restaurant)
                  return res.status(404).json({
                        success: false,
                        message: "Restaurant not found",
                        error: true,
                  });

            const eventData = {
                  restaurantId: restaurant._id.toString(),
                  ownerId: restaurant.ownerId,
                  isVerified: restaurant.isVerified,
            };

            axios
                  .post(
                        `${process.env.REALTIME_SOCKET_SERVICE_URI}/api/v1/socket/events`,
                        {
                              event: "restaurant:verified",
                              room: `Restaurant:${restaurant._id.toString()}`,
                              payload: eventData,
                        },
                        { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } },
                  )
                  .catch((err) => {
                        console.error(
                              "Socket emit failed, publishing to admin_event_queue as fallback:",
                              err.message,
                        );
                        publishAdminEvent("RESTAURANT_VERIFIED", eventData);
                  });

            axios
                  .post(
                        `${process.env.REALTIME_SOCKET_SERVICE_URI}/api/v1/socket/events`,
                        {
                              event: "restaurant:verified",
                              room: `RestaurantStatus:${restaurant._id.toString()}`,
                              payload: eventData,
                        },
                        { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } },
                  )
                  .catch((err) =>
                        console.error("Socket emit to RestaurantStatus failed:", err.message),
                  );

            publishAdminEvent("RESTAURANT_VERIFIED", eventData);

            return res.status(200).json({
                  success: true,
                  message: `Restaurant ${isVerified ? "verified" : "unverified"} successfully`,
                  error: false,
                  data: restaurant,
            });
      },
);

export const deleteRestaurant = TryCatch(
      async (req: AdminRequest, res: Response) => {
            const { restaurantId } = req.params;
            const restaurant = await Restaurant.findByIdAndDelete(restaurantId);
            if (!restaurant)
                  return res.status(404).json({
                        success: false,
                        message: "Restaurant not found",
                        error: true,
                  });

            await MenuItem.deleteMany({ restaurantId });

            const deletedPayload = {
                  restaurantId: restaurant._id.toString(),
                  ownerId: restaurant.ownerId,
            };

            axios
                  .post(
                        `${process.env.REALTIME_SOCKET_SERVICE_URI}/api/v1/socket/events`,
                        {
                              event: "restaurant:deleted",
                              room: `Restaurant:${restaurant._id.toString()}`,
                              payload: deletedPayload,
                        },
                        { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } },
                  )
                  .catch((err) =>
                        console.error("Socket emit (seller) failed:", err.message),
                  );

            axios
                  .post(
                        `${process.env.REALTIME_SOCKET_SERVICE_URI}/api/v1/socket/events`,
                        {
                              event: "restaurant:deleted",
                              room: `RestaurantStatus:${restaurant._id.toString()}`,
                              payload: deletedPayload,
                        },
                        { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } },
                  )
                  .catch((err) =>
                        console.error("Socket emit (customers) failed:", err.message),
                  );

            publishAdminEvent("RESTAURANT_DELETED", deletedPayload);

            return res.status(200).json({
                  success: true,
                  message: "Restaurant and its menu items deleted",
                  error: false,
                  data: {},
            });
      },
);
