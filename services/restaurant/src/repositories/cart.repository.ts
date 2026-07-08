import { ICartRepository } from "../interfaces/ICartRepository.js";
import { Cart } from "../domain/entities/Cart.js";
import { Cart as CartModel } from "../model/Cart.js";
import { CartMapper } from "../mappers/cart.mapper.js";

export class CartRepository implements ICartRepository {
  async find(userId: string): Promise<Cart[]> {
    const raw = await CartModel.find({ userId }).lean();
    return raw.map(CartMapper.toDomain);
  }

  async findPopulated(userId: string): Promise<any[]> {
    return await CartModel.find({ userId })
      .populate("itemId")
      .populate("restaurantId")
      .lean();
  }

  async findOne(userId: string, itemId: string): Promise<Cart | null> {
    const raw = await CartModel.findOne({ userId, itemId }).lean();
    if (!raw) return null;
    return CartMapper.toDomain(raw);
  }

  async create(cart: Cart): Promise<Cart> {
    const persistence = CartMapper.toPersistence(cart);
    const raw = await CartModel.create(persistence);
    return CartMapper.toDomain(raw);
  }

  async update(cart: Cart): Promise<Cart> {
    const persistence = CartMapper.toPersistence(cart);
    const raw = await CartModel.findByIdAndUpdate(
      cart.id,
      { $set: persistence },
      { new: true }
    );
    if (!raw) {
      throw new Error("Cart item not found");
    }
    return CartMapper.toDomain(raw);
  }

  async delete(id: string): Promise<void> {
    await CartModel.findByIdAndDelete(id);
  }

  async clear(userId: string): Promise<void> {
    await CartModel.deleteMany({ userId });
  }
}
