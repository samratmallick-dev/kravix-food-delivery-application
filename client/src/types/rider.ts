export interface IRider {
      _id: string;
      userId: string;
      picture: string;
      phoneNumber: string;
      aadhaarNumber: string;
      drivingLicesce: string;
      panNumber?: string;
      isVerified: boolean;
      isAvailable: boolean;
      totalEarnings: number;
      totalDeliveries: number;
      rating: number | null;
      ratingCount: number;
}

export interface IRiderEarnings {
      totalEarnings: number;
      totalDeliveries: number;
      rating: number | null;
      todayEarnings: number;
      weekEarnings: number;
      weeklyBreakdown: { date: string; amount: number }[];
}
