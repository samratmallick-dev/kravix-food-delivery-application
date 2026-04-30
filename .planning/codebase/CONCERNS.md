# Codebase Concerns

**Analysis Date:** 2026-04-30

## Tech Debt

**Lack of Root Project Manifest:**
- Issue: No `package.json` at the project root to orchestrate multiple services.
- Impact: Developers must manually enter each service directory to run/install. Hard to implement workspace-wide linting or testing.
- Fix approach: Create a root `package.json` with `workspaces` (npm/yarn/pnpm) and scripts to run all services concurrently.

**Indentation Inconsistency:**
- Issue: Services use 6-space indentation (e.g., `services/admin/src/controllers/admin.controllers.ts`), while the client likely uses 2 spaces.
- Impact: Code reviews and collaborative editing become frustrating.
- Fix approach: Establish a project-wide `.prettierrc` and run a formatting pass.

**RabbitMQ Error Handling:**
- Issue: RabbitMQ connection failures exit the process or log an error but don't implement robust retry logic with backoff.
- Impact: Temporary network glitches during startup can cause services to crash or run without event processing capability.
- Fix approach: Implement a robust RabbitMQ connection utility with exponential backoff retries.

## Security Considerations

**Shared Internal Service Key:**
- Risk: The same `INTERNAL_SERVICE_KEY` is shared across all services for authentication. If one service is compromised, the entire internal network is exposed.
- Current mitigation: Key stored in `.env`.
- Recommendations: Use asymmetric signing (RS256) for inter-service auth or a service mesh for secure communication.

**Admin Credentials in Env:**
- Risk: Hardcoded `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`.
- Recommendations: Move admin user management to a database with hashed passwords.

## Performance Bottlenecks

**Serial Inter-service Calls:**
- Problem: Potential for synchronous HTTP call chains (Service A -> B -> C) which increase latency.
- Improvement path: Prefer RabbitMQ events for non-blocking operations. Use `Promise.all` for parallel inter-service calls where sync data is needed.

## Fragile Areas

**RabbitMQ Message Consumers:**
- Why fragile: Message parsing and error handling in consumers (e.g., `adminOrderConsumer.ts`) can be complex.
- Common failures: Unhandled message formats can cause the consumer to crash or stop acknowledging messages.
- Safe modification: Add Zod validation to all incoming message payloads.

## Missing Critical Features

**Automated Testing:**
- Problem: 0% test coverage across a distributed microservices system.
- Impact: High risk of regressions when refactoring or adding features.
- Priority: High.

## Test Coverage Gaps

**Inter-service Event Flow:**
- What's not tested: The full lifecycle of an order across Auth, Restaurant, Rider, and Realtime services.
- Risk: Order state can get out of sync without a reliable way to verify the entire flow.

---

*Concerns audit: 2026-04-30*
*Update as issues are fixed or new ones discovered*
