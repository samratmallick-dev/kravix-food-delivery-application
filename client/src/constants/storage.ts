const mode = import.meta.env.MODE || "production";

export const STORAGE_KEYS = {
      TOKEN: `token_${mode}`,
      ADMIN_TOKEN: `adminToken_${mode}`,
      RESTAURANT_TAB: `restaurantTab_${mode}`,
      APPLIED_COUPON: `appliedCouponCode_${mode}`,
      SECURE_SECRET: "kravix_secure_key_v1"
} as const;