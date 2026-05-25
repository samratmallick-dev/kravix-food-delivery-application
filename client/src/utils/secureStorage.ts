import secureLocalStorage from "react-secure-storage";

const TOKEN_KEY = "token";
const ADMIN_TOKEN_KEY = "adminToken";
const RESTAURANT_TAB_KEY = "restaurantTab";

export const storage = {
    getToken: (): string | null => {
        const val = secureLocalStorage.getItem(TOKEN_KEY);
        return typeof val === "string" ? val : null;
    },
    setToken: (token: string): void => {
        secureLocalStorage.setItem(TOKEN_KEY, token);
    },
    removeToken: (): void => {
        secureLocalStorage.removeItem(TOKEN_KEY);
    },

    getAdminToken: (): string | null => {
        const val = secureLocalStorage.getItem(ADMIN_TOKEN_KEY);
        return typeof val === "string" ? val : null;
    },
    setAdminToken: (token: string): void => {
        secureLocalStorage.setItem(ADMIN_TOKEN_KEY, token);
    },
    removeAdminToken: (): void => {
        secureLocalStorage.removeItem(ADMIN_TOKEN_KEY);
    },

    getRestaurantTab: (): string | null => {
        const val = secureLocalStorage.getItem(RESTAURANT_TAB_KEY);
        return typeof val === "string" ? val : null;
    },
    setRestaurantTab: (tab: string): void => {
        secureLocalStorage.setItem(RESTAURANT_TAB_KEY, tab);
    },

    getAppliedCoupon: (): string | null => {
        const val = secureLocalStorage.getItem("appliedCouponCode");
        return typeof val === "string" ? val : null;
    },
    setAppliedCoupon: (code: string): void => {
        secureLocalStorage.setItem("appliedCouponCode", code);
    },
    removeAppliedCoupon: (): void => {
        secureLocalStorage.removeItem("appliedCouponCode");
    },
};
