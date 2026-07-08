export const openApiSpec = {
  openapi: "3.1.0",
  info: { title: "Kravix Admin Service", version: "1.0.0", description: "Platform administration and moderation" },
  servers: [{ url: "/api/v1" }],
  components: {
    securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
    schemas: {
      SuccessResponse: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" }, data: { type: "object" }, error: { type: "boolean" } } },
      ErrorResponse: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" }, error: { type: "boolean" }, code: { type: "string" }, details: { type: "array", items: { type: "object" } } } }
    }
  },
  paths: {
    "/admin/login": { post: { tags: ["Admin"], summary: "Admin login", responses: { "200": { description: "Login successful" }, "401": { description: "Invalid credentials" } } } },
    "/admin/dashboard": { get: { tags: ["Admin"], summary: "Get platform dashboard", security: [{ bearerAuth: [] }], responses: { "200": { description: "Dashboard data" } } } },
    "/admin/users": { get: { tags: ["Users"], summary: "List all users", security: [{ bearerAuth: [] }], responses: { "200": { description: "Users list" } } } },
    "/admin/users/{userId}/block": { patch: { tags: ["Users"], summary: "Block or unblock a user", security: [{ bearerAuth: [] }], parameters: [{ name: "userId", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "User block status updated" } } } },
    "/admin/restaurants/{restaurantId}/verify": { patch: { tags: ["Restaurants"], summary: "Verify a restaurant", security: [{ bearerAuth: [] }], parameters: [{ name: "restaurantId", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Restaurant verified" } } } },
    "/admin/riders/{riderId}/verify": { patch: { tags: ["Riders"], summary: "Verify a rider", security: [{ bearerAuth: [] }], parameters: [{ name: "riderId", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Rider verified" } } } },
    "/admin/orders/{orderId}/cancel": { patch: { tags: ["Orders"], summary: "Cancel an order", security: [{ bearerAuth: [] }], parameters: [{ name: "orderId", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Order cancelled" } } } }
  }
};
