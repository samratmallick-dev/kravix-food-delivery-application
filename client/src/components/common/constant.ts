const isProduction = typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1";

export const authBaseUrl = import.meta.env.VITE_API_URL_AUTH || (isProduction ? "https://kravix-auth.onrender.com/api/v1/auth" : "http://127.0.0.1:8000/api/v1/auth");
export const restaurantBaseUrl = import.meta.env.VITE_API_URL_RESTAURANT || (isProduction ? "https://kravix-restaurant.onrender.com/api/v1/restaurants" : "http://127.0.0.1:9000/api/v1/restaurants");
export const menuBaseUrl = import.meta.env.VITE_API_URL_MENU || (isProduction ? "https://kravix-restaurant.onrender.com/api/v1/menu" : "http://127.0.0.1:9000/api/v1/menu");
export const cartBaseUrl = import.meta.env.VITE_API_URL_CART || (isProduction ? "https://kravix-restaurant.onrender.com/api/v1/cart" : "http://127.0.0.1:9000/api/v1/cart");
export const addressBaseUrl = import.meta.env.VITE_API_URL_ADDRESS || (isProduction ? "https://kravix-restaurant.onrender.com/api/v1/address" : "http://127.0.0.1:9000/api/v1/address");
export const orderBaseUrl = import.meta.env.VITE_API_URL_ORDER || (isProduction ? "https://kravix-restaurant.onrender.com/api/v1/orders" : "http://127.0.0.1:9000/api/v1/orders");
export const paymentBaseUrl = import.meta.env.VITE_API_URL_PAYMENT || (isProduction ? "https://kravix-utilities.onrender.com/api/v1/payment" : "http://127.0.0.1:8888/api/v1/payment");
export const realtimeSocketBaseUrl = import.meta.env.VITE_API_URL_REALTIME_SOCKET || (isProduction ? "https://kravix-realtime.onrender.com" : "http://127.0.0.1:9999");
export const riderBaseUrl = import.meta.env.VITE_API_URL_RIDER || (isProduction ? "https://kravix-rider.onrender.com/api/v1/riders" : "http://127.0.0.1:7000/api/v1/riders");
export const adminBaseUrl = import.meta.env.VITE_API_URL_ADMIN || (isProduction ? "https://kravix-admin.onrender.com/api/v1/admin" : "http://127.0.0.1:6001/api/v1/admin");
export const couponBaseUrl = import.meta.env.VITE_COUPON_BASE_URL || (isProduction ? "https://kravix-restaurant.onrender.com/api/v1/coupons" : "http://127.0.0.1:9000/api/v1/coupons");
export const reviewBaseUrl = import.meta.env.VITE_REVIEW_BASE_URL || (isProduction ? "https://kravix-restaurant.onrender.com/api/v1/reviews" : "http://127.0.0.1:9000/api/v1/reviews");
export const analyticsBaseUrl = import.meta.env.VITE_API_URL_ANALYTICS || (isProduction ? "https://kravix-analytics.onrender.com/api/v1/analytics" : "http://127.0.0.1:6002/api/v1/analytics");
export const cloudinaryBaseUrl = import.meta.env.VITE_API_URL_CLOUDINARY || (isProduction ? "https://kravix-utilities.onrender.com/api/v1/cloudinary" : "http://127.0.0.1:8888/api/v1/cloudinary");
export const aiBaseUrl = import.meta.env.VITE_API_URL_AI || (isProduction ? "https://kravix-utilities.onrender.com/api/v1/ai" : "http://127.0.0.1:8888/api/v1/ai");
export const internalKey = import.meta.env.VITE_INTERNAL_KEY as string;

export const stripPublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

export const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;