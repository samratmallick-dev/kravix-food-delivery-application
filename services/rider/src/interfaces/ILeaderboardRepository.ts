export interface ILeaderboardEntry {
  riderId: string;
  name: string;
  picture: string;
  totalDeliveries: number;
  totalEarnings: number;
  rating: number;
  rank?: number;
}

export interface ILeaderboardRepository {
  getWeeklyTopRiders(limit?: number): Promise<ILeaderboardEntry[]>;
}
