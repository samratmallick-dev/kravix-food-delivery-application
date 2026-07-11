import { ILeaderboardRepository, ILeaderboardEntry } from "../interfaces/ILeaderboardRepository.js";
import { Rider as RiderModel } from "../model/Rider.js";

export class LeaderboardRepository implements ILeaderboardRepository {
  async getWeeklyTopRiders(limit: number = 10): Promise<ILeaderboardEntry[]> {
    const rawRiders = await RiderModel.find({ isVerified: true })
      .sort({ totalDeliveries: -1 })
      .limit(limit)
      .lean();

    return rawRiders.map((raw, idx) => ({
      riderId: raw._id.toString(),
      name: raw.phoneNumber ? `Partner ${raw.phoneNumber.slice(-4)}` : `Partner #${idx + 1}`,
      picture: raw.picture || "",
      totalDeliveries: raw.totalDeliveries ?? 0,
      totalEarnings: raw.totalEarnings ?? 0,
      rating: raw.ratingCount > 0 ? +(raw.rating / raw.ratingCount).toFixed(1) : 5.0,
      rank: idx + 1
    }));
  }
}
