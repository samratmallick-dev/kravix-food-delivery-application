const isDev = import.meta.env.DEV;

const authHost = isDev ? "http://localhost:8000/api/v1" : "https://kravix-auth.onrender.com/api/v1";
const restaurantHost = isDev ? "http://localhost:9000/api/v1" : "https://kravix-restaurant.onrender.com/api/v1";
const utilitiesHost = isDev ? "http://localhost:8888/api/v1" : "https://kravix-utilities.onrender.com/api/v1";
const riderHost = isDev ? "http://localhost:7000/api/v1" : "https://kravix-rider.onrender.com/api/v1";
const adminHost = isDev ? "http://localhost:6001/api/v1" : "https://kravix-admin.onrender.com/api/v1";
const analyticsHost = isDev ? "http://localhost:6002/api/v1" : "https://kravix-analytics.onrender.com/api/v1";
const realtimeSocketHost = isDev ? "http://localhost:9999" : "https://kravix-realtime.onrender.com";

export const authBaseUrl = import.meta.env.VITE_API_URL_AUTH || `${authHost}/auth`;
export const usersBaseUrl = import.meta.env.VITE_API_URL_USERS || `${authHost}/users`;

export const restaurantBaseUrl = import.meta.env.VITE_API_URL_RESTAURANT || `${restaurantHost}/restaurants`;
export const menuBaseUrl = import.meta.env.VITE_API_URL_MENU || `${restaurantHost}/menu-items`;
export const cartBaseUrl = import.meta.env.VITE_API_URL_CART || `${restaurantHost}/cart`;
export const addressBaseUrl = import.meta.env.VITE_API_URL_ADDRESS || `${restaurantHost}/addresses`;
export const orderBaseUrl = import.meta.env.VITE_API_URL_ORDER || `${restaurantHost}/orders`;
export const couponBaseUrl = import.meta.env.VITE_COUPON_BASE_URL || `${restaurantHost}/coupons`;
export const reviewBaseUrl = import.meta.env.VITE_REVIEW_BASE_URL || `${restaurantHost}/reviews`;

export const paymentBaseUrl = import.meta.env.VITE_API_URL_PAYMENT || `${utilitiesHost}/payments`;
export const cloudinaryBaseUrl = import.meta.env.VITE_API_URL_CLOUDINARY || `${utilitiesHost}/uploads`;
export const uploadsBaseUrl = cloudinaryBaseUrl;
export const aiBaseUrl = import.meta.env.VITE_API_URL_AI || `${utilitiesHost}/ai`;

export const riderBaseUrl = import.meta.env.VITE_API_URL_RIDER || `${riderHost}/riders`;
export const adminBaseUrl = import.meta.env.VITE_API_URL_ADMIN || `${adminHost}/admin`;
export const analyticsBaseUrl = import.meta.env.VITE_API_URL_ANALYTICS || `${analyticsHost}/analytics`;
export const realtimeSocketBaseUrl = import.meta.env.VITE_API_URL_REALTIME_SOCKET || `${realtimeSocketHost}`;
