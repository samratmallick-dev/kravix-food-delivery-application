import { Cart } from "../domain/entities/Cart.js";

export interface ICartRepository {
  find(userId: string): Promise<Cart[]>;
  findPopulated(userId: string): Promise<any[]>;
  findOne(userId: string, itemId: string): Promise<Cart | null>;
  create(cart: Cart): Promise<Cart>;
  update(cart: Cart): Promise<Cart>;
  delete(id: string): Promise<void>;
  clear(userId: string): Promise<void>;
}
