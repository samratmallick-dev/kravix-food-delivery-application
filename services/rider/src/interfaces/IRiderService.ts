import { Rider } from "../domain/entities/Rider.js";
import { CreateRiderDto, UpdateRiderLocationDto, RiderResponseDto } from "../dto/CreateRiderDto.js";

export interface IRiderService {
  createProfile(userId: string, dto: CreateRiderDto): Promise<RiderResponseDto>;
  updateProfile(userId: string, updates: Partial<CreateRiderDto> & { picture?: string }): Promise<RiderResponseDto>;
  getProfile(userId: string): Promise<RiderResponseDto>;
  toggleAvailability(userId: string, isAvailable: boolean, latitude: number, longitude: number): Promise<RiderResponseDto>;
  acceptOrder(userId: string, name: string, orderId: string): Promise<RiderResponseDto>;
  getCurrentOrder(userId: string): Promise<any>;
  updateOrderStatus(userId: string, body: any): Promise<any>;
  generateDeliveryOtp(userId: string, orderId: string): Promise<any>;
  updateLiveLocation(userId: string, dto: UpdateRiderLocationDto): Promise<void>;
  getEarnings(userId: string): Promise<any>;
  getDeliveryHistory(userId: string): Promise<any>;
  handleRiderRated(riderId: string, rating: number): Promise<void>;
  getRiderLocation(riderId: string): Promise<{ latitude: number; longitude: number }>;
}
