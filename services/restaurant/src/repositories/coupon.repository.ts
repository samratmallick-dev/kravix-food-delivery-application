import mongoose from "mongoose";
import { ICouponRepository } from "../interfaces/ICouponRepository.js";
import { Coupon } from "../domain/entities/Coupon.js";
import { Coupon as CouponModel } from "../model/Coupon.js";
import { CouponUsage as CouponUsageModel } from "../model/CouponUsage.js";
import { CouponMapper } from "../mappers/coupon.mapper.js";

export class CouponRepository implements ICouponRepository {
  async findByCode(code: string): Promise<Coupon | null> {
    const raw = await CouponModel.findOne({
      code: code.trim().toUpperCase()
    }).lean();
    if (!raw) return null;
    return CouponMapper.toDomain(raw);
  }

  async findActiveByRestaurant(restaurantId: string): Promise<Coupon[]> {
    const raw = await CouponModel.find({
      restaurantId,
      isActive: true,
      expiryDate: { $gte: new Date() }
    }).lean();
    return raw.map(CouponMapper.toDomain);
  }

  async create(coupon: Coupon): Promise<Coupon> {
    const persistence = CouponMapper.toPersistence(coupon);
    const raw = await CouponModel.create(persistence);
    return CouponMapper.toDomain(raw);
  }

  async delete(id: string, restaurantId: string): Promise<void> {
    await CouponModel.deleteOne({ _id: id, restaurantId });
  }

  async getUsageCount(couponId: string, userId: string): Promise<number> {
    return await CouponUsageModel.countDocuments({ couponId, userId });
  }

  async incrementUsage(couponId: string, userId: string): Promise<void> {
    // Staged via RabbitMQ payment success consumer
  }

  async find(filter: Record<string, any>): Promise<Coupon[]> {
    const raw = await CouponModel.find(filter).sort({ createdAt: -1 }).lean();
    return raw.map(CouponMapper.toDomain);
  }

  async findById(id: string): Promise<Coupon | null> {
    const raw = await CouponModel.findById(id).lean();
    if (!raw) return null;
    return CouponMapper.toDomain(raw);
  }

  async update(coupon: Coupon): Promise<Coupon> {
    const persistence = CouponMapper.toPersistence(coupon);
    const raw = await CouponModel.findByIdAndUpdate(
      coupon.id,
      { $set: persistence },
      { new: true }
    );
    if (!raw) {
      throw new Error("Coupon not found");
    }
    return CouponMapper.toDomain(raw);
  }

  async getAnalytics(couponId: string): Promise<any> {
    const usages = await CouponUsageModel.find({ couponId })
      .sort({ usedAt: -1 })
      .limit(100)
      .lean();

    const summary = await CouponUsageModel.aggregate([
      { $match: { couponId: new mongoose.Types.ObjectId(couponId) } },
      {
        $group: {
          _id: null,
          totalRedemptions: { $sum: 1 },
          totalDiscountAmount: { $sum: "$discountApplied" }
        }
      }
    ]);

    const totalRedemptions = summary[0]?.totalRedemptions || 0;
    const totalDiscountAmount = summary[0]?.totalDiscountAmount || 0;

    return { totalRedemptions, totalDiscountAmount, usages };
  }
}
