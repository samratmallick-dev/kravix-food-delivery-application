import { Rider } from "../domain/entities/Rider.js";
import { Coordinates } from "../domain/valueObjects/Coordinates.js";
import { RiderResponseDto } from "../dto/CreateRiderDto.js";

export class RiderMapper {
  static toDomain(raw: any): Rider {
    const coords = raw.location?.coordinates || [0, 0];
    return new Rider(
      raw._id.toString(),
      raw.userId,
      raw.picture || "",
      raw.phoneNumber,
      raw.aadhaarNumber,
      raw.drivingLicesce,
      raw.isVerified ?? false,
      new Coordinates(coords[0], coords[1]),
      raw.isAvailable ?? false,
      raw.lastActiveAt || new Date(),
      raw.totalEarnings ?? 0,
      raw.totalDeliveries ?? 0,
      raw.rating ?? 0,
      raw.ratingCount ?? 0,
      raw.deliveryOtp || null,
      raw.deliveryOtpExpiry || null,
      raw.createdAt,
      raw.updatedAt
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
        coordinates: domain.location.toArray()
      },
      isAvailable: domain.isAvailable,
      lastActiveAt: domain.lastActiveAt,
      totalEarnings: domain.totalEarnings,
      totalDeliveries: domain.totalDeliveries,
      rating: domain.rating,
      ratingCount: domain.ratingCount,
      deliveryOtp: domain.deliveryOtp,
      deliveryOtpExpiry: domain.deliveryOtpExpiry
    };
  }

  static toDto(domain: Rider): RiderResponseDto {
    const [lng, lat] = domain.location.toArray();
    const dto: RiderResponseDto = {
      id: domain.id,
      userId: domain.userId,
      picture: domain.picture,
      phoneNumber: domain.phoneNumber,
      aadhaarNumber: domain.aadhaarNumber,
      drivingLicesce: domain.drivingLicesce,
      isVerified: domain.isVerified,
      isAvailable: domain.isAvailable,
      location: {
        type: "Point",
        coordinates: [lng, lat],
        longitude: lng,
        latitude: lat
      },
      lastActiveAt: domain.lastActiveAt,
      totalEarnings: domain.totalEarnings,
      totalDeliveries: domain.totalDeliveries,
      rating: domain.ratingCount > 0 ? +(domain.rating / domain.ratingCount).toFixed(1) : 0,
      ratingCount: domain.ratingCount
    };
    if (domain.createdAt) {
      dto.createdAt = domain.createdAt;
    }
    if (domain.updatedAt) {
      dto.updatedAt = domain.updatedAt;
    }
    return dto;
  }
}
