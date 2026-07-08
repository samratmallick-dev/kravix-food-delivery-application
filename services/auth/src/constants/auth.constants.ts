export const ROLES = {
  CUSTOMER: "customer",
  RIDER: "rider",
  SELLER: "seller"
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
