import { Coordinates } from "../valueObjects/Coordinates.js";
import { Vehicle } from "../valueObjects/Vehicle.js";
import { ValidationError } from "../../utils/errors.js";

export class RiderAggregate {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public picture: string,
    public phoneNumber: string,
    public aadhaarNumber: string,
    public drivingLicesce: string,
    public isVerified: boolean,
    public location: Coordinates,
    public availabilityStatus: "ONLINE" | "OFFLINE" | "BUSY" | "BREAK" | "DELIVERING" | "RETURNING" | "UNAVAILABLE" | "SUSPENDED",
    public lastActiveAt: Date,
    public totalEarnings: number,
    public totalDeliveries: number,
    public rating: number,
    public ratingCount: number,
    public deliveryOtp: string | null,
    public deliveryOtpExpiry: Date | null,
    public emergencyContact: { name: string; phone: string; relation: string } | null,
    public address: string | null,
    public vehicle: Vehicle | null,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date
  ) {}

  updateProfile(picture?: string, phoneNumber?: string, aadhaarNumber?: string, drivingLicesce?: string, address?: string, emergencyContact?: { name: string; phone: string; relation: string }): void {
    if (phoneNumber && phoneNumber.trim().length === 0) {
      throw new ValidationError("Phone number cannot be empty");
    }
    if (picture) this.picture = picture;
    if (phoneNumber) this.phoneNumber = phoneNumber;
    if (aadhaarNumber) this.aadhaarNumber = aadhaarNumber;
    if (drivingLicesce) this.drivingLicesce = drivingLicesce;
    if (address !== undefined) this.address = address;
    if (emergencyContact !== undefined) this.emergencyContact = emergencyContact;
  }

  setVehicle(vehicle: Vehicle): void {
    this.vehicle = vehicle;
  }

  updateStatus(status: typeof this.availabilityStatus): void {
    if (status !== "OFFLINE" && !this.isVerified) {
      throw new ValidationError("Rider must be verified to change availability status");
    }
    this.availabilityStatus = status;
    this.lastActiveAt = new Date();
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
