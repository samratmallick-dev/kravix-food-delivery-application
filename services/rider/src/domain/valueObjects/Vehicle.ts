import { ValidationError } from "../../utils/errors.js";

export class Vehicle {
  constructor(
    public readonly type: "bike" | "scooter" | "cycle" | "ev",
    public readonly fuelType: "petrol" | "electric" | "none",
    public readonly number: string,
    public readonly manufacturer: string,
    public readonly vehicleModel: string,
    public readonly color: string,
    public readonly ownership: "owned" | "rented" | "leased",
    public readonly insuranceExpiry: Date | null,
    public readonly rcExpiry: Date | null,
    public readonly isVerified: boolean
  ) {
    if (!number || number.trim().length === 0) {
      throw new ValidationError("Vehicle number cannot be empty");
    }
    if (!manufacturer || manufacturer.trim().length === 0) {
      throw new ValidationError("Manufacturer cannot be empty");
    }
    if (!vehicleModel || vehicleModel.trim().length === 0) {
      throw new ValidationError("Vehicle model cannot be empty");
    }
  }

  isEv(): boolean {
    return this.type === "ev" || this.fuelType === "electric";
  }
}
