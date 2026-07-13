import CryptoJS from "crypto-js";
import { STORAGE_KEYS } from "@/constants/storage";
import type { User } from "@/types";

const SECRET_KEY = STORAGE_KEYS.SECURE_SECRET;
const TOKEN_KEY = STORAGE_KEYS.TOKEN;
const ADMIN_TOKEN_KEY = STORAGE_KEYS.ADMIN_TOKEN;
const RESTAURANT_TAB_KEY = STORAGE_KEYS.RESTAURANT_TAB;
const APPLIED_COUPON_KEY = STORAGE_KEYS.APPLIED_COUPON;

const secureLocalStorage = {
      setItem: (key: string, value: string) => {
            try {
                  const encrypted = CryptoJS.AES.encrypt(value, SECRET_KEY).toString();
                  localStorage.setItem(key, encrypted);
            } catch (e) {
                  console.error("Encryption error", e);
            }
      },
      getItem: (key: string): string | null => {
            try {
                  const encrypted = localStorage.getItem(key);
                  if (!encrypted) return null;
                  const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
                  const decrypted = bytes.toString(CryptoJS.enc.Utf8);
                  return decrypted || null;
            } catch (e) {
                  console.error("Decryption error", e);
                  return null;
            }
      },
      removeItem: (key: string) => {
            localStorage.removeItem(key);
      }
};

try {
      const legacyToken = localStorage.getItem("token");
      if (legacyToken) {
            localStorage.setItem(TOKEN_KEY, legacyToken);
            localStorage.removeItem("token");
      }
      const legacyAdminToken = localStorage.getItem("adminToken");
      if (legacyAdminToken) {
            localStorage.setItem(ADMIN_TOKEN_KEY, legacyAdminToken);
            localStorage.removeItem("adminToken");
      }
      const legacyTab = localStorage.getItem("restaurantTab");
      if (legacyTab) {
            localStorage.setItem(RESTAURANT_TAB_KEY, legacyTab);
            localStorage.removeItem("restaurantTab");
      }
      const legacyCoupon = localStorage.getItem("appliedCouponCode");
      if (legacyCoupon) {
            localStorage.setItem(APPLIED_COUPON_KEY, legacyCoupon);
            localStorage.removeItem("appliedCouponCode");
      }
} catch (e) {
      console.error("Storage migration failed", e);
}

export const storage = {
      getToken: (): string | null => secureLocalStorage.getItem(TOKEN_KEY),
      setToken: (token: string): void => secureLocalStorage.setItem(TOKEN_KEY, token),
      removeToken: (): void => {
            secureLocalStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem("userRole");
            secureLocalStorage.removeItem("cached_user");
            secureLocalStorage.removeItem("cached_cart");
            try {
                  const keysToRemove: string[] = [];
                  for (let i = 0; i < sessionStorage.length; i++) {
                        const key = sessionStorage.key(i);
                        if (key && key.startsWith("kravix_api_cache_")) {
                              keysToRemove.push(key);
                        }
                  }
                  keysToRemove.forEach(k => sessionStorage.removeItem(k));
            } catch (e) {
                  console.error("Storage cache clear failed", e);
            }
      },

      getCachedUser: (): User | null => {
            try {
                  const userStr = secureLocalStorage.getItem("cached_user");
                  return userStr ? JSON.parse(userStr) : null;
            } catch {
                  return null;
            }
      },
      setCachedUser: (user: User): void => {
            try {
                  secureLocalStorage.setItem("cached_user", JSON.stringify(user));
            } catch {}
      },
      removeCachedUser: (): void => {
            secureLocalStorage.removeItem("cached_user");
      },

      getCachedCart: (): any | null => {
            try {
                  const cartStr = secureLocalStorage.getItem("cached_cart");
                  return cartStr ? JSON.parse(cartStr) : null;
            } catch {
                  return null;
            }
      },
      setCachedCart: (cartData: any): void => {
            try {
                  secureLocalStorage.setItem("cached_cart", JSON.stringify(cartData));
            } catch {}
      },
      removeCachedCart: (): void => {
            secureLocalStorage.removeItem("cached_cart");
      },

      getAdminToken: (): string | null => secureLocalStorage.getItem(ADMIN_TOKEN_KEY),
      setAdminToken: (token: string): void => secureLocalStorage.setItem(ADMIN_TOKEN_KEY, token),
      removeAdminToken: (): void => secureLocalStorage.removeItem(ADMIN_TOKEN_KEY),

      getRestaurantTab: (): string | null => secureLocalStorage.getItem(RESTAURANT_TAB_KEY),
      setRestaurantTab: (tab: string): void => secureLocalStorage.setItem(RESTAURANT_TAB_KEY, tab),

      getAppliedCoupon: (): string | null => secureLocalStorage.getItem(APPLIED_COUPON_KEY),
      setAppliedCoupon: (code: string): void => secureLocalStorage.setItem(APPLIED_COUPON_KEY, code),
      removeAppliedCoupon: (): void => secureLocalStorage.removeItem(APPLIED_COUPON_KEY),
};
export type StorageType = typeof storage;
