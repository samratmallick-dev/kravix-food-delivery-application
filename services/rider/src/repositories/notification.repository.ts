import { INotificationRepository } from "../interfaces/INotificationRepository.js";
import { Notification as NotificationModel } from "../model/Notification.js";

export class NotificationRepository implements INotificationRepository {
  async findByRiderId(riderId: string, limit: number = 50): Promise<any[]> {
    return NotificationModel.find({ riderId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  async markAllAsRead(riderId: string): Promise<void> {
    await NotificationModel.updateMany(
      { riderId, readAt: null },
      { readAt: new Date() }
    );
  }

  async create(notificationData: any): Promise<any> {
    return NotificationModel.create(notificationData);
  }

  async markAsRead(notificationId: string, riderId: string): Promise<any> {
    return NotificationModel.findOneAndUpdate(
      { _id: notificationId, riderId },
      { readAt: new Date() },
      { new: true }
    );
  }
}
