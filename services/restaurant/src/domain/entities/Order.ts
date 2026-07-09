import { Coupon } from "./Coupon.js";

export interface OrderItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export class Order {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly restaurantId: string,
    public readonly restaurantName: string,
    public readonly items: OrderItem[],
    public subtotal: number,
    public deliveryFee: number,
    public platformFee: number,
    public totalGST: number,
    public totalAmount: number,
    public riderAmount: number,
    public readonly addressId: string,
    public readonly deliveryAddress: {
      formatedAddress: string;
      mobile: number;
      customerName: string;
      latitude: number;
      longitude: number;
    },
    public status: string,
    public paymentMethod: string,
    public paymentStatus: string,
    public riderId?: string | null,
    public riderName?: string | null,
    public riderPhoneNumber?: number | null,
    public distance?: number,
    public createdAt?: Date
  ) {}

  calculateTotals(distance: number, coupon?: Coupon, couponUsageCount?: number): void {
    this.distance = distance;
    let subtotal = 0;
    for (const item of this.items) {
      subtotal += item.price * item.quantity;
    }
    this.subtotal = subtotal;

    let deliveryFee = 0;
    if (subtotal < 250) {
      deliveryFee = Math.ceil(distance <= 3 ? 35 : 35 + (distance - 3) * 9);
    }
    this.deliveryFee = deliveryFee;

    let discountAmount = 0;
    if (coupon) {
      coupon.validateApplicability(subtotal, couponUsageCount || 0);
      discountAmount = coupon.calculateDiscount(subtotal, deliveryFee);
      discountAmount = Math.round(discountAmount * 100) / 100;
      discountAmount = Math.min(discountAmount, subtotal);
    }

    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const foodGST = +(discountedSubtotal * 0.05).toFixed(2);
    const deliveryGST = +(deliveryFee * 0.18).toFixed(2);
    const totalGST = +(foodGST + deliveryGST).toFixed(2);
    const platformFee = 7;

    this.platformFee = platformFee;
    this.totalGST = totalGST;
    this.totalAmount = +(discountedSubtotal + deliveryFee + platformFee + totalGST).toFixed(2);

    const BASE_PAY = 35;
    const BASE_KM = 3;
    const PER_KM_RATE = 9;
    this.riderAmount = Math.ceil(
      distance <= BASE_KM
        ? BASE_PAY
        : BASE_PAY + (distance - BASE_KM) * PER_KM_RATE
    );
  }

  updateStatus(status: string): void {
    this.status = status;
  }

  markPaid(paymentId: string): void {
    this.paymentStatus = "paid";
  }
}
