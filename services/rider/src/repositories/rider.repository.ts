import { IRiderRepository } from "../interfaces/IRiderRepository.js";
import { RiderAggregate } from "../domain/aggregates/RiderAggregate.js";
import { Rider as RiderModel } from "../model/Rider.js";
import { Vehicle as VehicleModel } from "../model/Vehicle.js";
import { RiderMapper } from "../mappers/rider.mapper.js";

export class RiderRepository implements IRiderRepository {
  async findById(id: string): Promise<RiderAggregate | null> {
    const raw = await RiderModel.findById(id);
    if (!raw) return null;
    const rawVehicle = await VehicleModel.findOne({ riderId: id });
    return RiderMapper.toDomain(raw, rawVehicle);
  }

  async findByUserId(userId: string): Promise<RiderAggregate | null> {
    const raw = await RiderModel.findOne({ userId });
    if (!raw) return null;
    const rawVehicle = await VehicleModel.findOne({ riderId: (raw as any)._id.toString() });
    return RiderMapper.toDomain(raw, rawVehicle);
  }

  async findOneAndUpdate(query: any, update: any, options?: any): Promise<RiderAggregate | null> {
    const updated = await RiderModel.findOneAndUpdate(query, update, { new: true, ...options });
    if (!updated) return null;
    const rawVehicle = await VehicleModel.findOne({ riderId: (updated as any)._id.toString() });
    return RiderMapper.toDomain(updated, rawVehicle);
  }

  async create(rider: RiderAggregate): Promise<RiderAggregate> {
    const persistence = RiderMapper.toPersistence(rider);
    const created = await RiderModel.create(persistence);
    
    let rawVehicle: any = null;
    if (rider.vehicle) {
      rawVehicle = await VehicleModel.findOneAndUpdate(
        { riderId: (created as any)._id.toString() },
        {
          type: rider.vehicle.type,
          fuelType: rider.vehicle.fuelType,
          number: rider.vehicle.number,
          manufacturer: rider.vehicle.manufacturer,
          vehicleModel: rider.vehicle.vehicleModel,
          color: rider.vehicle.color,
          ownership: rider.vehicle.ownership,
          insuranceExpiry: rider.vehicle.insuranceExpiry,
          rcExpiry: rider.vehicle.rcExpiry,
          isVerified: rider.vehicle.isVerified
        },
        { new: true, upsert: true }
      );
    }
    return RiderMapper.toDomain(created, rawVehicle);
  }

  async save(rider: RiderAggregate): Promise<RiderAggregate> {
    const persistence = RiderMapper.toPersistence(rider);
    const saved = await RiderModel.findOneAndUpdate(
      { userId: rider.userId },
      persistence,
      { new: true, upsert: true }
    );
    
    let rawVehicle: any = null;
    if (rider.vehicle) {
      rawVehicle = await VehicleModel.findOneAndUpdate(
        { riderId: (saved as any)._id.toString() },
        {
          type: rider.vehicle.type,
          fuelType: rider.vehicle.fuelType,
          number: rider.vehicle.number,
          manufacturer: rider.vehicle.manufacturer,
          vehicleModel: rider.vehicle.vehicleModel,
          color: rider.vehicle.color,
          ownership: rider.vehicle.ownership,
          insuranceExpiry: rider.vehicle.insuranceExpiry,
          rcExpiry: rider.vehicle.rcExpiry,
          isVerified: rider.vehicle.isVerified
        },
        { new: true, upsert: true }
      );
    }
    return RiderMapper.toDomain(saved, rawVehicle);
  }

  async findNearbyAvailable(coordinates: [number, number], maxDistanceMeters: number): Promise<RiderAggregate[]> {
    const rawList = await RiderModel.find({
      availabilityStatus: "ONLINE",
      isVerified: true,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates
          },
          $maxDistance: maxDistanceMeters
        }
      }
    });
    
    const results: RiderAggregate[] = [];
    for (const raw of rawList) {
      const rawVehicle = await VehicleModel.findOne({ riderId: (raw as any)._id.toString() });
      results.push(RiderMapper.toDomain(raw, rawVehicle));
    }
    return results;
  }
}
