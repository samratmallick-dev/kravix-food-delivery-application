export interface AdminLoginRequestDto {
  email?: string;
  password?: string;
}

export interface VerifyRestaurantRequestDto {
  isVerified?: boolean;
}

export interface VerifyRiderRequestDto {
  isVerified?: boolean;
}

export interface UserResponseDto {
  _id: string;
  name: string;
  email: string;
  image: string;
  role: string | null;
  isBlocked: boolean;
  blockedUntil: string | null;
  createdAt: string;
  riderPicture?: string;
}

export interface RestaurantResponseDto {
  _id: string;
  name: string;
  description: string;
  image: string;
  ownerId: string;
  phone: number;
  isVerified: boolean;
  autoLocation: { coordinates: [number, number]; formattedAddress: string };
  isOpen: boolean;
  createdAt: string;
}

export interface RiderResponseDto {
  _id: string;
  userId: string;
  picture: string;
  phoneNumber: string;
  aadhaarNumber: string;
  drivingLicesce: string;
  isVerified: boolean;
  location: { coordinates: [number, number] };
  isAvailable: boolean;
  lastActiveAt: string;
  createdAt: string;
}

export interface OrderResponseDto {
  _id: string;
  userId: string;
  restaurantId: string;
  restaurantName: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
  deliveryAddress?: {
    formatedAddress: string;
    mobile: number;
    customerName: string;
    latitude: number;
    longitude: number;
  };
  items?: any[];
  subtotal?: number;
  deliveryFee?: number;
  platformFee?: number;
  riderName?: string | null;
}
