export const openApiSpec = {
  openapi: "3.1.0",
  info: { title: "Kravix Realtime Service", version: "1.0.0", description: "Socket.IO event routing (internal)" },
  servers: [{ url: "/api/v1" }],
  components: {
    schemas: {
      SuccessResponse: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" }, data: { type: "object" }, error: { type: "boolean" } } },
      ErrorResponse: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" }, error: { type: "boolean" }, code: { type: "string" }, details: { type: "array", items: { type: "object" } } } }
    }
  },
  paths: {
    "/socket/events": {
      post: {
        tags: ["Socket (Internal)"],
        summary: "Emit a Socket.IO event to a room",
        description: "Internal API — requires x-internal-key header",
        parameters: [{ name: "x-internal-key", in: "header", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["event", "room"], properties: { event: { type: "string" }, room: { type: "string" }, payload: { type: "object" } } } } } },
        responses: { "200": { description: "Event emitted" }, "403": { description: "Forbidden" } }
      }
    }
  }
};
