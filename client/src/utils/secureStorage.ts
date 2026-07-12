import CryptoJS from "crypto-js";

const SECRET_KEY = "kravix_secure_key_v1";

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
const mode = import.meta.env.MODE || "production";
const TOKEN_KEY = `token_${mode}`;
const ADMIN_TOKEN_KEY = `adminToken_${mode}`;
const RESTAURANT_TAB_KEY = `restaurantTab_${mode}`;
const APPLIED_COUPON_KEY = `appliedCouponCode_${mode}`;

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
    removeToken: (): void => secureLocalStorage.removeItem(TOKEN_KEY),

    getAdminToken: (): string | null => secureLocalStorage.getItem(ADMIN_TOKEN_KEY),
    setAdminToken: (token: string): void => secureLocalStorage.setItem(ADMIN_TOKEN_KEY, token),
    removeAdminToken: (): void => secureLocalStorage.removeItem(ADMIN_TOKEN_KEY),

    getRestaurantTab: (): string | null => secureLocalStorage.getItem(RESTAURANT_TAB_KEY),
    setRestaurantTab: (tab: string): void => secureLocalStorage.setItem(RESTAURANT_TAB_KEY, tab),

    getAppliedCoupon: (): string | null => secureLocalStorage.getItem(APPLIED_COUPON_KEY),
    setAppliedCoupon: (code: string): void => secureLocalStorage.setItem(APPLIED_COUPON_KEY, code),
    removeAppliedCoupon: (): void => secureLocalStorage.removeItem(APPLIED_COUPON_KEY),
};
