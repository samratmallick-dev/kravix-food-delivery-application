export const authBaseUrl = import.meta.env.VITE_API_URL_AUTH;
export const restaurantBaseUrl = import.meta.env.VITE_API_URL_RESTAURANT;
export const menuBaseUrl = import.meta.env.VITE_API_URL_MENU;
export const cartBaseUrl = import.meta.env.VITE_API_URL_CART;
export const addressBaseUrl = import.meta.env.VITE_API_URL_ADDRESS;
export const orderBaseUrl = import.meta.env.VITE_API_URL_ORDER;
export const paymentBaseUrl = import.meta.env.VITE_API_URL_PAYMENT;
export const realtimeSocketBaseUrl = import.meta.env.VITE_API_URL_REALTIME_SOCKET;
export const riderBaseUrl = import.meta.env.VITE_API_URL_RIDER;
export const adminBaseUrl = import.meta.env.VITE_API_URL_ADMIN;
export const couponBaseUrl = import.meta.env.VITE_COUPON_BASE_URL || "http://localhost:9000/api/v1/coupons";
export const reviewBaseUrl = import.meta.env.VITE_REVIEW_BASE_URL || "http://localhost:9000/api/v1/reviews";
export const analyticsBaseUrl = import.meta.env.VITE_API_URL_ANALYTICS || "http://localhost:6002/api/v1/analytics";
export const cloudinaryBaseUrl = (import.meta.env.VITE_API_URL_PAYMENT as string)?.replace("/payment", "/cloudinary") || "http://localhost:8888/api/v1/cloudinary";
export const internalKey = import.meta.env.VITE_INTERNAL_KEY as string;

export const stripPublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

export const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;