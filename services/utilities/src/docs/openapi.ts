export const openApiSpec = {
  openapi: "3.1.0",
  info: { title: "Kravix Utilities Service", version: "1.0.0", description: "Payments, image uploads, and AI proxy" },
  servers: [{ url: "/api/v1" }],
  components: {
    securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
    schemas: {
      SuccessResponse: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" }, data: { type: "object" }, error: { type: "boolean" } } },
      ErrorResponse: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" }, error: { type: "boolean" }, code: { type: "string" }, details: { type: "array", items: { type: "object" } } } }
    }
  },
  paths: {
    "/payments/stripe": { post: { tags: ["Payments"], summary: "Initiate Stripe checkout", security: [{ bearerAuth: [] }], parameters: [{ name: "Idempotency-Key", in: "header", required: true, schema: { type: "string" } }], responses: { "200": { description: "Stripe session created" } } } },
    "/payments/stripe/verify": { post: { tags: ["Payments"], summary: "Verify Stripe payment", security: [{ bearerAuth: [] }], parameters: [{ name: "Idempotency-Key", in: "header", required: true, schema: { type: "string" } }], responses: { "200": { description: "Payment verified" } } } },
    "/payments/razorpay": { post: { tags: ["Payments"], summary: "Create Razorpay order", security: [{ bearerAuth: [] }], parameters: [{ name: "Idempotency-Key", in: "header", required: true, schema: { type: "string" } }], responses: { "200": { description: "Razorpay order created" } } } },
    "/payments/razorpay/verify": { post: { tags: ["Payments"], summary: "Verify Razorpay payment", security: [{ bearerAuth: [] }], parameters: [{ name: "Idempotency-Key", in: "header", required: true, schema: { type: "string" } }], responses: { "200": { description: "Payment verified" } } } },
    "/uploads/images": { post: { tags: ["Uploads"], summary: "Upload an image to Cloudinary", parameters: [{ name: "x-internal-key", in: "header", required: true, schema: { type: "string" } }], responses: { "200": { description: "Image uploaded" } } } }
  }
};
