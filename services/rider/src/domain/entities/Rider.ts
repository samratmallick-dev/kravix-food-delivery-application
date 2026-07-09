import { Coordinates } from "../valueObjects/Coordinates.js";
import { ValidationError } from "../../utils/errors.js";

export class Rider {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly picture: string,
    public readonly phoneNumber: string,
    public readonly aadhaarNumber: string,
    public readonly drivingLicesce: string,
    public isVerified: boolean,
    public location: Coordinates,
    public isAvailable: boolean,
    public lastActiveAt: Date,
    public totalEarnings: number,
    public totalDeliveries: number,
    public rating: number,
    public ratingCount: number,
    public deliveryOtp: string | null,
    public deliveryOtpExpiry: Date | null,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date
  ) {}

  updateProfile(picture?: string, phoneNumber?: string, aadhaarNumber?: string, drivingLicesce?: string): void {
    if (phoneNumber && phoneNumber.trim().length === 0) {
      throw new ValidationError("Phone number cannot be empty");
    }
  }

  toggleAvailability(isAvailable: boolean, location: Coordinates): void {
    if (isAvailable && !this.isVerified) {
      throw new ValidationError("Rider must be verified to go online");
    }
    this.isAvailable = isAvailable;
    this.location = location;
    this.lastActiveAt = new Date();
  }

  generateOtp(otp: string, expiry: Date): void {
    if (!this.isVerified) {
      throw new ValidationError("Unverified rider cannot generate OTP");
    }
    this.deliveryOtp = otp;
    this.deliveryOtpExpiry = expiry;
  }

  completeDelivery(earnings: number): void {
    this.isAvailable = true;
    this.deliveryOtp = null;
    this.deliveryOtpExpiry = null;
    this.totalDeliveries += 1;
    this.totalEarnings += earnings;
  }

  updateRating(newRating: number): void {
    const currentCount = this.ratingCount || 0;
    const currentRatingVal = this.rating || 0;
    const newCount = currentCount + 1;
    const computed = (currentRatingVal * currentCount + newRating) / newCount;
    this.ratingCount = newCount;
    this.rating = Math.round(computed * 100) / 100;
  }
}
