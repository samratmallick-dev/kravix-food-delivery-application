# Testing Patterns

**Analysis Date:** 2026-04-30

## Test Framework

**Status:** No testing framework is currently established in this codebase.

**Recommended Runner:**
- Vitest or Jest would be suitable for the microservices and React frontend.

## Test File Organization

**Future Pattern:**
- Recommended: `*.test.ts` alongside source files for unit tests.
- Recommended: `tests/integration/` for service-to-service integration tests.

## Mocking

**Status:** Not implemented.

**Recommendations:**
- Mock RabbitMQ channels during service testing.
- Mock MongoDB using `mongodb-memory-server`.
- Mock external APIs (Stripe, Razorpay, Cloudinary) in utility service tests.

## Coverage

**Status:** 0% (no tests present).

## Next Steps

1. Select a testing framework (Vitest recommended for its Vite integration).
2. Establish unit tests for core controllers in the `auth` and `restaurant` services.
3. Implement integration tests for the RabbitMQ event flow.

---

*Testing analysis: 2026-04-30*
*Update when test patterns change*
