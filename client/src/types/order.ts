export interface IOrder {
      _id: string;
      userId: string;
      restaurantId: string;
      restaurantName: string;
      riderId?: string | null;
      riderPhoneNumber: number | null;
      riderName: string | null;
      distance: number;
      riderAmount: number;

      items: {
            itemId: string;
            name: string;
            price: number;
            quantity: number;
      }[];

      subtotal: number;
      deliveryFee: number;
      platformFee: number;
      discountAmount?: number;
      couponCode?: string;
      totalAmount: number;

      addressId: string;
      deliveryAddress: {
            formatedAddress: string;
            mobile: number;
            customerName: string;
            latitude: number;
            longitude: number;
      };

      status: "placed" | "accepted" | "preparing" | "ready_for_rider" | "rider_assigned" | "picked_up" | "out_for_delivery" | "reached_delivery_location" | "delivered" | "cancelled";

      paymentMethod: "razorpay" | "stripe" | "cod";

      paymentStatus: "pending" | "paid" | "failed" | "cod_pending" | "cod_paid" | "cod_failed";

      codPaymentMode?: "cash" | "upi" | "card" | "wallet" | null;

      deliveryOtp?: string | null;

      expiresAt?: Date;

      createdAt: Date;
      updatedAt: Date;
}
