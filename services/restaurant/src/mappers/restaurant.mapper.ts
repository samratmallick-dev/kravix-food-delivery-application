import { Restaurant } from "../domain/entities/Restaurant.js";

export class RestaurantMapper {
  static toDomain(raw: any): Restaurant {
    return new Restaurant(
      raw._id.toString(),
      raw.name,
      raw.slug || "",
      raw.description || "",
      raw.image,
      raw.ownerId,
      raw.phone,
      raw.isVerified ?? false,
      {
        coordinates: raw.autoLocation?.coordinates || [0, 0],
        formattedAddress: raw.autoLocation?.formattedAddress || ""
      },
      raw.isOpen ?? false
    );
  }

  static toPersistence(domain: Restaurant): any {
    return {
      name: domain.name,
      slug: domain.slug,
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
      isOpen: domain.isOpen
    };
  }
}
