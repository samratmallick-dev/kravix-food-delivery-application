import { ShiftAggregate } from "../domain/aggregates/ShiftAggregate.js";

export interface IShiftRepository {
  findActiveByRiderId(riderId: string): Promise<ShiftAggregate | null>;
  findById(id: string): Promise<ShiftAggregate | null>;
  save(shift: ShiftAggregate): Promise<ShiftAggregate>;
  create(shift: ShiftAggregate): Promise<ShiftAggregate>;
  findHistoryByRiderId(riderId: string, limit?: number): Promise<ShiftAggregate[]>;
}
