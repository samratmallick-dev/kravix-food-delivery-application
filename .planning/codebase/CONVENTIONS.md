# Coding Conventions

**Analysis Date:** 2026-04-30

## Naming Patterns

**Files:**
- `kebab-case.ts` for modules and utilities.
- `*.controllers.ts` (plural) for controller files.
- `*.routes.ts` (plural) for route files.
- `*.model.ts` (singular) for Mongoose model files.
- `PascalCase.tsx` for React components in the client.

**Functions:**
- `camelCase` for all functions (e.g., `adminLogin`, `connectDb`).
- No special prefix for async functions.
- `handleEventName` for client-side event handlers.

**Variables:**
- `camelCase` for variables.
- `UPPER_SNAKE_CASE` for constants (e.g., `PORT`, `JWT_SECRET`).
- `_id` used for MongoDB identifiers.

**Types:**
- `PascalCase` for interfaces and type aliases.
- Explicit type casting for environment variables (`as string`).

## Code Style

**Formatting:**
- Indentation: 6 spaces (Backend), 2 spaces (Frontend).
- Quotes: Double quotes for strings.
- Semicolons: Required.
- Braces: Same-line opening braces.

**Indentation Note:**
- The backend services appear to use a 6-space indentation style (detected in `admin.controllers.ts`).
- The frontend client uses standard 2-space indentation.

## Import Organization

**Order:**
1. External packages (express, mongoose, react).
2. Internal absolute imports (`../middleware/TryCatchHandler.js`).
3. Relative imports.

**Extensions:**
- Backend imports MUST include the `.js` extension (e.g., `import { app } from "./app.js";`) due to `NodeNext` module resolution.

## Error Handling

**Patterns:**
- **Higher-Order Wrapper:** `TryCatch` wrapper used for Express controllers to catch async errors automatically.
- **Structured Responses:** All API responses follow the pattern:
  ```json
  {
    "success": boolean,
    "message": string,
    "error": boolean,
    "data": object | null
  }
  ```

## Logging

**Framework:**
- `console.log` for standard info.
- `console.error` for error conditions.
- Prefixed logs: `[Admin Service]: Message`.

## Comments

**When to Comment:**
- Explain business logic and integration points.
- Annotate RabbitMQ consumer logic.

## Function Design

**Return Values:**
- Explicitly return Express response objects (`return res.status(200)...`).
- Early returns for guard clauses (e.g., validation failures).

---

*Convention analysis: 2026-04-30*
*Update when patterns change*
