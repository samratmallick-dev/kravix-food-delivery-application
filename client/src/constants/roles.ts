export const ROLES = {
      CUSTOMER: "customer",
      SELLER: "seller",
      RIDER: "rider",
      ADMIN: "admin"
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];
