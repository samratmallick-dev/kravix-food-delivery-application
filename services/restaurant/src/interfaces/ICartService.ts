import { Cart } from "../domain/entities/Cart.js";

export interface ICartService {
  getCart(userId: string): Promise<any[]>;
  addToCart(userId: string, itemId: string, restaurantId: string, quantity: number): Promise<Cart>;
  updateQuantity(userId: string, itemId: string, quantity: number): Promise<Cart>;
  deleteCartItem(userId: string, itemId: string): Promise<void>;
  clearCart(userId: string): Promise<void>;
}
