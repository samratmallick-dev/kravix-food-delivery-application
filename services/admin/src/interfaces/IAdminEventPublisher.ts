export interface IAdminEventPublisher {
  publishRestaurantVerified(restaurantId: string, ownerId: string, isVerified: boolean): Promise<void>;
  publishRestaurantDeleted(restaurantId: string, ownerId: string): Promise<void>;
  publishRiderVerified(riderId: string, userId: string, isVerified: boolean): Promise<void>;
  publishRiderDeleted(riderId: string, userId: string): Promise<void>;
  publishUserBlockStatusChanged(
    userId: string,
    role: string | null,
    isBlocked: boolean,
    blockedUntil: Date | null,
    restaurantId: string | null
  ): Promise<void>;
  publishOrderCancelled(orderId: string, userId: string, restaurantId: string, riderId?: string | null): Promise<void>;
}
