export const ROUTES = {
  RESTAURANTS: {
    BASE: "/restaurants",
    ME: "/me",
    ME_STATUS: "/me/status",
    DETAIL: "/:id"
  },
  MENU_ITEMS: {
    BASE: "/menu-items",
    AUTOCOMPLETE: "/autocomplete",
    SEARCH: "/search",
    BY_RESTAURANT: "/:restaurantId",
    DETAIL: "/:itemId",
    AVAILABILITY: "/:itemId/availability"
  },
  CART: {
    BASE: "/cart",
    INCREMENT: "/increment",
    DECREMENT: "/decrement"
  },
  ADDRESSES: {
    BASE: "/addresses",
    DETAIL: "/:addressId"
  },
  ORDERS: {
    BASE: "/orders",
    ME: "/me",
    ME_DETAIL: "/me/:orderId",
    ME_CANCEL: "/me/:orderId/cancel",
    REORDER: "/reorder/:orderId",
    RESTAURANT_ORDERS: "/restaurants/:restaurantId",
    RESTAURANT_SALES: "/restaurants/:restaurantId/sales-stats",
    STATUS: "/:orderId/status",
    PAYMENT: "/:id/payment",
    INTERNAL_RIDER_ASSIGNMENT: "/internal/rider-assignment",
    INTERNAL_CURRENT: "/internal/current",
    INTERNAL_STATUS: "/internal/status",
    INTERNAL_DELIVERY_HISTORY: "/internal/delivery-history",
    INTERNAL_SET_OTP: "/internal/set-otp",
    INTERNAL_COD_PAYMENT: "/internal/cod-payment",
    INTERNAL_DETAIL: "/internal/:orderId"
  },
  COUPONS: {
    BASE: "/coupons",
    APPLY: "/apply",
    ANALYTICS: "/analytics/:id",
    DETAIL: "/:id"
  },
  REVIEWS: {
    BASE: "/reviews",
    BY_RESTAURANT: "/restaurant/:id",
    BY_RIDER: "/rider/:id",
    REPORT: "/report",
    ADMIN: "/admin",
    ADMIN_MODERATE: "/admin/moderate/:id"
  },
  SEARCH: {
    BASE: "/search",
    RESTAURANTS: "/restaurants",
    MENU_ITEMS: "/menu-items",
    SUGGESTIONS: "/suggestions"
  }
} as const;
