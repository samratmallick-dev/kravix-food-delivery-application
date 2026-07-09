export interface AddressRequestDto {
  formattedAddress: string;
  mobile: number;
  latitude: number;
  longitude: number;
}

export interface MenuItemRequestDto {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable?: boolean;
}

export interface CouponRequestDto {
  code: string;
  discountType: "percentage" | "flat" | "free_delivery";
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  expiryDate: string;
  usageLimit?: number;
  isActive?: boolean;
}

export interface ReviewRequestDto {
  orderId: string;
  menuItemId?: string | null;
  rating: number;
  comment: string;
}

export interface PlaceOrderRequestDto {
  addressId: string;
  items: {
    itemId: string;
    quantity: number;
  }[];
  paymentMethod: "razorpay" | "stripe" | "cod";
  couponCode?: string;
}

export interface RestaurantResponseDto {
  _id: string;
  name: string;
  description: string;
  image: string;
  ownerId: string;
  phone: number;
  isVerified: boolean;
  autoLocation: { type: "Point"; coordinates: [number, number]; formattedAddress: string };
  isOpen: boolean;
  distanceKm?: number;
}

export interface MenuItemResponseDto {
  _id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
}

export interface CartResponseDto {
  _id: string;
  userId: string;
  itemId: string;
  restaurantId: string;
  quantity: number;
}

export interface OrderResponseDto {
  _id: string;
  userId: string;
  restaurantId: string;
  restaurantName: string;
  items: {
    itemId: string;
    name: string;
    price: number;
    quantity: number;
    total: number;
  }[];
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  totalGST: number;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  riderName?: string | null;
  riderPhoneNumber?: number | null;
  distance?: number;
  createdAt?: string;
  addressId?: string;
  deliveryAddress?: {
    formatedAddress: string;
    mobile: number;
    customerName: string;
    latitude: number;
    longitude: number;
  };
  riderAmount?: number;
}
