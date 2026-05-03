import { Response } from "express";
import axios from "axios";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { AdminRequest } from "../middleware/isAdminAuthenticated.js";
import { Restaurant } from "../models/Restaurant.js";
import { MenuItem } from "../models/MenuItem.js";
import { publishAdminEvent } from "../config/rabbitmq.js";

export const updateMenuItem = TryCatch(async (req: AdminRequest, res: Response) => {
      const { name, description, price, isAvailable } = req.body as { name?: string; description?: string; price?: string | number; isAvailable?: boolean };

      if (price !== undefined && (isNaN(Number(price)) || Number(price) < 0)) {
            return res.status(400).json({ success: false, message: "Price must be a non-negative number", error: true });
      }
      if (isAvailable !== undefined && typeof isAvailable !== "boolean") {
            return res.status(400).json({ success: false, message: "isAvailable must be a boolean", error: true });
      }

      const updates: Record<string, unknown> = {};
      if (name !== undefined) updates["name"] = name.trim();
      if (description !== undefined) updates["description"] = description.trim();
      if (price !== undefined) updates["price"] = Number(price);
      if (isAvailable !== undefined) updates["isAvailable"] = isAvailable;

      if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: "No valid fields to update", error: true });
      }

      const item = await MenuItem.findByIdAndUpdate(
            req.params["itemId"],
            updates,
            { new: true, runValidators: true }
      ).lean();

      if (!item) return res.status(404).json({ success: false, message: "Menu item not found", error: true });

      const eventData = { itemId: item._id.toString(), restaurantId: item.restaurantId.toString(), name: item.name, price: item.price, isAvailable: item.isAvailable };
      publishAdminEvent("MENU_ITEM_UPDATED", eventData);

      return res.status(200).json({ success: true, message: "Menu item updated successfully", error: false, data: item });
});

export const getAllRestaurants = TryCatch(async (req: AdminRequest, res: Response) => {
      const page = Math.max(1, parseInt(req.query["page"] as string) || 1);
      const limit = Math.min(100, parseInt(req.query["limit"] as string) || 20);
      const { isVerified } = req.query;

      const filter: Record<string, unknown> = {};
      if (isVerified === "true") filter["isVerified"] = true;
      else if (isVerified === "false") filter["isVerified"] = false;

      const [restaurants, total] = await Promise.all([
            Restaurant.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
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
                  pages: Math.ceil(total / limit)
            },
      });
});

export const getRestaurantById = TryCatch(async (req: AdminRequest, res: Response) => {
      const { restaurantId } = req.params;
      const [restaurant, menuItems] = await Promise.all([
            Restaurant.findById(restaurantId).lean(),
            MenuItem.find({ restaurantId }).lean(),
      ]);
      if (!restaurant) return res.status(404).json({
            success: false,
            message: "Restaurant not found",
            error: true
      });
      return res.status(200).json({
            success: true,
            message: "Restaurant fetched successfully",
            error: false,
            data: { restaurant, menuItems },
      });
});

export const verifyRestaurant = TryCatch(async (req: AdminRequest, res: Response) => {
      const { isVerified } = req.body as { isVerified: boolean };
      if (typeof isVerified !== "boolean") {
            return res.status(400).json({
                  success: false,
                  message: "isVerified must be a boolean",
                  error: true
            });
      }

      const restaurant = await Restaurant.findByIdAndUpdate(
            req.params["restaurantId"],
            { isVerified },
            { new: true }
      ).lean();
      if (!restaurant) return res.status(404).json({
            success: false,
            message: "Restaurant not found",
            error: true
      });

      const eventData = {
            restaurantId: restaurant._id.toString(),
            ownerId: restaurant.ownerId,
            isVerified: restaurant.isVerified
      };

      axios.post(
            `${process.env.REALTIME_SOCKET_SERVICE_URI}/api/v1/socket/events`,
            {
                  event: "restaurant:verified",
                  room: `Restaurant:${restaurant._id.toString()}`,
                  payload: eventData,
            },
            { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } }
      ).catch((err) => {
            console.error("Socket emit failed, publishing to admin_event_queue as fallback:", err.message);
            publishAdminEvent("RESTAURANT_VERIFIED", eventData);
      });

      axios.post(
            `${process.env.REALTIME_SOCKET_SERVICE_URI}/api/v1/socket/events`,
            {
                  event: "restaurant:verified",
                  room: `RestaurantStatus:${restaurant._id.toString()}`,
                  payload: eventData,
            },
            { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } }
      ).catch((err) => console.error("Socket emit to RestaurantStatus failed:", err.message));

      publishAdminEvent("RESTAURANT_VERIFIED", eventData);

      return res.status(200).json({
            success: true,
            message: `Restaurant ${isVerified ? "verified" : "unverified"} successfully`,
            error: false,
            data: restaurant,
      });
});

