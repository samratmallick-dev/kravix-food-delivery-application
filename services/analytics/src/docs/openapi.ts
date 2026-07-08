export const openApiSpec = {
  openapi: "3.1.0",
  info: { title: "Kravix Analytics Service", version: "1.0.0", description: "Platform analytics and reporting" },
  servers: [{ url: "/api/v1" }],
  components: {
    securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
    schemas: {
      SuccessResponse: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" }, data: { type: "object" }, error: { type: "boolean" } } },
      ErrorResponse: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" }, error: { type: "boolean" }, code: { type: "string" }, details: { type: "array", items: { type: "object" } } } }
    }
  },
  paths: {
    "/analytics": { get: { tags: ["Analytics"], summary: "Get dashboard analytics", security: [{ bearerAuth: [] }], parameters: [{ name: "interval", in: "query", schema: { type: "string", enum: ["daily", "weekly", "monthly"] } }, { name: "startDate", in: "query", schema: { type: "string" } }, { name: "endDate", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Analytics data" } } } },
    "/analytics/export": { get: { tags: ["Analytics"], summary: "Export revenue trends as CSV", security: [{ bearerAuth: [] }], responses: { "200": { description: "CSV file", content: { "text/csv": {} } } } } }
  }
};
