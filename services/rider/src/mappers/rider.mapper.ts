import { RiderAggregate } from "../domain/aggregates/RiderAggregate.js";
import { Coordinates } from "../domain/valueObjects/Coordinates.js";
import { Vehicle } from "../domain/valueObjects/Vehicle.js";
import { RiderResponseDto } from "../dto/CreateRiderDto.js";

export class RiderMapper {
  static toDomain(raw: any, rawVehicle?: any): RiderAggregate {
    const coords = raw.location?.coordinates || [0, 0];
    
    let domainVehicle: Vehicle | null = null;
    if (rawVehicle) {
      domainVehicle = new Vehicle(
        rawVehicle.type,
        rawVehicle.fuelType,
        rawVehicle.number,
        rawVehicle.manufacturer,
        rawVehicle.vehicleModel || rawVehicle.model || "",
        rawVehicle.color,
        rawVehicle.ownership,
        rawVehicle.insuranceExpiry,
        rawVehicle.rcExpiry,
        rawVehicle.isVerified ?? false
      );
    }

    return new RiderAggregate(
      raw._id.toString(),
      raw.userId,
      raw.picture || "",
      raw.phoneNumber,
      raw.aadhaarNumber,
      raw.drivingLicesce,
      raw.isVerified ?? false,
      new Coordinates(coords[0], coords[1]),
      raw.availabilityStatus || (raw.isAvailable ? "ONLINE" : "OFFLINE"),
      raw.lastActiveAt || new Date(),
      raw.totalEarnings ?? 0,
      raw.totalDeliveries ?? 0,
      raw.rating ?? 0,
      raw.ratingCount ?? 0,
      raw.deliveryOtp || null,
      raw.deliveryOtpExpiry || null,
      raw.emergencyContact || null,
      raw.address || null,
      domainVehicle,
      raw.createdAt,
      raw.updatedAt
    );
  }

  static toPersistence(domain: RiderAggregate): any {
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
      isAvailable: domain.availabilityStatus === "ONLINE" || domain.availabilityStatus === "DELIVERING",
      availabilityStatus: domain.availabilityStatus,
      lastActiveAt: domain.lastActiveAt,
      totalEarnings: domain.totalEarnings,
      totalDeliveries: domain.totalDeliveries,
      rating: domain.rating,
      ratingCount: domain.ratingCount,
      deliveryOtp: domain.deliveryOtp,
      deliveryOtpExpiry: domain.deliveryOtpExpiry,
      emergencyContact: domain.emergencyContact,
      address: domain.address
    };
  }

  static toDto(domain: RiderAggregate): any {
    const [lng, lat] = domain.location.toArray();
    return {
      id: domain.id,
      userId: domain.userId,
      picture: domain.picture,
      phoneNumber: domain.phoneNumber,
      aadhaarNumber: domain.aadhaarNumber,
      drivingLicesce: domain.drivingLicesce,
      isVerified: domain.isVerified,
      isAvailable: domain.availabilityStatus === "ONLINE" || domain.availabilityStatus === "DELIVERING",
      availabilityStatus: domain.availabilityStatus,
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
      ratingCount: domain.ratingCount,
      emergencyContact: domain.emergencyContact,
      address: domain.address,
      vehicle: domain.vehicle ? {
        type: domain.vehicle.type,
        fuelType: domain.vehicle.fuelType,
        number: domain.vehicle.number,
        manufacturer: domain.vehicle.manufacturer,
        model: domain.vehicle.vehicleModel,
        color: domain.vehicle.color,
        ownership: domain.vehicle.ownership,
        insuranceExpiry: domain.vehicle.insuranceExpiry,
        rcExpiry: domain.vehicle.rcExpiry,
        isVerified: domain.vehicle.isVerified
      } : null,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt
    };
  }
}
