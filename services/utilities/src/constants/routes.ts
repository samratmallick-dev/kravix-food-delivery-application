export const ROUTES = {
  PAYMENTS: {
    BASE: "/payments",
    RAZORPAY: "/razorpay",
    RAZORPAY_VERIFY: "/razorpay/verify",
    STRIPE: "/stripe",
    STRIPE_VERIFY: "/stripe/verify"
  },
  AI: {
    BASE: "/ai",
    CHAT: "/chat",
    FEEDBACK: "/feedback"
  },
  UPLOADS: {
    BASE: "/uploads",
    IMAGES: "/images"
  }
} as const;
