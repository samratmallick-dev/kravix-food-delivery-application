export interface RiderProfile {
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

export interface EarningBreakdown {
  date: string;
  amount: number;
}

export interface EarningsSummary {
  total: number;
  count: number;
  trend: number; // % change vs previous period
  breakdown: EarningBreakdown[];
}

export type EarningsPeriod = "today" | "week" | "month";

export enum DeliveryStep {
  RIDER_ASSIGNED = "rider_assigned",
  PICKED_UP = "picked_up",
  OUT_FOR_DELIVERY = "out_for_delivery",
  REACHED = "reached_delivery_location",
  DELIVERED = "delivered",
}

export interface ActiveDelivery {
  _id: string;
  restaurantName: string;
  restaurantAddress: string;
  customerName: string;
  customerAddress: string;
  customerPhone: number;
  items: { name: string; quantity: number; price: number }[];
  riderAmount: number;
  status: DeliveryStep;
  distance: number;
  createdAt: string;
}

export interface IncomingOrder {
  orderId: string;
  restaurantName: string;
  distanceKm: number;
  payout: number;
  expiresAt: string;
}

export type DeliveryStatus = "delivered" | "cancelled" | "pending" | "active";

export interface DeliveryHistoryItem {
  _id: string;
  restaurantName: string;
  customerName: string;
  distance: number;
  riderAmount: number;
  status: string;
  createdAt: string;
  items: { name: string; quantity: number; price: number }[];
}

export interface DeliveryHistoryPage {
  orders: DeliveryHistoryItem[];
  total: number;
  page: number;
  totalPages: number;
}

export type SortField = "createdAt" | "riderAmount" | "distance";
export type SortDir = "asc" | "desc";
