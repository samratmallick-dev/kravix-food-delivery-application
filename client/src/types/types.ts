import type React from "react";

export interface User {
      _id: string;
      name: string;
      email: string;
      image: string;
      role: string | null;
      restaurantId?: string | null;
      isBlocked?: boolean;
      blockedUntil?: string | null;
      authProvider?: "google" | "email";
      isEmailVerified?: boolean;
};

export interface LocationData {
      latitude: number;
      longitude: number;
      formattedAddress: string;
};

export interface AppContextType {
      user: User | null;
      loading: boolean;
      isAuth: boolean;
      setUser: React.Dispatch<React.SetStateAction<User | null>>;
      setLoading: React.Dispatch<React.SetStateAction<boolean>>;
      setIsAuth: React.Dispatch<React.SetStateAction<boolean>>;
      location: LocationData | null;
      setLocation: React.Dispatch<React.SetStateAction<LocationData | null>>;
      city: string;
      locationLoading: boolean;
      cart: ICart[] | [];
      fetchCart: () => Promise<void>;
      fetchCurrentUser: () => Promise<void>;
      subTotal: number;
      quantity: number;
};

export interface IRestaurant {
      _id: string;
      name: string;
      description: string;
      image: string;
      ownerId: string;
      phone: number;
      isVerified: boolean;

      autoLocation: {
            type: "Point";
            coordinates: [number, number];
            formattedAddress: string;
      };
      isOpen: boolean;
      createdAt: Date;
};

export interface IMenuItem {
      _id: string;
      restaurantId: string;
      name: string;
      description: string;
      price: number;
      imageUrl?: string;
      isAvailable: boolean;
      isVeg: boolean;
      category: string;
      createdAt: Date;
      updatedAt: Date;
};

export interface IFoodSearchResult {
      item: {
            _id: string;
            name: string;
            price: number;
            imageUrl?: string;
            description: string;
            isAvailable: boolean;
      };
      restaurant: IRestaurant & { distanceKm: number };
};

export interface ICart {
      _id: string;
      userId: string;
      restaurantId: string | IRestaurant;
      itemId: string | IMenuItem;
      quantity: number;
      createdAt: Date;
      updatedAt: Date;
};

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

      status: | "placed" | "accepted" | "preparing" | "ready_for_rider" | "rider_assigned" | "picked_up" | "out_for_delivery" | "reached_delivery_location" | "delivered" | "cancelled";

      paymentMethod: "razorpay" | "stripe" | "cod";

      paymentStatus: "pending" | "paid" | "failed" | "cod_pending" | "cod_paid" | "cod_failed";

      codPaymentMode?: "cash" | "upi" | "card" | "wallet" | null;

      deliveryOtp?: string | null;

      expiresAt?: Date;

      createdAt: Date;
      updatedAt: Date;
};

export interface IRider {
      _id: string;
      userId: string;
      picture: string;
      phoneNumber: string;
      aadhaarNumber: string;
      drivingLicesce: string;
      isVerified: boolean;
      isAvailable: boolean;
      totalEarnings: number;
      totalDeliveries: number;
      rating: number | null;
      ratingCount: number;
};

export interface IRiderEarnings {
      totalEarnings: number;
      totalDeliveries: number;
      rating: number | null;
      todayEarnings: number;
      weekEarnings: number;
      weeklyBreakdown: { date: string; amount: number }[];
};

export interface ICoupon {
      _id: string;
      code: string;
      discountType: "percentage" | "flat" | "free_delivery";
      discountValue: number;
      maxDiscountAmount: number;
      minOrderAmount: number;
      expiryDate: Date;
      usageLimit: number;
      usedCount: number;
      perUserLimit: number;
      couponType: "global" | "restaurant";
      restaurantId?: string;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
}

export interface IReview {
      _id: string;
      userId: string;
      userName: string;
      userImage: string;
      orderId: string;
      restaurantId: string;
      menuItemId?: string;
      riderId?: string;
      rating: number;
      comment: string;
      type: "restaurant" | "menu_item" | "rider";
      status: "approved" | "flagged" | "rejected";
      isReported: boolean;
      reportReason?: string;
      createdAt: Date;
      updatedAt: Date;
}
