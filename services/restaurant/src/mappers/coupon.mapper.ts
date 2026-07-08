import { Coupon } from "../domain/entities/Coupon.js";

export class CouponMapper {
  static toDomain(raw: any): Coupon {
    return new Coupon(
      raw._id.toString(),
      raw.code,
      raw.discountType,
      raw.discountValue,
      raw.maxDiscountAmount ?? 0,
      raw.minOrderAmount ?? 0,
      new Date(raw.expiryDate),
      raw.usageLimit ?? 1,
      raw.isActive ?? false
    );
  }

  static toPersistence(domain: Coupon): any {
    return {
      code: domain.code,
      discountType: domain.discountType,
      discountValue: domain.discountValue,
      maxDiscountAmount: domain.maxDiscountAmount,
      minOrderAmount: domain.minOrderAmount,
      expiryDate: domain.expiryDate,
      usageLimit: domain.usageLimit,
      isActive: domain.isActive
    };
  }
}
