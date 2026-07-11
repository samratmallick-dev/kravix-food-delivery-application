import { IOrderRepository } from "../interfaces/IOrderRepository.js";
import { Order } from "../domain/entities/Order.js";
import { Order as OrderModel } from "../model/Order.js";
import { OrderMapper } from "../mappers/order.mapper.js";

export class OrderRepository implements IOrderRepository {
  async findById(id: string): Promise<Order | null> {
    const raw = await OrderModel.findById(id).lean();
    if (!raw) return null;
    return OrderMapper.toDomain(raw);
  }

  async findByUser(userId: string): Promise<Order[]> {
    const raw = await OrderModel.find({ userId }).sort({ createdAt: -1 }).lean();
    return raw.map(OrderMapper.toDomain);
  }

  async findByRestaurant(restaurantId: string): Promise<Order[]> {
    const raw = await OrderModel.find({ restaurantId }).sort({ createdAt: -1 }).lean();
    return raw.map(OrderMapper.toDomain);
  }

  async create(order: Order, session?: any): Promise<Order> {
    const persistence = OrderMapper.toPersistence(order);
    const options = session ? { session } : {};
    const [raw] = await OrderModel.create([persistence], options);
    return OrderMapper.toDomain(raw);
  }

  async update(order: Order, session?: any): Promise<Order> {
    const persistence = OrderMapper.toPersistence(order);
    const options = session ? { session, new: true } : { new: true };
    const raw = await OrderModel.findByIdAndUpdate(
      order.id,
      { $set: persistence },
      options
    );
    if (!raw) {
      throw new Error("Order not found");
    }
    return OrderMapper.toDomain(raw);
  }

  async findActiveOrderForRestaurant(restaurantId: string): Promise<Order | null> {
    const raw = await OrderModel.findOne({
      restaurantId,
      status: { $nin: ["delivered", "cancelled"] }
    }).lean();
    if (!raw) return null;
    return OrderMapper.toDomain(raw);
  }

  async findActiveOrderForRider(riderId: string): Promise<Order | null> {
    const raw = await OrderModel.findOne({
      riderId,
      status: { $in: ["rider_assigned", "picked_up", "out_for_delivery", "reached_delivery_location"] }
    }).lean();
    if (!raw) return null;
    return OrderMapper.toDomain(raw);
  }

  async findDeliveredByRider(riderId: string): Promise<Order[]> {
    const raw = await OrderModel.find({ riderId, status: "delivered" }).sort({ createdAt: -1 }).lean();
    return raw.map(OrderMapper.toDomain);
  }
}
