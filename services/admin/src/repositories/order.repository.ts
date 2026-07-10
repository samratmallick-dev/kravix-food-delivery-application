import { IOrderRepository } from "../interfaces/IOrderRepository.js";
import { Order } from "../domain/entities/Order.js";
import { Order as OrderModel } from "../models/Order.js";
import { OrderMapper } from "../mappers/order.mapper.js";

export class OrderRepository implements IOrderRepository {
  async find(filter: Record<string, any>, skip: number, limit: number): Promise<Order[]> {
    const raw = await OrderModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    return raw.map(OrderMapper.toDomain);
  }

  async count(filter: Record<string, any>): Promise<number> {
    return await OrderModel.countDocuments(filter);
  }

  async findById(id: string): Promise<Order | null> {
    const raw = await OrderModel.findById(id).lean();
    if (!raw) return null;
    return OrderMapper.toDomain(raw);
  }

  async update(order: Order): Promise<Order> {
    const persistence = OrderMapper.toPersistence(order);
    const raw = await OrderModel.findByIdAndUpdate(
      order.id,
      { $set: persistence },
      { new: true }
    );
    if (!raw) {
      throw new Error("Order not found");
    }
    return OrderMapper.toDomain(raw);
  }

  async countByStatusPaid(): Promise<any> {
    return await OrderModel.aggregate([
      { $match: { paymentStatus: { $in: ["paid", "cod_paid"] } } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
  }

  async getTotalPaidRevenue(): Promise<number> {
    const res = await OrderModel.aggregate([
      { $match: { paymentStatus: { $in: ["paid", "cod_paid"] } } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
    ]);
    return res[0]?.totalRevenue ?? 0;
  }

  async getTodayStats(todayStart: Date): Promise<any> {
    return await OrderModel.aggregate([
      { $match: { createdAt: { $gte: todayStart } } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$totalAmount", 0]
            }
          }
        }
      }
    ]);
  }
}
