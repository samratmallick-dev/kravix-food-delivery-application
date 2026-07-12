export interface IRestaurant {
      _id: string;
      name: string;
      slug?: string;
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
      location?: {
            address: string;
            city: string;
            state: string;
            country: string;
            pincode: string;
            landmark?: string | null;
            latitude: number;
            longitude: number;
            deliveryRadius: number;
            placeId?: string | null;
      };
      pendingLocation?: {
            address: string;
            city: string;
            state: string;
            country: string;
            pincode: string;
            landmark?: string | null;
            latitude: number;
            longitude: number;
            deliveryRadius: number;
            placeId?: string | null;
      };
      locationReviewStatus?: "PENDING" | "APPROVED" | "REJECTED" | null;
      locationVersion?: number;
      createdAt: Date;
}

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
}

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
}

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
