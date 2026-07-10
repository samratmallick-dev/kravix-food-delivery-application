import { ValidationError } from "../../utils/errors.js";

export class Restaurant {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly description: string,
    public readonly image: string,
    public readonly ownerId: string,
    public readonly phone: number,
    public readonly isVerified: boolean,
    public readonly autoLocation: { coordinates: [number, number]; formattedAddress: string },
    public readonly isOpen: boolean,
    public distanceKm?: number
  ) {}

  checkAvailableForOrdering(): void {
    if (!this.isVerified) {
      throw new ValidationError("Restaurant is not verified by admin.");
    }
    if (!this.isOpen) {
      throw new ValidationError("Restaurant is closed");
    }
  }
}
