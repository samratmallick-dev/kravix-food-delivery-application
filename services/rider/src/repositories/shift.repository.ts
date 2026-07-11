import { IShiftRepository } from "../interfaces/IShiftRepository.js";
import { ShiftAggregate } from "../domain/aggregates/ShiftAggregate.js";
import { ShiftLog as ShiftModel } from "../model/ShiftLog.js";
import { ShiftMapper } from "../mappers/shift.mapper.js";

export class ShiftRepository implements IShiftRepository {
  async findActiveByRiderId(riderId: string): Promise<ShiftAggregate | null> {
    const raw = await ShiftModel.findOne({ riderId, status: "active" });
    if (!raw) return null;
    return ShiftMapper.toDomain(raw);
  }

  async findById(id: string): Promise<ShiftAggregate | null> {
    const raw = await ShiftModel.findById(id);
    if (!raw) return null;
    return ShiftMapper.toDomain(raw);
  }

  async save(shift: ShiftAggregate): Promise<ShiftAggregate> {
    const persistence = ShiftMapper.toPersistence(shift);
    const saved = await ShiftModel.findByIdAndUpdate(
      shift.id,
      persistence,
      { new: true }
    );
    if (!saved) {
      throw new Error(`Shift log not found during save: ${shift.id}`);
    }
    return ShiftMapper.toDomain(saved);
  }

  async create(shift: ShiftAggregate): Promise<ShiftAggregate> {
    const persistence = ShiftMapper.toPersistence(shift);
    const created = await ShiftModel.create(persistence);
    return ShiftMapper.toDomain(created);
  }

  async findHistoryByRiderId(riderId: string, limit: number = 20): Promise<ShiftAggregate[]> {
    const rawList = await ShiftModel.find({ riderId })
      .sort({ startTime: -1 })
      .limit(limit);
    return rawList.map(ShiftMapper.toDomain);
  }
}
