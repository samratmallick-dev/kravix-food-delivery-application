import { Rider } from "../domain/entities/Rider.js";

export class RiderMapper {
  static toDomain(raw: any): Rider {
    return new Rider(
      raw._id.toString(),
      raw.userId,
      raw.picture || "",
      raw.phoneNumber,
      raw.aadhaarNumber,
      raw.drivingLicesce,
      raw.isVerified ?? false,
      {
        coordinates: raw.location?.coordinates || [0, 0]
      },
      raw.isAvailable ?? false
    );
  }

  static toPersistence(domain: Rider): any {
    return {
      userId: domain.userId,
      picture: domain.picture,
      phoneNumber: domain.phoneNumber,
      aadhaarNumber: domain.aadhaarNumber,
      drivingLicesce: domain.drivingLicesce,
      isVerified: domain.isVerified,
      location: {
        type: "Point",
        coordinates: domain.location.coordinates
      },
      isAvailable: domain.isAvailable
    };
  }
}
