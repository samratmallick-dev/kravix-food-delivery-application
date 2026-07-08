export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Kravix Auth Service",
    version: "1.0.0",
    description: "Authentication and user profile management"
  },
  servers: [{ url: "/api/v1" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" }
    },
    schemas: {
      SuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string" },
          data: { type: "object" },
          error: { type: "boolean", example: false }
        }
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" },
          error: { type: "boolean", example: true },
          code: { type: "string" },
          details: { type: "array", items: { type: "object", properties: { field: { type: "string" }, message: { type: "string" } } } }
        }
      }
    }
  },
  paths: {
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register with email and password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "201": { description: "Registration successful", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
          "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "409": { description: "Email already registered", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
        }
      }
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login with email and password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Login successful", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
          "401": { description: "Invalid credentials", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
        }
      }
    },
    "/auth/me": {
      get: {
        tags: ["Users"],
        summary: "Get authenticated user profile",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Profile retrieved", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
        }
      },
      patch: {
        tags: ["Users"],
        summary: "Update authenticated user profile",
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  image: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Profile updated", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } }
        }
      }
    },
    "/auth/me/role": {
      patch: {
        tags: ["Users"],
        summary: "Set user role",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["role"],
                properties: { role: { type: "string", enum: ["customer", "seller", "rider"] } }
              }
            }
          }
        },
        responses: {
          "200": { description: "Role updated", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } }
        }
      }
    }
  }
};
