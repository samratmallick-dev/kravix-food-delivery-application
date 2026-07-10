import mongoose from "mongoose";
import { IMenuItemService } from "../interfaces/IMenuItemService.js";
import { IMenuItemRepository } from "../interfaces/IMenuItemRepository.js";
import { IRestaurantRepository } from "../interfaces/IRestaurantRepository.js";
import { IRestaurantEventPublisher } from "../interfaces/IRestaurantEventPublisher.js";
import { MenuItem } from "../domain/entities/MenuItem.js";
import { MenuItemRequestDto } from "../dto/restaurant.dto.js";
import { MenuItem as MenuItemModel } from "../model/MenuItems.js";
import { Restaurant as RestaurantModel } from "../model/Restaurant.js";
import { NotFoundError, AuthorizationError } from "../utils/errors.js";
import { normalizeSearchQuery, prefixExpand } from "../utils/searchNormalizer.js";
import { ICache } from "../interfaces/ICache.js";

export class MenuItemService implements IMenuItemService {
  constructor(
    private menuItemRepository: IMenuItemRepository,
    private restaurantRepository: IRestaurantRepository,
    private eventPublisher: IRestaurantEventPublisher,
    private cache: ICache
  ) {}

  async createMenuItem(restaurantId: string, dto: MenuItemRequestDto): Promise<MenuItem> {
    const menuItem = new MenuItem(
      "",
      restaurantId,
      dto.name,
      dto.description || "",
      dto.price,
      dto.imageUrl || "",
      dto.isAvailable !== undefined ? dto.isAvailable : true,
      dto.isVeg !== undefined ? dto.isVeg : true,
      dto.category || "Main Course"
    );
    const created = await this.menuItemRepository.create(menuItem);
    
    // Invalidate caches
    await this.cache.delete("available_categories");
    await this.cache.delete(`menu_items:${restaurantId}`);

    return created;
  }

  async deleteMenuItem(restaurantId: string, itemId: string): Promise<void> {
    await this.menuItemRepository.delete(itemId, restaurantId);
    await this.eventPublisher.publishMenuItemDeleted(restaurantId, itemId);

    // Invalidate caches
    await this.cache.delete("available_categories");
    await this.cache.delete(`menu_items:${restaurantId}`);
  }

