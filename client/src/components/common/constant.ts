const isDev = import.meta.env.DEV;

export const authBaseUrl = import.meta.env.VITE_API_URL_AUTH || (isDev ? "http://localhost:8000/api/v1/auth" : "https://kravix-auth.onrender.com/api/v1/auth");
export const restaurantBaseUrl = import.meta.env.VITE_API_URL_RESTAURANT || (isDev ? "http://localhost:9000/api/v1/restaurants" : "https://kravix-restaurant.onrender.com/api/v1/restaurants");
export const menuBaseUrl = import.meta.env.VITE_API_URL_MENU || (isDev ? "http://localhost:9000/api/v1/menu" : "https://kravix-restaurant.onrender.com/api/v1/menu");
export const cartBaseUrl = import.meta.env.VITE_API_URL_CART || (isDev ? "http://localhost:9000/api/v1/cart" : "https://kravix-restaurant.onrender.com/api/v1/cart");
export const addressBaseUrl = import.meta.env.VITE_API_URL_ADDRESS || (isDev ? "http://localhost:9000/api/v1/address" : "https://kravix-restaurant.onrender.com/api/v1/address");
export const orderBaseUrl = import.meta.env.VITE_API_URL_ORDER || (isDev ? "http://localhost:9000/api/v1/orders" : "https://kravix-restaurant.onrender.com/api/v1/orders");
export const paymentBaseUrl = import.meta.env.VITE_API_URL_PAYMENT || (isDev ? "http://localhost:8888/api/v1/payment" : "https://kravix-utilities.onrender.com/api/v1/payment");
export const realtimeSocketBaseUrl = import.meta.env.VITE_API_URL_REALTIME_SOCKET || (isDev ? "http://localhost:9999" : "https://kravix-realtime.onrender.com");
export const riderBaseUrl = import.meta.env.VITE_API_URL_RIDER || (isDev ? "http://localhost:7000/api/v1/riders" : "https://kravix-rider.onrender.com/api/v1/riders");
export const adminBaseUrl = import.meta.env.VITE_API_URL_ADMIN || (isDev ? "http://localhost:6001/api/v1/admin" : "https://kravix-admin.onrender.com/api/v1/admin");
export const couponBaseUrl = import.meta.env.VITE_COUPON_BASE_URL || (isDev ? "http://localhost:9000/api/v1/coupons" : "https://kravix-restaurant.onrender.com/api/v1/coupons");
export const reviewBaseUrl = import.meta.env.VITE_REVIEW_BASE_URL || (isDev ? "http://localhost:9000/api/v1/reviews" : "https://kravix-restaurant.onrender.com/api/v1/reviews");
export const analyticsBaseUrl = import.meta.env.VITE_API_URL_ANALYTICS || (isDev ? "http://localhost:6002/api/v1/analytics" : "https://kravix-analytics.onrender.com/api/v1/analytics");
export const cloudinaryBaseUrl = import.meta.env.VITE_API_URL_CLOUDINARY || (isDev ? "http://localhost:8888/api/v1/cloudinary" : "https://kravix-utilities.onrender.com/api/v1/cloudinary");
export const aiBaseUrl = import.meta.env.VITE_API_URL_AI || (isDev ? "http://localhost:8888/api/v1/ai" : "https://kravix-utilities.onrender.com/api/v1/ai");
export const internalKey = import.meta.env.VITE_INTERNAL_KEY as string;

export const stripPublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

export const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;