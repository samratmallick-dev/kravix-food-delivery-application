import { MenuItem } from "../domain/entities/MenuItem.js";

export class MenuItemMapper {
  static toDomain(raw: any): MenuItem {
    return new MenuItem(
      raw._id.toString(),
      raw.restaurantId?.toString() || raw.restaurantId,
      raw.name,
      raw.description || "",
      raw.price,
      raw.imageUrl || "",
      raw.isAvailable ?? true,
      raw.isVeg ?? true,
      raw.category || "Main Course"
    );
  }

  static toPersistence(domain: MenuItem): any {
    return {
      restaurantId: domain.restaurantId,
      name: domain.name,
      description: domain.description,
      price: domain.price,
      imageUrl: domain.imageUrl,
      isAvailable: domain.isAvailable,
      isVeg: domain.isVeg,
      category: domain.category
    };
  }
}
