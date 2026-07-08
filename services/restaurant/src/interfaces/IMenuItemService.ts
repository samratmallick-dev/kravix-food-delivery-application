import { MenuItem } from "../domain/entities/MenuItem.js";
import { MenuItemRequestDto } from "../dto/restaurant.dto.js";

export interface IMenuItemService {
  createMenuItem(restaurantId: string, dto: MenuItemRequestDto): Promise<MenuItem>;
  deleteMenuItem(restaurantId: string, itemId: string): Promise<void>;
  getMenuItems(restaurantId: string): Promise<MenuItem[]>;
  searchByFood(
    search: string,
    longitude: number,
    latitude: number,
    radius: number
  ): Promise<{ results: any[]; correctedQuery?: string }>;
  autocomplete(q: string, longitude: number, latitude: number, radius: number): Promise<any[]>;
  toggleMenuItemAvailability(itemId: string, ownerId: string): Promise<MenuItem>;
}
