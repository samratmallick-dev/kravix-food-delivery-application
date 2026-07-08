import { Coupon } from "../domain/entities/Coupon.js";

export interface ICouponRepository {
  findByCode(code: string): Promise<Coupon | null>;
  findActiveByRestaurant(restaurantId: string): Promise<Coupon[]>;
  create(coupon: Coupon): Promise<Coupon>;
  delete(id: string, restaurantId: string): Promise<void>;
  getUsageCount(couponId: string, userId: string): Promise<number>;
  incrementUsage(couponId: string, userId: string): Promise<void>;
  find(filter: Record<string, any>): Promise<Coupon[]>;
  findById(id: string): Promise<Coupon | null>;
  update(coupon: Coupon): Promise<Coupon>;
  getAnalytics(couponId: string): Promise<any>;
}
