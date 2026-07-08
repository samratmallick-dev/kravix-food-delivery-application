export interface CreateRiderDto {
  phoneNumber: string;
  aadhaarNumber: string;
  drivingLicesce: string;
  latitude: number;
  longitude: number;
  pictureUrl?: string;
}

export interface UpdateRiderLocationDto {
  latitude: number;
  longitude: number;
  orderId: string;
  customerUserId: string;
}

export interface RiderResponseDto {
  id: string;
  userId: string;
  picture: string;
  phoneNumber: string;
  aadhaarNumber: string;
  drivingLicesce: string;
  isVerified: boolean;
  isAvailable: boolean;
  location: {
    type: "Point";
    coordinates: [number, number];
    longitude?: number;
    latitude?: number;
  };
  lastActiveAt: Date;
  totalEarnings: number;
  totalDeliveries: number;
  rating: number;
  ratingCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}
