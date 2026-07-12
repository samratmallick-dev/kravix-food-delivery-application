import { MenuItem } from "../domain/entities/MenuItem.js";

export interface IMenuItemRepository {
  find(restaurantId: string): Promise<MenuItem[]>;
  findById(id: string): Promise<MenuItem | null>;
  findByIds(ids: string[]): Promise<MenuItem[]>;
  create(menuItem: MenuItem): Promise<MenuItem>;
  update(menuItem: MenuItem): Promise<MenuItem>;
  delete(id: string, restaurantId: string): Promise<void>;
  findRestaurantIdsByItemNameRegex(nameRegex: RegExp): Promise<string[]>;
}
