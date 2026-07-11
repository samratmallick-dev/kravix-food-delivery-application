import { IOrderAssignmentRepository } from "../interfaces/IOrderAssignmentRepository.js";
import { OrderAssignmentAggregate } from "../domain/aggregates/OrderAssignmentAggregate.js";
import { OrderAssignment as OrderAssignmentModel } from "../model/OrderAssignment.js";
import { OrderAssignmentMapper } from "../mappers/orderAssignment.mapper.js";

export class OrderAssignmentRepository implements IOrderAssignmentRepository {
  async findByOrderId(orderId: string): Promise<OrderAssignmentAggregate | null> {
    const raw = await OrderAssignmentModel.findOne({ orderId });
    if (!raw) return null;
    return OrderAssignmentMapper.toDomain(raw);
  }

  async findActiveByRiderId(riderId: string): Promise<OrderAssignmentAggregate | null> {
    const raw = await OrderAssignmentModel.findOne({
      riderId,
      status: { $in: ["assigned", "accepted", "picked_up"] }
    });
    if (!raw) return null;
    return OrderAssignmentMapper.toDomain(raw);
  }

  async save(assignment: OrderAssignmentAggregate): Promise<OrderAssignmentAggregate> {
    const persistence = OrderAssignmentMapper.toPersistence(assignment);
    const saved = await OrderAssignmentModel.findOneAndUpdate(
      { orderId: assignment.orderId },
      persistence,
      { new: true, upsert: true }
    );
    return OrderAssignmentMapper.toDomain(saved);
  }

  async create(assignment: OrderAssignmentAggregate): Promise<OrderAssignmentAggregate> {
    const persistence = OrderAssignmentMapper.toPersistence(assignment);
    const created = await OrderAssignmentModel.create(persistence);
    return OrderAssignmentMapper.toDomain(created);
  }

  async findHistoryByRiderId(riderId: string, limit: number = 20): Promise<OrderAssignmentAggregate[]> {
    const rawList = await OrderAssignmentModel.find({ riderId, status: "delivered" })
      .sort({ updatedAt: -1 })
      .limit(limit);
    return rawList.map(OrderAssignmentMapper.toDomain);
  }
}
