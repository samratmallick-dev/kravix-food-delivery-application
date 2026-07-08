import { ValidationError } from "../../utils/errors.js";

export class Coordinates {
  constructor(
    public readonly longitude: number,
    public readonly latitude: number
  ) {
    if (longitude < -180 || longitude > 180) {
      throw new ValidationError("Longitude must be between -180 and 180");
    }
    if (latitude < -90 || latitude > 90) {
      throw new ValidationError("Latitude must be between -90 and 90");
    }
  }

  toArray(): [number, number] {
    return [this.longitude, this.latitude];
  }
}
