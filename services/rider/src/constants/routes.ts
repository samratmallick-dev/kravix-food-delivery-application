export const ROUTES = {
  RIDERS: {
    BASE: "/riders",
    ME: "/me",
    ME_AVAILABILITY: "/me/availability",
    ME_LOCATION: "/me/location",
    ME_EARNINGS: "/me/earnings",
    ORDERS_CURRENT: "/orders/current",
    ORDERS_STATUS: "/orders/status",
    ORDERS_DELIVERY_HISTORY: "/orders/delivery-history",
    ORDERS_ACCEPT: "/orders/:orderId/accept",
    ORDERS_OTP_GENERATE: "/orders/otp/generate"
  }
} as const;
