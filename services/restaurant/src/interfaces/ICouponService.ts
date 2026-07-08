import { Coupon } from "../domain/entities/Coupon.js";
import { CouponRequestDto } from "../dto/restaurant.dto.js";

export interface ICouponService {
  createCoupon(restaurantId: string | null, dto: CouponRequestDto, couponType: string): Promise<Coupon>;
  getCoupons(userRole: string, restaurantId?: string | null, queryRestaurantId?: string | null): Promise<Coupon[]>;
  updateCoupon(couponId: string, restaurantId: string | null, userRole: string, updateData: any): Promise<Coupon>;
  deleteCoupon(couponId: string, restaurantId: string | null, userRole: string): Promise<void>;
  validateCouponCode(code: string, userId: string, subtotal: number): Promise<Coupon>;
  getCouponAnalytics(couponId: string, restaurantId: string | null, userRole: string): Promise<any>;
}
