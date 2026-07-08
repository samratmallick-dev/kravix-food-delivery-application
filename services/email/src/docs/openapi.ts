export const openApiSpec = {
  openapi: "3.1.0",
  info: { title: "Kravix Email Service", version: "1.0.0", description: "Email notification service (RabbitMQ consumer)" },
  servers: [{ url: "/" }],
  components: {
    schemas: {
      SuccessResponse: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" }, data: { type: "object" }, error: { type: "boolean" } } }
    }
  },
  paths: {
    "/health": { get: { tags: ["Health"], summary: "Health check", responses: { "200": { description: "Service is up" } } } },
    "/ready": { get: { tags: ["Health"], summary: "Readiness probe", responses: { "200": { description: "Service is ready" }, "503": { description: "Service not ready" } } } }
  }
};
