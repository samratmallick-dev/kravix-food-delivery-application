import { Notification } from "../model/Notification.js";

export interface INotificationRepository {
  findByRiderId(riderId: string, limit?: number): Promise<any[]>;
  markAllAsRead(riderId: string): Promise<void>;
  create(notificationData: any): Promise<any>;
  markAsRead(notificationId: string, riderId: string): Promise<any>;
}
