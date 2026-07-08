import { Address } from "../domain/entities/Address.js";

export class AddressMapper {
  static toDomain(raw: any): Address {
    return new Address(
      raw._id.toString(),
      raw.userId,
      raw.formatedAddress,
      raw.mobile,
      raw.customerName,
      raw.location?.coordinates || [0, 0]
    );
  }

  static toPersistence(domain: Address): any {
    return {
      userId: domain.userId,
      formatedAddress: domain.formatedAddress,
      mobile: domain.mobile,
      customerName: domain.customerName,
      location: {
        type: "Point",
        coordinates: domain.coordinates
      }
    };
  }
}
