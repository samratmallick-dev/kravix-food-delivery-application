import { CreateRiderDto, UpdateRiderLocationDto } from "../dto/CreateRiderDto.js";

export interface IRiderService {
  createProfile(userId: string, dto: CreateRiderDto): Promise<any>;
  updateProfile(userId: string, updates: any): Promise<any>;
  getProfile(userId: string): Promise<any>;
  toggleAvailability(userId: string, isAvailable: boolean, latitude: number, longitude: number): Promise<any>;
  acceptOrder(userId: string, name: string, orderId: string): Promise<any>;
  getCurrentOrder(userId: string): Promise<any>;
  updateOrderStatus(userId: string, body: any): Promise<any>;
  generateDeliveryOtp(userId: string, orderId: string): Promise<any>;
  updateLiveLocation(userId: string, dto: UpdateRiderLocationDto): Promise<void>;
  getEarnings(userId: string): Promise<any>;
  getDeliveryHistory(userId: string): Promise<any>;
  handleRiderRated(riderId: string, rating: number): Promise<void>;

  startShift(userId: string): Promise<any>;
  endShift(userId: string): Promise<any>;
  pauseShift(userId: string): Promise<any>;
  resumeShift(userId: string): Promise<any>;
  getShiftHistory(userId: string): Promise<any[]>;

  getVehicle(userId: string): Promise<any>;
  updateVehicle(userId: string, dto: any): Promise<any>;

  getWalletSummary(userId: string): Promise<any>;
  getWalletTransactions(userId: string): Promise<any[]>;
  getWalletSettlements(userId: string): Promise<any[]>;
  withdrawFunds(userId: string, amount: number): Promise<any>;
  configureBankDetails(userId: string, dto: any): Promise<any>;

  getDocuments(userId: string): Promise<any>;
  uploadDocument(userId: string, dto: any): Promise<any>;

  getNotifications(userId: string): Promise<any[]>;
  markNotificationRead(userId: string, notificationId: string): Promise<any>;
  markAllNotificationsRead(userId: string): Promise<void>;

  getPerformanceStatistics(userId: string): Promise<any>;
  getPerformanceDashboard(userId: string): Promise<any>;
  getLeaderboard(): Promise<any[]>;

  getAnalytics(userId: string): Promise<any>;
}
