import { IMenuItemRepository } from "../interfaces/IMenuItemRepository.js";
import { MenuItem } from "../domain/entities/MenuItem.js";
import { MenuItem as MenuItemModel } from "../model/MenuItems.js";
import { MenuItemMapper } from "../mappers/menu-item.mapper.js";

export class MenuItemRepository implements IMenuItemRepository {
  async find(restaurantId: string): Promise<MenuItem[]> {
    const raw = await MenuItemModel.find({ restaurantId }).lean();
    return raw.map(MenuItemMapper.toDomain);
  }

  async findById(id: string): Promise<MenuItem | null> {
    const raw = await MenuItemModel.findById(id).lean();
    if (!raw) return null;
    return MenuItemMapper.toDomain(raw);
  }

  async create(menuItem: MenuItem): Promise<MenuItem> {
    const persistence = MenuItemMapper.toPersistence(menuItem);
    const raw = await MenuItemModel.create(persistence);
    return MenuItemMapper.toDomain(raw);
  }

  async update(menuItem: MenuItem): Promise<MenuItem> {
    const persistence = MenuItemMapper.toPersistence(menuItem);
    const raw = await MenuItemModel.findByIdAndUpdate(
      menuItem.id,
      { $set: persistence },
      { new: true }
    );
    if (!raw) {
      throw new Error("Menu item not found");
    }
    return MenuItemMapper.toDomain(raw);
  }

  async delete(id: string, restaurantId: string): Promise<void> {
    await MenuItemModel.deleteOne({ _id: id, restaurantId });
  }

  async findRestaurantIdsByItemNameRegex(nameRegex: RegExp): Promise<string[]> {
    const ids = await MenuItemModel.find({
      name: { $regex: nameRegex },
      isAvailable: true
    }).distinct("restaurantId");
    return ids.map((id: any) => id.toString());
  }
}
