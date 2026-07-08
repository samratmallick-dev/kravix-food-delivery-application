import { ICouponService } from "../interfaces/ICouponService.js";
import { ICouponRepository } from "../interfaces/ICouponRepository.js";
import { Coupon } from "../domain/entities/Coupon.js";
import { CouponRequestDto } from "../dto/restaurant.dto.js";
import { NotFoundError, ValidationError, AuthorizationError } from "../utils/errors.js";

export class CouponService implements ICouponService {
  constructor(private couponRepository: ICouponRepository) {}

  async createCoupon(restaurantId: string | null, dto: CouponRequestDto, couponType: string): Promise<Coupon> {
    const normalizedCode = dto.code.trim().toUpperCase();
    const existing = await this.couponRepository.findByCode(normalizedCode);
    if (existing) {
      throw new ValidationError("Coupon code already exists");
    }

    const type = restaurantId ? "restaurant" : (couponType === "restaurant" ? "restaurant" : "global");

    const coupon = new Coupon(
      "",
      normalizedCode,
      dto.discountType,
      dto.discountValue,
      dto.maxDiscountAmount ?? 0,
      dto.minOrderAmount ?? 0,
      new Date(dto.expiryDate),
      dto.usageLimit ?? 0,
      dto.isActive ?? true
    );

    const saved = await this.couponRepository.create(coupon);
    (saved as any).restaurantId = restaurantId || (couponType === "restaurant" ? restaurantId : null);
    (saved as any).couponType = type;

    return saved;
  }

  async getCoupons(userRole: string, restaurantId?: string | null, queryRestaurantId?: string | null): Promise<Coupon[]> {
    const query: Record<string, any> = {};

    if (userRole === "admin") {
      return await this.couponRepository.find({});
    }

    if (userRole === "seller") {
      if (!restaurantId) {
        return [];
      }
      query.restaurantId = restaurantId;
    } else {
      query.isActive = true;
      query.expiryDate = { $gt: new Date() };
      if (queryRestaurantId) {
        query.$or = [
          { couponType: "global" },
          { restaurantId: queryRestaurantId }
        ];
      } else {
        query.couponType = "global";
      }
    }

    return await this.couponRepository.find(query);
  }

  async updateCoupon(couponId: string, restaurantId: string | null, userRole: string, updateData: any): Promise<Coupon> {
    const coupon = await this.couponRepository.findById(couponId);
    if (!coupon) {
      throw new NotFoundError("Coupon not found");
    }

    if (userRole === "seller" && (coupon as any).restaurantId !== restaurantId) {
      throw new AuthorizationError("Access denied to this coupon");
    }

    if (updateData.code) {
      const normalizedCode = updateData.code.trim().toUpperCase();
      const existing = await this.couponRepository.findByCode(normalizedCode);
      if (existing && existing.id !== couponId) {
        throw new ValidationError("Coupon code already exists");
      }
      updateData.code = normalizedCode;
    }

    const updated = new Coupon(
      coupon.id,
      updateData.code || coupon.code,
      updateData.discountType || coupon.discountType,
      updateData.discountValue !== undefined ? updateData.discountValue : coupon.discountValue,
      updateData.maxDiscountAmount !== undefined ? updateData.maxDiscountAmount : coupon.maxDiscountAmount,
      updateData.minOrderAmount !== undefined ? updateData.minOrderAmount : coupon.minOrderAmount,
      updateData.expiryDate ? new Date(updateData.expiryDate) : coupon.expiryDate,
      updateData.usageLimit !== undefined ? updateData.usageLimit : coupon.usageLimit,
      updateData.isActive !== undefined ? updateData.isActive : coupon.isActive
    );

    if ((coupon as any).restaurantId) {
      (updated as any).restaurantId = (coupon as any).restaurantId;
    }
    if ((coupon as any).couponType) {
      (updated as any).couponType = (coupon as any).couponType;
    }

    return await this.couponRepository.update(updated);
  }

  async deleteCoupon(couponId: string, restaurantId: string | null, userRole: string): Promise<void> {
    const coupon = await this.couponRepository.findById(couponId);
    if (!coupon) {
      throw new NotFoundError("Coupon not found");
    }

    if (userRole === "seller" && (coupon as any).restaurantId !== restaurantId) {
      throw new AuthorizationError("Access denied to this coupon");
    }

    await this.couponRepository.delete(couponId, (coupon as any).restaurantId || "");
  }

  async validateCouponCode(code: string, userId: string, subtotal: number): Promise<Coupon> {
    const coupon = await this.couponRepository.findByCode(code);
    if (!coupon) {
      throw new NotFoundError("Coupon not found");
    }
    const usageCount = await this.couponRepository.getUsageCount(coupon.id, userId);
    coupon.validateApplicability(subtotal, usageCount);
    return coupon;
  }

  async getCouponAnalytics(couponId: string, restaurantId: string | null, userRole: string): Promise<any> {
    const coupon = await this.couponRepository.findById(couponId);
    if (!coupon) {
      throw new NotFoundError("Coupon not found");
    }

    if (userRole === "seller" && (coupon as any).restaurantId !== restaurantId) {
      throw new AuthorizationError("Access denied");
    }

    const stats = await this.couponRepository.getAnalytics(couponId);
    return {
      coupon,
      ...stats
    };
  }
}
