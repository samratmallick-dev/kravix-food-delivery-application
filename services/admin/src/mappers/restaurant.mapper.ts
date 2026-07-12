import { Restaurant } from "../domain/entities/Restaurant.js";

export class RestaurantMapper {
  static toDomain(raw: any): Restaurant {
    return new Restaurant(
      raw._id.toString(),
      raw.name,
      raw.description || "",
      raw.image,
      raw.ownerId,
      raw.phone,
      raw.isVerified ?? false,
      {
        coordinates: raw.autoLocation?.coordinates || [0, 0],
        formattedAddress: raw.autoLocation?.formattedAddress || ""
      },
      raw.isOpen ?? false,
      raw.createdAt ? new Date(raw.createdAt) : new Date(),
      raw.location,
      raw.pendingLocation,
      raw.locationReviewStatus,
      raw.locationReviewedBy,
      raw.locationReviewedAt,
      raw.locationReviewReason,
      raw.locationRejectionReason,
      raw.locationUpdatedAt,
      raw.locationUpdatedBy,
      raw.locationVersion
    );
  }

  static toPersistence(domain: Restaurant): any {
    return {
      name: domain.name,
      description: domain.description,
      image: domain.image,
      ownerId: domain.ownerId,
      phone: domain.phone,
      isVerified: domain.isVerified,
      autoLocation: {
        type: "Point",
        coordinates: domain.autoLocation.coordinates,
        formattedAddress: domain.autoLocation.formattedAddress
      },
      isOpen: domain.isOpen,
      location: domain.location,
      pendingLocation: domain.pendingLocation,
      locationReviewStatus: domain.locationReviewStatus,
      locationReviewedBy: domain.locationReviewedBy,
      locationReviewedAt: domain.locationReviewedAt,
      locationReviewReason: domain.locationReviewReason,
      locationRejectionReason: domain.locationRejectionReason,
      locationUpdatedAt: domain.locationUpdatedAt,
      locationUpdatedBy: domain.locationUpdatedBy,
      locationVersion: domain.locationVersion
    };
  }
}
