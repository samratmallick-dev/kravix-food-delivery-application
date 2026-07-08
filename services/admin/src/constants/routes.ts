export const ROUTES = {
  ADMIN: {
    BASE: "/admin",
    LOGIN: "/login",
    DASHBOARD: "/dashboard",
    USERS: "/users",
    USER_DETAIL: "/users/:userId",
    BLOCK_USER: "/users/:userId/block",
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
    CANCEL_ORDER: "/orders/:orderId/cancel"
  }
} as const;
