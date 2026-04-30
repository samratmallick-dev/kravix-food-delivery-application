# External Integrations

**Analysis Date:** 2026-04-30

## APIs & External Services

**Payment Processing:**
- Stripe - Subscription and one-time payments
  - SDK/Client: `stripe` ^20.4.1 (services/utilities), `@stripe/stripe-js` ^8.11.0 (client)
  - Auth: `STRIPE_SECRET_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`
- Razorpay - Indian payment gateway
  - SDK/Client: `razorpay` ^2.9.6 (services/utilities)

**File Storage:**
- Cloudinary - Image hosting for restaurant and dish images
  - SDK/Client: `cloudinary` ^2.9.0
  - Auth: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

**Maps:**
- Leaflet - Open-source maps for tracking
  - SDK/Client: `leaflet` ^1.9.4, `react-leaflet` ^5.0.0
  - Routing: `leaflet-routing-machine` ^3.2.12

## Data Storage

**Databases:**
- MongoDB Atlas - Primary data store (sharded/replica set detected)
  - Connection: via `MONGO_URI` env var
  - Client: `mongoose` ^8.x/9.x

**Messaging:**
- RabbitMQ - Inter-service communication
  - Connection: via `RABITMQ_URL` env var
  - Client: `amqplib` ^0.10.x
  - Queues: `payment_event`, `admin_event_queue`, `restaurant_order_queue`, etc.

## Authentication & Identity

**Auth Provider:**
- Custom JWT Auth - Primary authentication system
  - Implementation: `jsonwebtoken`, `bcryptjs`
  - Token storage: LocalStorage/Cookies (client-side)

**OAuth Integrations:**
- Google OAuth - Social sign-in
  - SDK: `@react-oauth/google` ^0.13.4
  - Credentials: `VITE_GOOGLE_CLIENT_ID` (client), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (services/auth)
  - Scopes: email, profile

## Monitoring & Observability

**Logs:**
- Console Logging - stdout/stderr

## CI/CD & Deployment

**Containerization:**
- Docker - All services have `Dockerfile`
  - Base Image: `node:20-alpine` (likely, based on patterns)

## Environment Configuration

**Development:**
- Required env vars: `MONGO_URI`, `RABITMQ_URL`, `JWT_SECRET`, `INTERNAL_SERVICE_KEY`
- Secrets location: `.env` files in each service directory (gitignored)

**Production:**
- Secrets management: Environment variables in container orchestration

## Webhooks & Callbacks

**Incoming:**
- Stripe Webhooks - Expected at `services/utilities/src/routes/payment.routes.ts`

**Outgoing:**
- Inter-service calls via RabbitMQ events

---

*Integration audit: 2026-04-30*
*Update when adding/removing external services*
