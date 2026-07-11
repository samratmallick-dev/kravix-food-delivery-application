import { OrderAssignmentAggregate } from "../domain/aggregates/OrderAssignmentAggregate.js";

export interface IOrderAssignmentRepository {
  findByOrderId(orderId: string): Promise<OrderAssignmentAggregate | null>;
  findActiveByRiderId(riderId: string): Promise<OrderAssignmentAggregate | null>;
  save(assignment: OrderAssignmentAggregate): Promise<OrderAssignmentAggregate>;
  create(assignment: OrderAssignmentAggregate): Promise<OrderAssignmentAggregate>;
  findHistoryByRiderId(riderId: string, limit?: number): Promise<OrderAssignmentAggregate[]>;
}
