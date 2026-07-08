import { ICartService } from "../interfaces/ICartService.js";
import { ICartRepository } from "../interfaces/ICartRepository.js";
import { Cart } from "../domain/entities/Cart.js";
import { ValidationError, NotFoundError } from "../utils/errors.js";

export class CartService implements ICartService {
  constructor(private cartRepository: ICartRepository) {}

  async getCart(userId: string): Promise<any[]> {
    return await this.cartRepository.findPopulated(userId);
  }

  async addToCart(userId: string, itemId: string, restaurantId: string, quantity: number): Promise<Cart> {
    const existingItems = await this.cartRepository.find(userId);
    if (existingItems.length > 0 && existingItems[0]!.restaurantId !== restaurantId) {
      await this.cartRepository.clear(userId);
    }

    const existingItem = await this.cartRepository.findOne(userId, itemId);
    if (existingItem) {
      existingItem.quantity += quantity;
      return await this.cartRepository.update(existingItem);
    }

    const newItem = new Cart("", userId, itemId, restaurantId, quantity);
    return await this.cartRepository.create(newItem);
  }

  async updateQuantity(userId: string, itemId: string, quantity: number): Promise<Cart> {
    const existing = await this.cartRepository.findOne(userId, itemId);
    if (!existing) {
      throw new NotFoundError("Cart item not found");
    }
    existing.quantity = quantity;
    if (existing.quantity <= 0) {
      await this.cartRepository.delete(existing.id);
      return existing;
    }
    return await this.cartRepository.update(existing);
  }

  async deleteCartItem(userId: string, itemId: string): Promise<void> {
    const existing = await this.cartRepository.findOne(userId, itemId);
    if (existing) {
      await this.cartRepository.delete(existing.id);
    }
  }

  async clearCart(userId: string): Promise<void> {
    await this.cartRepository.clear(userId);
  }
}
