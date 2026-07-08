import { IRiderModerationService } from "../interfaces/IRiderModerationService.js";
import { IRiderRepository } from "../interfaces/IRiderRepository.js";
import { IAdminEventPublisher } from "../interfaces/IAdminEventPublisher.js";
import { Rider } from "../domain/entities/Rider.js";
import { NotFoundError } from "../utils/errors.js";

export class RiderModerationService implements IRiderModerationService {
  constructor(
    private riderRepository: IRiderRepository,
    private eventPublisher: IAdminEventPublisher
  ) {}

  async getAllRiders(page: number, limit: number, isVerified?: string, isAvailable?: string): Promise<{ riders: Rider[]; total: number }> {
    const filter: Record<string, any> = {};
    if (isVerified === "true") {
      filter["isVerified"] = true;
    } else if (isVerified === "false") {
      filter["isVerified"] = false;
    }
    if (isAvailable === "true") {
      filter["isAvailable"] = true;
    } else if (isAvailable === "false") {
      filter["isAvailable"] = false;
    }

    const skip = (page - 1) * limit;
    const [riders, total] = await Promise.all([
      this.riderRepository.find(filter, skip, limit),
      this.riderRepository.count(filter)
    ]);

    return { riders, total };
  }

  async getRiderById(id: string): Promise<Rider> {
    const rider = await this.riderRepository.findById(id);
    if (!rider) {
      throw new NotFoundError("Rider not found");
    }
    return rider;
  }

  async verifyRider(id: string, isVerifiedInput?: boolean): Promise<Rider> {
    const rider = await this.riderRepository.findById(id);
    if (!rider) {
      throw new NotFoundError("Rider not found");
    }

    const targetVerified = isVerifiedInput !== undefined ? isVerifiedInput : !rider.isVerified;
    rider.toggleVerify(targetVerified);

    const updated = await this.riderRepository.update(rider);

    await this.eventPublisher.publishRiderVerified(updated.id, updated.userId, updated.isVerified);

    return updated;
  }

  async deleteRider(id: string): Promise<void> {
    const rider = await this.riderRepository.findById(id);
    if (!rider) {
      throw new NotFoundError("Rider not found");
    }

    await this.riderRepository.delete(id);

    await this.eventPublisher.publishRiderDeleted(id, rider.userId);
  }
}
