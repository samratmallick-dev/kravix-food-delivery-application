export class Rider {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly picture: string,
    public readonly phoneNumber: string,
    public readonly aadhaarNumber: string,
    public readonly drivingLicesce: string,
    public readonly panNumber: string | null,
    public isVerified: boolean,
    public readonly location: { coordinates: [number, number] },
    public readonly isAvailable: boolean,
    public readonly lastActiveAt: Date,
    public readonly createdAt: Date
  ) {}

  toggleVerify(isVerified?: boolean): void {
    this.isVerified = isVerified !== undefined ? isVerified : !this.isVerified;
  }
}
