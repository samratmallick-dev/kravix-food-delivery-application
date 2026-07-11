export const ROUTES = {
  RIDERS: {
    BASE: "/riders",
    ME: "/me",
    LOCATION: "/location",
    ORDERS: "/orders",
    ACCEPT: "/orders/:orderId/accept",
    PICKUP: "/orders/:orderId/pickup",
    DELIVER: "/orders/:orderId/deliver"
  }
} as const;
