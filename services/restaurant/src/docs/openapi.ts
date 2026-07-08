export const openApiSpec = {
  openapi: "3.1.0",
  info: { title: "Kravix Restaurant Service", version: "1.0.0", description: "Restaurant, menu, cart, orders, coupons, and reviews" },
  servers: [{ url: "/api/v1" }],
  components: {
    securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
    schemas: {
      SuccessResponse: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" }, data: { type: "object" }, error: { type: "boolean" } } },
      ErrorResponse: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" }, error: { type: "boolean" }, code: { type: "string" }, details: { type: "array", items: { type: "object", properties: { field: { type: "string" }, message: { type: "string" } } } } } }
    }
  },
  paths: {
    "/restaurants": { get: { tags: ["Restaurants"], summary: "Get nearest restaurants", security: [{ bearerAuth: [] }], responses: { "200": { description: "Restaurants list" } } }, post: { tags: ["Restaurants"], summary: "Register a restaurant", security: [{ bearerAuth: [] }], responses: { "201": { description: "Restaurant created" } } } },
    "/restaurants/me": { get: { tags: ["Restaurants"], summary: "Get my restaurant", security: [{ bearerAuth: [] }], responses: { "200": { description: "Restaurant profile" } } } },
    "/menu-items/search": { get: { tags: ["Menu"], summary: "Search menu items", security: [{ bearerAuth: [] }], parameters: [{ name: "q", in: "query", required: true, schema: { type: "string" } }], responses: { "200": { description: "Search results" } } } },
    "/menu-items/autocomplete": { get: { tags: ["Menu"], summary: "Autocomplete suggestions", security: [{ bearerAuth: [] }], parameters: [{ name: "q", in: "query", required: true, schema: { type: "string" } }, { name: "lat", in: "query", schema: { type: "number" } }, { name: "lng", in: "query", schema: { type: "number" } }], responses: { "200": { description: "Suggestions" } } } },
    "/cart": { get: { tags: ["Cart"], summary: "Get cart", security: [{ bearerAuth: [] }], responses: { "200": { description: "Cart contents" } } }, post: { tags: ["Cart"], summary: "Add to cart", security: [{ bearerAuth: [] }], responses: { "200": { description: "Item added" } } }, delete: { tags: ["Cart"], summary: "Clear cart", security: [{ bearerAuth: [] }], responses: { "204": { description: "Cart cleared" } } } },
    "/orders": { post: { tags: ["Orders"], summary: "Place an order", security: [{ bearerAuth: [] }], responses: { "201": { description: "Order placed" } } } },
    "/orders/me": { get: { tags: ["Orders"], summary: "Get my orders", security: [{ bearerAuth: [] }], responses: { "200": { description: "Orders list" } } } },
    "/coupons/apply": { post: { tags: ["Coupons"], summary: "Apply a coupon", security: [{ bearerAuth: [] }], responses: { "200": { description: "Coupon applied" } } } }
  }
};