  async getMenuItems(restaurantId: string): Promise<MenuItem[]> {
    const cacheKey = `menu_items:${restaurantId}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }
    const items = await this.menuItemRepository.find(restaurantId);
    await this.cache.set(cacheKey, items, 300); // Cache for 5 minutes
    return items;
  }

  async searchByFood(
    search: string,
    longitude: number,
    latitude: number,
    radius: number
  ): Promise<{ results: any[]; correctedQuery?: string }> {
    const rawSearch = search.trim();
    const { normalized: normalizedSearch, corrected } = await normalizeSearchQuery(rawSearch);

    const buildAndRegex = (q: string) => {
      const tokens = q.trim().split(/\s+/).filter(Boolean);
      return { regex: new RegExp(tokens.map((t) => `(?=.*${t})`).join(""), "i"), tokens };
    };

    const findByRegex = (regex: RegExp) =>
      MenuItemModel.find({
        $or: [
          { name: { $regex: regex } },
          { category: { $regex: regex } },
          { description: { $regex: regex } }
        ],
        isAvailable: true
      })
        .select("restaurantId name price imageUrl description isAvailable category isVeg")
        .limit(50);

    const { regex: rawRegex, tokens: rawTokens } = buildAndRegex(rawSearch);
    let matchingItems = await findByRegex(rawRegex);

    if (!matchingItems.length && rawTokens.length > 1) {
      matchingItems = await findByRegex(new RegExp(rawTokens.join("|"), "i"));
    }

    let usedRawFallback = matchingItems.length > 0;

    if (!matchingItems.length && corrected && rawSearch.toLowerCase() !== normalizedSearch.toLowerCase()) {
      const { regex: searchRegex, tokens } = buildAndRegex(normalizedSearch);
      matchingItems = await findByRegex(searchRegex);

      if (!matchingItems.length && tokens.length > 1) {
        matchingItems = await findByRegex(new RegExp(tokens.join("|"), "i"));
      }
      usedRawFallback = false;
    }

    if (!matchingItems.length) {
      return { results: [] };
    }

    const restaurantIds = [...new Set(matchingItems.map((item) => item.restaurantId.toString()))];

    const runRestaurantGeoNear = (maxDistance: number) =>
      RestaurantModel.aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [Number(longitude), Number(latitude)]
            },
            distanceField: "distance",
            maxDistance,
            spherical: true,
            query: {
              _id: { $in: restaurantIds.map((id) => new mongoose.Types.ObjectId(id)) },
              isVerified: true
            }
          }
        },
        { $sort: { distance: 1, isOpen: -1 } },
        {
          $addFields: {
            distanceKm: { $round: [{ $divide: ["$distance", 1000] }, 2] }
          }
        }
      ]);

    let restaurants = await runRestaurantGeoNear(Number(radius));
    if (restaurants.length === 0 && Number(radius) < 50000) {
      restaurants = await runRestaurantGeoNear(50000);
    }

    const restaurantMap = new Map(restaurants.map((r: any) => [r._id.toString(), r]));

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
          category: item.category,
          isVeg: item.isVeg
        },
        restaurant: restaurantMap.get(item.restaurantId.toString())
      }));

    const response: { results: any[]; correctedQuery?: string } = {
      results
    };
    if (corrected && !usedRawFallback) {
      response.correctedQuery = normalizedSearch;
    }

    return response;
  }

  async autocomplete(q: string, longitude: number, latitude: number, radius: number): Promise<any[]> {
    const query = q.trim();
    if (!query) return [];

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

    let nearbyIds: any[] = await RestaurantModel.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [Number(longitude), Number(latitude)] },
          distanceField: "distance",
          maxDistance: Number(radius),
          spherical: true,
          query: { isVerified: true }
        }
      },
      { $project: { _id: 1 } },
      { $limit: 200 }
    ]).then((rs: any[]) => rs.map((r) => r._id));

    if (nearbyIds.length === 0) {
      nearbyIds = await RestaurantModel.aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: [Number(longitude), Number(latitude)] },
            distanceField: "distance",
            maxDistance: 50000,
            spherical: true,
            query: { isVerified: true }
          }
        },
        { $project: { _id: 1 } },
        { $limit: 200 }
      ]).then((rs: any[]) => rs.map((r) => r._id));
    }

    const proximityFilter = nearbyIds.length > 0 ? { $in: nearbyIds } : { $exists: true };

    const [foodByExpanded, restByExpanded, restByRaw] = await Promise.all([
      MenuItemModel.find({
        name: { $regex: expandedRegex },
        isAvailable: true,
        restaurantId: proximityFilter
      }).select("name imageUrl restaurantId price").limit(5).lean(),

      RestaurantModel.find({
        $or: [{ name: { $regex: expandedRegex } }, { description: { $regex: expandedRegex } }],
        isVerified: true,
        _id: proximityFilter
      }).select("name image slug").limit(4).lean(),

      RestaurantModel.find({
        $or: [{ name: { $regex: rawRegex } }, { description: { $regex: rawRegex } }],
        isVerified: true,
        _id: proximityFilter
      }).select("name image slug").limit(4).lean()
    ]);

    const finalFood = foodByExpanded.length > 0
      ? foodByExpanded
      : await MenuItemModel.find({
          name: { $regex: rawRegex },
          isAvailable: true,
          restaurantId: proximityFilter
        }).select("name imageUrl restaurantId price").limit(5).lean();

    const seenIds = new Set<string>();
    const finalRestaurants: any[] = [];
    for (const r of [...restByExpanded, ...restByRaw]) {
      const key = r._id.toString();
      if (!seenIds.has(key)) {
        seenIds.add(key);
        finalRestaurants.push(r);
      }
    }

    const suggestions = [
      ...finalRestaurants.slice(0, 4).map((r: any) => ({
        id: r.slug || r._id.toString(),
        name: r.name,
        image: r.image || "",
        type: "Restaurant" as const
      })),
      ...finalFood.slice(0, 5).map((f: any) => ({
        id: f._id.toString(),
        name: f.name,
        image: f.imageUrl || "",
        type: "Dish" as const,
        restaurantId: f.restaurantId.toString()
      }))
    ];

    return suggestions;
  }

  async toggleMenuItemAvailability(itemId: string, ownerId: string): Promise<MenuItem> {
    const menuItem = await this.menuItemRepository.findById(itemId);
    if (!menuItem) {
      throw new NotFoundError("Menu item not found");
    }

    const restaurant = await this.restaurantRepository.findById(menuItem.restaurantId);
    if (!restaurant || restaurant.ownerId !== ownerId) {
      throw new AuthorizationError("Access denied. You don't own this restaurant.");
    }

    const updated = new MenuItem(
      menuItem.id,
      menuItem.restaurantId,
      menuItem.name,
      menuItem.description,
      menuItem.price,
      menuItem.imageUrl,
      !menuItem.isAvailable,
      menuItem.isVeg,
      menuItem.category
    );

    const saved = await this.menuItemRepository.update(updated);

    // Invalidate caches
    await this.cache.delete("available_categories");
    await this.cache.delete(`menu_items:${saved.restaurantId}`);

    const payload: Record<string, any> = {
      itemId: saved.id,
      isAvailable: saved.isAvailable
    };

    if (saved.isAvailable) {
      payload.item = {
        _id: saved.id,
        name: saved.name,
        price: saved.price,
        imageUrl: saved.imageUrl,
        description: saved.description,
        isAvailable: true,
        isVeg: saved.isVeg,
        category: saved.category
      };
      payload.restaurant = restaurant;
    }

    await this.eventPublisher.publishMenuItemAvailability(saved.restaurantId, payload);

    return saved;
  }

  async updateMenuItem(
    itemId: string,
    ownerId: string,
    dto: MenuItemRequestDto
  ): Promise<MenuItem> {
    const menuItem = await this.menuItemRepository.findById(itemId);
    if (!menuItem) {
      throw new NotFoundError("Menu item not found");
    }

    const restaurant = await this.restaurantRepository.findById(menuItem.restaurantId);
    if (!restaurant || restaurant.ownerId !== ownerId) {
      throw new AuthorizationError("Access denied. You don't own this restaurant.");
    }

    const updated = new MenuItem(
      menuItem.id,
      menuItem.restaurantId,
      dto.name,
      dto.description || "",
      dto.price,
      dto.imageUrl || menuItem.imageUrl,
      dto.isAvailable !== undefined ? dto.isAvailable : menuItem.isAvailable,
      dto.isVeg !== undefined ? dto.isVeg : menuItem.isVeg,
      dto.category || menuItem.category
    );

    const saved = await this.menuItemRepository.update(updated);

    // Invalidate caches
    await this.cache.delete("available_categories");
    await this.cache.delete(`menu_items:${saved.restaurantId}`);

    const broadcastPayload = {
      _id: saved.id,
      name: saved.name,
      price: saved.price,
      imageUrl: saved.imageUrl,
      description: saved.description,
      isAvailable: saved.isAvailable,
      isVeg: saved.isVeg,
      category: saved.category
    };

    await this.eventPublisher.publishMenuItemAvailability(saved.restaurantId, {
      itemId: saved.id,
      isAvailable: saved.isAvailable,
      item: broadcastPayload,
      restaurant
    });

    return saved;
  }

  async getAvailableCategories(): Promise<any[]> {
    const cacheKey = "available_categories";
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const categories = await MenuItemModel.aggregate([
      { $match: { isAvailable: true } },
      {
        $lookup: {
          from: "restaurants",
          localField: "restaurantId",
          foreignField: "_id",
          as: "restaurant"
        }
      },
      { $unwind: "$restaurant" },
      { $match: { "restaurant.isVerified": true } },
      {
        $group: {
          _id: { $toLower: "$category" },
          originalName: { $first: "$category" },
          count: { $sum: 1 },
          image: { $first: "$imageUrl" }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const result = categories.map((cat: any) => ({
      name: cat.originalName,
      count: cat.count,
      image: cat.image || ""
    }));

    await this.cache.set(cacheKey, result, 300); // cache for 5 minutes
    return result;
  }
}
