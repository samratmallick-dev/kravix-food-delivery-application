export type OrderStatus =
  | "placed" | "accepted" | "preparing" | "ready_for_rider"
  | "rider_assigned" | "picked_up" | "out_for_delivery"
  | "reached_delivery_location" | "delivered" | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed";
export type PaymentMethod = "razorpay" | "stripe";

export interface AdminOrder {
  _id: string;
  userId: string;
  restaurantId: string;
  restaurantName: string;
  riderId?: string | null;
  riderName: string | null;
  riderPhoneNumber: number | null;
  items: { itemId: string; name: string; price: number; quantity: number }[];
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  totalAmount: number;
  deliveryAddress: {
    formatedAddress: string;
    mobile: number;
    customerName: string;
    latitude: number;
    longitude: number;
  };
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  image: string;
  role: "customer" | "seller" | "rider" | null;
  isBlocked: boolean;
  blockedUntil: string | null;
  createdAt: string;
}

export interface AdminRestaurant {
  _id: string;
  name: string;
  description: string;
  image: string;
  ownerId: string;
  phone: number;
  isVerified: boolean;
  isOpen: boolean;
  createdAt: string;
}

export interface AdminRider {
  _id: string;
  userId: string;
  picture: string;
  phoneNumber: string;
  aadhaarNumber: string;
  drivingLicesce: string;
  isVerified: boolean;
  isAvailable: boolean;
  lastActiveAt: string;
  createdAt: string;
}

export interface AdminMenuItem {
  _id: string;
  name: string;
  price: number;
  isAvailable: boolean;
  description: string;
}

export interface Metrics {
  ordersToday: number;
  revenueToday: number;
  activeRiders: number;
  activeRestaurants: number;
  ordersByStatus: Record<string, number>;
  revenueByDay: { date: string; revenue: number }[];
  // legacy dashboard fields
  users?: Record<string, number>;
  restaurants?: { verified: number; unverified: number };
  riders?: { verified: number; unverified: number };
  orders?: Record<string, number>;
  totalRevenue?: number;
  today?: { orders: number; revenue: number };
}

export interface FinanceRow {
  entityId: string;
  entityName: string;
  entityType: "restaurant" | "rider";
  totalOrders: number;
  grossRevenue: number;
  platformCommission: number;
  netPayout: number;
  payoutStatus: "paid" | "pending" | "failed";
}

export interface FinanceSummary {
  totalPayouts: number;
  platformCommission: number;
  pendingSettlements: number;
  rows: FinanceRow[];
}

export interface AnalyticsData {
  heatmap: number[][];
  topRestaurants: { name: string; revenue: number }[];
  topRiders: { name: string; deliveries: number }[];
  retention: { month: string; newCustomers: number; returning: number }[];
  avgDeliveryTrend: { date: string; avgMinutes: number }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
}

export interface OrderFilters {
  status?: string;
  paymentStatus?: string;
  from?: string;
  to?: string;
  page: number;
}

export interface UserFilters {
  role?: string;
  page: number;
  search?: string;
}

export interface RestaurantFilters {
  isVerified?: string;
  page: number;
}
