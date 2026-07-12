export class Restaurant {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly image: string,
    public readonly ownerId: string,
    public readonly phone: number,
    public isVerified: boolean,
    public readonly autoLocation: { coordinates: [number, number]; formattedAddress: string },
    public readonly isOpen: boolean,
    public readonly createdAt: Date,
    public readonly location?: {
      address: string;
      city: string;
      state: string;
      country: string;
      pincode: string;
      landmark?: string;
      latitude: number;
      longitude: number;
      placeId?: string;
      deliveryRadius: number;
      createdAt?: Date;
      updatedAt?: Date;
    },
    public readonly pendingLocation?: {
      address: string;
      city: string;
      state: string;
      country: string;
      pincode: string;
      landmark?: string;
      latitude: number;
      longitude: number;
      placeId?: string;
      deliveryRadius: number;
      createdAt?: Date;
      updatedAt?: Date;
    },
    public readonly locationReviewStatus?: "PENDING" | "APPROVED" | "REJECTED" | null,
    public readonly locationReviewedBy?: string,
    public readonly locationReviewedAt?: Date,
    public readonly locationReviewReason?: string,
    public readonly locationRejectionReason?: string,
    public readonly locationUpdatedAt?: Date,
    public readonly locationUpdatedBy?: string,
    public readonly locationVersion?: number
  ) {}

  toggleVerify(isVerified?: boolean): void {
    this.isVerified = isVerified !== undefined ? isVerified : !this.isVerified;
  }
}
