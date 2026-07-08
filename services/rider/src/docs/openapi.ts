export const openApiSpec = {
  openapi: "3.1.0",
  info: { title: "Kravix Rider Service", version: "1.0.0", description: "Rider profiles, availability, tracking, and delivery" },
  servers: [{ url: "/api/v1" }],
  components: {
    securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
    schemas: {
      SuccessResponse: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" }, data: { type: "object" }, error: { type: "boolean" } } },
      ErrorResponse: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" }, error: { type: "boolean" }, code: { type: "string" }, details: { type: "array", items: { type: "object" } } } }
    }
  },
  paths: {
    "/riders": { post: { tags: ["Riders"], summary: "Register rider profile", security: [{ bearerAuth: [] }], responses: { "201": { description: "Rider registered" } } } },
    "/riders/me": { get: { tags: ["Riders"], summary: "Get my rider profile", security: [{ bearerAuth: [] }], responses: { "200": { description: "Rider profile" } } } },
    "/riders/me/availability": { patch: { tags: ["Riders"], summary: "Toggle availability", security: [{ bearerAuth: [] }], responses: { "200": { description: "Availability updated" } } } },
    "/riders/me/location": { patch: { tags: ["Riders"], summary: "Update live location", security: [{ bearerAuth: [] }], responses: { "200": { description: "Location updated" } } } },
    "/riders/me/earnings": { get: { tags: ["Riders"], summary: "Get earnings", security: [{ bearerAuth: [] }], responses: { "200": { description: "Earnings data" } } } },
    "/riders/orders/current": { get: { tags: ["Orders"], summary: "Get current delivery", security: [{ bearerAuth: [] }], responses: { "200": { description: "Current order" } } } },
    "/riders/orders/{orderId}/accept": { post: { tags: ["Orders"], summary: "Accept a delivery", security: [{ bearerAuth: [] }], parameters: [{ name: "orderId", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Order accepted" } } } }
  }
};
