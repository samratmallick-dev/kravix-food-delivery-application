import { ShiftAggregate } from "../domain/aggregates/ShiftAggregate.js";

export class ShiftMapper {
  static toDomain(raw: any): ShiftAggregate {
    return new ShiftAggregate(
      raw._id.toString(),
      raw.riderId,
      raw.startTime,
      raw.endTime || null,
      raw.breaks || [],
      raw.status || "active",
      raw.createdAt,
      raw.updatedAt
    );
  }

  static toPersistence(domain: ShiftAggregate): any {
    return {
      riderId: domain.riderId,
      startTime: domain.startTime,
      endTime: domain.endTime,
      breaks: domain.breaks,
      durationMinutes: domain.calculateWorkingMinutes(),
      status: domain.status
    };
  }

  static toDto(domain: ShiftAggregate): any {
    return {
      id: domain.id,
      riderId: domain.riderId,
      startTime: domain.startTime,
      endTime: domain.endTime,
      status: domain.status,
      workingMinutes: domain.calculateWorkingMinutes(),
      breaksCount: domain.breaks.length,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt
    };
  }
}
