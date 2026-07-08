import { Rider } from "../domain/entities/Rider.js";

export interface IRiderModerationService {
  getAllRiders(page: number, limit: number, isVerified?: string, isAvailable?: string): Promise<{ riders: Rider[]; total: number }>;
  getRiderById(id: string): Promise<Rider>;
  verifyRider(id: string, isVerifiedInput?: boolean): Promise<Rider>;
  deleteRider(id: string): Promise<void>;
}
