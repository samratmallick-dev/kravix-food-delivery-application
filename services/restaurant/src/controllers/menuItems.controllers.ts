import { AuthenticatedRequest } from "../middleware/isAuthenticated.js";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { Response } from "express";
import { Restaurant } from "../model/Restaurant.js";
import { getBuffer } from "../config/datauri.js";
import axios from "axios";
import { MenuItem } from "../model/MenuItems.js";

export const addMenuItems = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
      const user = req.user;
      if (!user) {
            return res.status(403).json({
                  message: "User not authenticated",
                  success: false,
                  error: true
            });
      }

      const restaurant = await Restaurant.findOne({
            ownerId: user._id
      });

      if (!restaurant) {
            return res.status(404).json({
                  message: "Restaurant not found",
                  success: false,
                  error: true
            });
      }

      const { name, description, price } = req.body;

      if ([name, price].some((field) => !field || field.trim() === "")) {
            return res.status(400).json({
                  message: "Name and price are required fields",
                  success: false,
                  error: true
            });
      }

      const file = req.file;
      if (!file) {
            return res.status(400).json({
                  message: "Menu item image is required",
                  success: false,
                  error: true
            });
      }

      const fileBuffer = getBuffer(file);
      if (!fileBuffer) {
            return res.status(500).json({
                  message: "Field to create file buffer.",
                  success: false,
                  error: true
            });
      }

      const { data: updateResult } = await axios.post(`${process.env.UTILS_SERVICE_URI}/api/v1/cloudinary/upload-image`, {
            image: fileBuffer
      });

      const menuItems = await MenuItem.create({
            restaurantId: restaurant._id,
            name,
            description,
            price,
            imageUrl: updateResult.url

      });

      return res.status(201).json({
            message: "Menu item added successfully",
            success: true,
            error: false,
            data: menuItems
      });
});

export const getAllMenuItems = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
      const user = req.user;
      if (!user) {
            return res.status(403).json({
                  message: "User not authenticated",
                  success: false,
                  error: true
            });
      }

      const { restaurantId } = req.params;
      if (!restaurantId) {
            return res.status(400).json({
                  message: "Restaurant ID is required",
                  success: false,
                  error: true
            });
      }

      const menuItems = await MenuItem.findById({restaurantId: restaurantId});
      return res.status(200).json({
            message: "Menu items fetched successfully",
            success: true,
            error: false,
            data: menuItems
      });
});

export const deleteMenuItem = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
      const user = req.user;
      if (!user) {
            return res.status(403).json({
                  message: "User not authenticated",
                  success: false,
                  error: true
            });
      }

      const { itemId } = req.params;
      if (!itemId) {
            return res.status(400).json({
                  message: "Menu Item ID is required",
                  success: false,
                  error: true
            });
      }

      const menuItem = await MenuItem.findById(itemId);
      if (!menuItem) {
            return res.status(404).json({
                  message: "Menu item not found",
                  success: false,
                  error: true
            });
      }

      const restaurant = await Restaurant.findOne({
            _id: menuItem.restaurantId,
            ownerId: user._id
      });

      if (!restaurant) {
            return res.status(404).json({
                  message: "Restaurant Not Found",
                  success: false,
                  error: true
            });  
      }

      await menuItem.deleteOne();
      return res.status(200).json({
            message: "Menu item deleted successfully",
            success: true,
            error: false,
            data: {}
      });

}); 

export const toggleMenuItemAvailability = TryCatch(async (req: AuthenticatedRequest, res: Response) =>{
      const user = req.user;
      if (!user) {
            return res.status(403).json({
                  message: "User not authenticated",
                  success: false,
                  error: true
            });
      }

      const { itemId } = req.params;
      if (!itemId) {
            return res.status(400).json({
                  message: "Menu Item ID is required",
                  success: false,
                  error: true
            });
      }

      const menuItem = await MenuItem.findById(itemId);
      if (!menuItem) {
            return res.status(404).json({
                  message: "Menu item not found",
                  success: false,
                  error: true
            });
      }

      const restaurant = await Restaurant.findOne({
            _id: menuItem.restaurantId,
            ownerId: user._id
      });

      if (!restaurant) {
            return res.status(404).json({
                  message: "Restaurant Not Found",
                  success: false,
                  error: true
            });  
      }

      menuItem.isAvailabe = !menuItem.isAvailabe;
      await menuItem.save();
      return res.status(200).json({
            message: "Menu item availability toggled successfully",
            success: true,
            error: false,
            data: menuItem
      });
});