export const ROUTES = {
  AUTH: {
    BASE: "/auth",
    REGISTER: "/register",
    REGISTER_GOOGLE: "/register/google",
    LOGIN: "/login",
    LOGIN_GOOGLE: "/login/google",
    FORGOT_PASSWORD: "/forgot-password",
    RESET_PASSWORD: "/reset-password",
    VERIFY_EMAIL: "/verify-email",
    RESEND_VERIFICATION: "/resend-verification"
  },
  USERS: {
    BASE: "/users",
    ME: "/me",
    ME_ROLE: "/me/role",
    DETAIL: "/:userId"
  }
} as const;
