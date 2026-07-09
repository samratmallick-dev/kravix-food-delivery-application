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
    public readonly createdAt: Date
  ) {}

  toggleVerify(isVerified?: boolean): void {
    this.isVerified = isVerified !== undefined ? isVerified : !this.isVerified;
  }
}
