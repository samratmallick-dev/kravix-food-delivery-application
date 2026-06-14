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

const TOKEN_KEY = "token";
const ADMIN_TOKEN_KEY = "adminToken";
const RESTAURANT_TAB_KEY = "restaurantTab";

export const storage = {
    getToken: (): string | null => secureLocalStorage.getItem(TOKEN_KEY),
    setToken: (token: string): void => secureLocalStorage.setItem(TOKEN_KEY, token),
    removeToken: (): void => secureLocalStorage.removeItem(TOKEN_KEY),

    getAdminToken: (): string | null => secureLocalStorage.getItem(ADMIN_TOKEN_KEY),
    setAdminToken: (token: string): void => secureLocalStorage.setItem(ADMIN_TOKEN_KEY, token),
    removeAdminToken: (): void => secureLocalStorage.removeItem(ADMIN_TOKEN_KEY),

    getRestaurantTab: (): string | null => secureLocalStorage.getItem(RESTAURANT_TAB_KEY),
    setRestaurantTab: (tab: string): void => secureLocalStorage.setItem(RESTAURANT_TAB_KEY, tab),

    getAppliedCoupon: (): string | null => secureLocalStorage.getItem("appliedCouponCode"),
    setAppliedCoupon: (code: string): void => secureLocalStorage.setItem("appliedCouponCode", code),
    removeAppliedCoupon: (): void => secureLocalStorage.removeItem("appliedCouponCode"),
};
