import { ValidationError } from "../../utils/errors.js";

export interface ITimelineLog {
  status: string;
  timestamp: Date;
  description: string;
}

export class OrderAssignmentAggregate {
  constructor(
    public readonly id: string,
    public readonly orderId: string,
    public readonly riderId: string,
    public readonly restaurantId: string,
    public readonly restaurantName: string,
    public restaurantAddress: string | null,
    public customerName: string,
    public customerPhone: string | null,
    public deliveryAddress: string | null,
    public status: "assigned" | "accepted" | "picked_up" | "delivered" | "cancelled" | "rejected",
    public acceptedAt: Date | null,
    public pickedAt: Date | null,
    public deliveredAt: Date | null,
    public cancelledAt: Date | null,
    public distance: number,
    public deliveryFee: number,
    public tip: number,
    public etaMinutes: number,
    public routePolyline: string | null,
    public reassignmentCount: number,
    public timelineEvents: ITimelineLog[],
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date
  ) {}

  addTimelineEvent(status: string, description: string): void {
    this.timelineEvents.push({
      status,
      timestamp: new Date(),
      description
    });
  }

  accept(): void {
    if (this.status !== "assigned") {
      throw new ValidationError(`Cannot accept order in status ${this.status}`);
    }
    this.status = "accepted";
    this.acceptedAt = new Date();
    this.addTimelineEvent("accepted", "Rider accepted the order");
  }

  pickup(): void {
    if (this.status !== "accepted") {
      throw new ValidationError(`Cannot pick up order in status ${this.status}`);
    }
    this.status = "picked_up";
    this.pickedAt = new Date();
    this.addTimelineEvent("picked_up", "Rider picked up the order from restaurant");
  }

  deliver(): void {
    if (this.status !== "picked_up") {
      throw new ValidationError(`Cannot deliver order in status ${this.status}`);
    }
    this.status = "delivered";
    this.deliveredAt = new Date();
    this.addTimelineEvent("delivered", "Rider delivered the order to customer");
  }

  cancel(reason: string): void {
    this.status = "cancelled";
    this.cancelledAt = new Date();
    this.addTimelineEvent("cancelled", `Delivery cancelled: ${reason}`);
  }

  reject(reason: string): void {
    this.status = "rejected";
    this.addTimelineEvent("rejected", `Delivery request rejected: ${reason}`);
    this.reassignmentCount += 1;
  }
}
