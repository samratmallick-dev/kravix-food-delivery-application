import axios from "axios";
import { ILocationValidationService } from "../interfaces/ILocationValidationService.js";

export class LocationValidationService implements ILocationValidationService {
  async validateCoordinates(
    latitude: number,
    longitude: number
  ): Promise<{ isValid: boolean; errorReason?: string; resolvedAddress?: string }> {
    if (latitude < -90 || latitude > 90) {
      return { isValid: false, errorReason: "Latitude must be between -90 and 90" };
    }
    if (longitude < -180 || longitude > 180) {
      return { isValid: false, errorReason: "Longitude must be between -180 and 180" };
    }

    if (Math.abs(latitude) < 0.001 && Math.abs(longitude) < 0.001) {
      return { isValid: false, errorReason: "Coordinates are invalid or locate to the ocean/null island" };
    }

    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
        {
          headers: { "User-Agent": "Kravix/1.0" },
          timeout: 5000
        }
      );

      if (response.status === 429) {
        console.warn("Location validation rate-limited by Nominatim. Defaulting to valid.");
        return { isValid: true };
      }

      const data = response.data;
      if (!data || !data.address) {
        return { isValid: false, errorReason: "Coordinates do not resolve to a valid address" };
      }

      const isOcean = data.error === "Unable to geocode" || data.address.water || data.address.ocean;
      if (isOcean) {
        return { isValid: false, errorReason: "Coordinates locate to an unserviceable water body or ocean" };
      }

      return {
        isValid: true,
        resolvedAddress: data.display_name
      };
    } catch (error: any) {
      console.warn("Geocoding validation request failed:", error.message);
      return { isValid: true };
    }
  }
}
