import { ValidationError } from "../../utils/errors.js";

export interface IShiftBreak {
  start: Date;
  end?: Date;
  durationSeconds?: number;
}

export class ShiftAggregate {
  constructor(
    public readonly id: string,
    public readonly riderId: string,
    public startTime: Date,
    public endTime: Date | null,
    public breaks: IShiftBreak[],
    public status: "active" | "completed",
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date
  ) {}

  startBreak(): void {
    if (this.status !== "active") throw new ValidationError("Shift is not active");
    const activeBreak = this.breaks.find((b) => !b.end);
    if (activeBreak) throw new ValidationError("Rider is already on a break");
    this.breaks.push({ start: new Date() });
  }

  endBreak(): void {
    if (this.status !== "active") throw new ValidationError("Shift is not active");
    const activeBreak = this.breaks.find((b) => !b.end);
    if (!activeBreak) throw new ValidationError("Rider is not on a break");
    
    activeBreak.end = new Date();
    activeBreak.durationSeconds = Math.round((activeBreak.end.getTime() - activeBreak.start.getTime()) / 1000);
  }

  endShift(): void {
    if (this.status !== "active") throw new ValidationError("Shift is already ended");
    const activeBreak = this.breaks.find((b) => !b.end);
    if (activeBreak) {
      this.endBreak();
    }
    this.endTime = new Date();
    this.status = "completed";
  }

  calculateWorkingMinutes(): number {
    const end = this.endTime || new Date();
    let totalMs = end.getTime() - this.startTime.getTime();

    let breakMs = 0;
    this.breaks.forEach((b) => {
      const bEnd = b.end || new Date();
      breakMs += bEnd.getTime() - b.start.getTime();
    });

    const netMs = Math.max(0, totalMs - breakMs);
    return Math.round(netMs / (1000 * 60));
  }
}
