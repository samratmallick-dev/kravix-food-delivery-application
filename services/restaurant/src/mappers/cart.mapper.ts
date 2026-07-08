import { Cart } from "../domain/entities/Cart.js";

export class CartMapper {
  static toDomain(raw: any): Cart {
    return new Cart(
      raw._id.toString(),
      raw.userId,
      raw.itemId?.toString() || raw.itemId,
      raw.restaurantId?.toString() || raw.restaurantId,
      raw.quantity
    );
  }

  static toPersistence(domain: Cart): any {
    return {
      userId: domain.userId,
      itemId: domain.itemId,
      restaurantId: domain.restaurantId,
      quantity: domain.quantity
    };
  }
}