export const updateRestaurant = TryCatch(async (req: AdminRequest, res: Response) => {
      const { name, description, phone } = req.body as { name?: string; description?: string; phone?: string | number };

      if (phone !== undefined && isNaN(Number(phone))) {
            return res.status(400).json({ success: false, message: "Phone must be a valid number", error: true });
      }

      const updates: Record<string, unknown> = {};
      if (name !== undefined) updates["name"] = name.trim();
      if (description !== undefined) updates["description"] = description.trim();
      if (phone !== undefined) updates["phone"] = Number(phone);

      if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: "No valid fields to update", error: true });
      }

      const restaurant = await Restaurant.findByIdAndUpdate(
            req.params["restaurantId"],
            updates,
            { new: true, runValidators: true }
      ).lean();

      if (!restaurant) return res.status(404).json({ success: false, message: "Restaurant not found", error: true });

      const eventData = { restaurantId: restaurant._id.toString(), name: restaurant.name, description: restaurant.description, phone: restaurant.phone };

      axios.post(
            `${process.env.REALTIME_SOCKET_SERVICE_URI}/api/v1/socket/events`,
            { event: "admin:restaurant:updated", room: `Restaurant:${restaurant._id.toString()}`, payload: eventData },
            { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } }
      ).catch((err) => {
            console.error("Socket emit failed for restaurant update:", err.message);
            publishAdminEvent("RESTAURANT_UPDATED", eventData);
      });

      publishAdminEvent("RESTAURANT_UPDATED", eventData);

      return res.status(200).json({ success: true, message: "Restaurant updated successfully", error: false, data: restaurant });
});

export const deleteRestaurant = TryCatch(async (req: AdminRequest, res: Response) => {
      const { restaurantId } = req.params;
      const restaurant = await Restaurant.findByIdAndDelete(restaurantId);
      if (!restaurant) return res.status(404).json({
            success: false,
            message: "Restaurant not found",
            error: true
      });

      await MenuItem.deleteMany({ restaurantId });

      const deletedPayload = {
            restaurantId: restaurant._id.toString(),
            ownerId: restaurant.ownerId,
      };

      axios.post(
            `${process.env.REALTIME_SOCKET_SERVICE_URI}/api/v1/socket/events`,
            {
                  event: "restaurant:deleted",
                  room: `Restaurant:${restaurant._id.toString()}`,
                  payload: deletedPayload,
            },
            { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } }
      ).catch((err) => console.error("Socket emit (seller) failed:", err.message));

      axios.post(
            `${process.env.REALTIME_SOCKET_SERVICE_URI}/api/v1/socket/events`,
            {
                  event: "restaurant:deleted",
                  room: `RestaurantStatus:${restaurant._id.toString()}`,
                  payload: deletedPayload,
            },
            { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } }
      ).catch((err) => console.error("Socket emit (customers) failed:", err.message));

      publishAdminEvent("RESTAURANT_DELETED", deletedPayload);

      return res.status(200).json({
            success: true,
            message: "Restaurant and its menu items deleted",
            error: false,
            data: {}
      });
});
