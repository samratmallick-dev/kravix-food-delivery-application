# Architecture

**Analysis Date:** 2026-04-30

## Pattern Overview

**Overall:** Event-Driven Microservices Architecture

**Key Characteristics:**
- **Polyrepo-like Workspace:** Multiple independent services in a single root.
- **Service Isolation:** Each service has its own database connection and environment.
- **Event-Driven Communication:** RabbitMQ used for asynchronous inter-service coordination.
- **Real-time Updates:** Centralized Socket.IO service for pushing updates to the client.
- **React Frontend:** Modern Vite + React SPA with Context API for state management.

## Layers

**API Layer (Routes):**
- Purpose: Define endpoints and attach middleware.
- Contains: Route definitions, HTTP method mapping.
- Location: `services/*/src/routes/*.ts`
- Depends on: Controllers, Middleware.

**Controller Layer:**
- Purpose: Handle incoming requests, validate input, and orchestrate responses.
- Contains: Request handlers, error catching.
- Location: `services/*/src/controllers/*.ts`
- Depends on: Models, Utilities.

**Data Layer (Models):**
- Purpose: Define data schemas and interact with MongoDB.
- Contains: Mongoose schemas and models.
- Location: `services/*/src/model/*.ts` (or `models/`)

**Message Layer (Consumers):**
- Purpose: Handle asynchronous events from RabbitMQ.
- Contains: Event handlers, queue logic.
- Location: `services/*/src/config/*Consumer.ts`

## Data Flow

**Standard HTTP Request:**
1. Client makes request to a service (e.g., Auth Service).
2. Service Middleware validates JWT/Internal Key.
3. Route matches and calls Controller.
4. Controller interacts with Mongoose Model.
5. Controller returns response to Client.

**Async Event Processing:**
1. Service A publishes an event to RabbitMQ (e.g., `order_created`).
2. Service B (Consumer) listens for the event.
3. Service B processes the event (e.g., Restaurant Service accepts order).
4. Service B may emit a Socket.IO event via the Realtime Service to notify the Client.

**State Management:**
- **Backend:** Persistent state in MongoDB Atlas.
- **Frontend:** React Context API (`AppContext`, `SocketContext`, `AdminAuthContext`).

## Key Abstractions

**ConnectDb:**
- Purpose: Shared database connection pattern with timeout handling.
- Examples: `services/*/src/config/db/db.ts`

**RabbitMQ Connection:**
- Purpose: Persistent channel for event publishing/consumption.
- Examples: `services/*/src/config/rabbitmq.ts`

**Middleware Guards:**
- Purpose: Authenticate users and verify internal service-to-service calls.
- Examples: `services/*/src/middleware/auth.middleware.ts`

## Entry Points

**Microservices:**
- Location: `services/*/src/index.ts`
- Triggers: Node.js process start.
- Responsibilities: Initialize DB, RabbitMQ, and start Express server.

**Client Application:**
- Location: `client/src/main.tsx`
- Triggers: Browser page load.
- Responsibilities: Mount React app, initialize providers (Auth, Socket).

## Error Handling

**Strategy:** Middleware-based error handling and try/catch blocks in controllers.

**Patterns:**
- Services catch async errors and return structured JSON responses.
- Unhandled rejections and uncaught exceptions are caught at the entry point to prevent silent failures.

---

*Architecture analysis: 2026-04-30*
*Update when major patterns change*
