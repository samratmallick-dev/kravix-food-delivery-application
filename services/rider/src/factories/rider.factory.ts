import { Rider } from "../domain/entities/Rider.js";
import { Coordinates } from "../domain/valueObjects/Coordinates.js";
import { CreateRiderDto } from "../dto/CreateRiderDto.js";

export class RiderFactory {
  static create(userId: string, dto: CreateRiderDto): Rider {
    return new Rider(
      "",
      userId,
      dto.pictureUrl || "",
      dto.phoneNumber,
      dto.aadhaarNumber,
      dto.drivingLicesce,
      dto.panNumber || null,
      false,
      new Coordinates(dto.longitude, dto.latitude),
      false,
      new Date(),
      0,
      0,
      0,
      0,
      null,
      null
    );
  }
}
