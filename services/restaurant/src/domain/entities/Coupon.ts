import { ValidationError } from "../../utils/errors.js";

export class Coupon {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly discountType: "percentage" | "flat" | "free_delivery",
    public readonly discountValue: number,
    public readonly maxDiscountAmount: number,
    public readonly minOrderAmount: number,
    public readonly expiryDate: Date,
    public readonly usageLimit: number,
    public readonly isActive: boolean
  ) {}

  validateApplicability(subtotal: number, usageCount: number): void {
    if (!this.isActive) {
      throw new ValidationError("Coupon is inactive");
    }
    if (new Date() > this.expiryDate) {
      throw new ValidationError("Coupon has expired");
    }
    if (subtotal < this.minOrderAmount) {
      throw new ValidationError(`Minimum order amount of Rs. ${this.minOrderAmount} is required`);
    }
    if (usageCount >= this.usageLimit) {
      throw new ValidationError("Coupon usage limit exceeded");
    }
  }

  calculateDiscount(subtotal: number, deliveryFee: number): number {
    if (this.discountType === "free_delivery") {
      return deliveryFee;
    }
    if (this.discountType === "flat") {
      return Math.min(this.discountValue, subtotal);
    }
    const val = (subtotal * this.discountValue) / 100;
    return Math.min(val, this.maxDiscountAmount);
  }
}
