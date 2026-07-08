export const ROUTES = {
  AUTH: {
    BASE: "/auth",
    REGISTER: "/register",
    REGISTER_GOOGLE: "/register/google",
    LOGIN: "/login",
    LOGIN_GOOGLE: "/login/google",
    LOGOUT: "/logout",
    REFRESH: "/refresh-token",
    FORGOT_PASSWORD: "/forgot-password",
    RESET_PASSWORD: "/reset-password",
    VERIFY_EMAIL: "/verify-email",
    RESEND_VERIFICATION: "/resend-verification"
  },
  USERS: {
    BASE: "/users",
    ME: "/me",
    ME_ROLE: "/me/role",
    DETAIL: "/:userId"
  },
  RESTAURANTS: {
    BASE: "/restaurants",
    DETAIL: "/:restaurantId",
    MENU: "/:restaurantId/menu-items",
    REVIEWS: "/:restaurantId/reviews"
  },
  MENU_ITEMS: {
    BASE: "/menu-items",
    DETAIL: "/:menuItemId"
  },
  CART: {
    BASE: "/cart",
    ITEMS: "/items",
    ITEM_DETAIL: "/items/:itemId"
  },
  ADDRESSES: {
    BASE: "/addresses",
    DETAIL: "/:addressId"
  },
  ORDERS: {
    BASE: "/orders",
    DETAIL: "/:orderId",
    TRACKING: "/:orderId/tracking"
  },
  RIDERS: {
    BASE: "/riders",
    ME: "/me",
    LOCATION: "/location",
    ORDERS: "/orders",
    ACCEPT: "/orders/:orderId/accept",
    PICKUP: "/orders/:orderId/pickup",
    DELIVER: "/orders/:orderId/deliver"
  },
  PAYMENTS: {
    BASE: "/payments",
    DETAIL: "/:paymentId",
    VERIFY: "/verify",
    WEBHOOK: "/webhook"
  },
  COUPONS: {
    BASE: "/coupons",
    DETAIL: "/:couponId"
  },
  REVIEWS: {
    BASE: "/reviews",
    DETAIL: "/:reviewId"
  },
  SEARCH: {
    BASE: "/search",
    RESTAURANTS: "/restaurants",
    MENU_ITEMS: "/menu-items",
    SUGGESTIONS: "/suggestions"
  },
  ANALYTICS: {
    BASE: "/analytics",
    DASHBOARD: "/dashboard",
    ORDERS: "/orders",
    RESTAURANTS: "/restaurants",
    REVENUE: "/revenue"
  },
  ADMIN: {
    BASE: "/admin",
    LOGIN: "/login",
    DASHBOARD: "/dashboard",
    USERS: "/users",
    USER_DETAIL: "/users/:userId",
    RESTAURANTS: "/restaurants",
    RESTAURANT_DETAIL: "/restaurants/:restaurantId",
    VERIFY_RESTAURANT: "/restaurants/:restaurantId/verify",
    DELETE_RESTAURANT: "/restaurants/:restaurantId",
    RIDERS: "/riders",
    RIDER_DETAIL: "/riders/:riderId",
    VERIFY_RIDER: "/riders/:riderId/verify",
    DELETE_RIDER: "/riders/:riderId",
    ORDERS: "/orders",
    ORDER_DETAIL: "/orders/:orderId",
    CANCEL_ORDER: "/orders/:orderId/cancel",
    BLOCK_USER: "/users/:userId/block",
    UNBLOCK_USER: "/users/:userId/unblock"
  },
  AI: {
    BASE: "/ai",
    CHAT: "/chat",
    SEARCH: "/search",
    HEALTH: "/health"
  },
  UPLOADS: {
    BASE: "/uploads",
    IMAGES: "/images",
    IMAGE_DETAIL: "/images/:id"
  },
  SOCKET: {
    BASE: "/socket",
    EVENTS: "/events"
  }
} as const;
