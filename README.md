# 🍲 Kravix - Premium Online Food Delivery Application

[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-purple?logo=vite)](https://vite.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green?logo=nodedotjs)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-black?logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-ReplicaSet-green?logo=mongodb)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-Cache-red?logo=redis)](https://redis.io/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-Broker-orange?logo=rabbitmq)](https://www.rabbitmq.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-black?logo=socketdotio)](https://socket.io/)
[![Gemini](https://img.shields.io/badge/Gemini-AI_Search-blue?logo=google-gemini)](https://deepmind.google/technologies/gemini/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-blue?logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **"Be Smart, Eat Better"**
>
> **Kravix** is a premium, production-grade online food delivery application specializing in authentic Bengali, traditional Indian, and multi-cuisine dishes. Designed and developed as a university graduation capstone project, the system implements a modern **event-driven microservices architecture** on the backend and a highly responsive, feature-rich **React (TypeScript + Vite) Single Page Application (SPA)** on the frontend.

---

## 📖 Table of Contents

1. [🌟 Core Features](#-core-features)
2. [🛠️ Technology Stack](#️-technology-stack)
3. [📐 System Architecture](#-system-architecture)
4. [📁 Directory Structure](#-directory-structure)
5. [🔄 Key Event-Driven Workflows](#-key-event-driven-workflows)
6. [🤖 Gemini AI Search Normalizer](#-gemini-ai-search-normalizer)
7. [⚙️ Environment Variables Config](#️-environment-variables-config)
8. [🚀 Local Development Setup](#-local-development-setup)
9. [🌐 Production Deployment](#-production-deployment)
10. [🔒 Security & Performance Optimizations](#-security--performance-optimizations)
11. [🛰️ API Endpoint Reference](#️-api-endpoint-reference)
12. [🩺 Troubleshooting Guide](#-troubleshooting-guide)
13. [👥 Team Members & Credits](#-team-members--credits)
14. [📝 License](#-license)

---

## 🌟 Core Features

### 👨‍🍳 Customer App
*   **Intuitive Menu Browsing:** Filter by categories, dietary preferences (vegetarian/non-vegetarian), and cuisines (Bengali, Indian, Chinese, etc.).
*   **Advanced Search with AI:** Smart search bar featuring local spelling autocorrection, synonyms expansion, Bengali word mapping, and Gemini AI-backed intent mapping.
*   **Geospatial Boundaries:** Automated location-access requests calculating exact delivery distances and dynamic delivery charges between the customer and the restaurant.
*   **Secure Payment Integration:** Integrated checkout supporting **Stripe** and **Razorpay** gateways, alongside standard Cash on Delivery (COD) workflows.
*   **Real-time Order Tracking:** Live interactive map tracking and visual progress timelines receiving instant status updates via WebSocket rooms.
*   **Promo System & Reviews:** Interactive review and rating system per order, coupled with automated coupon code checks.

### 🏢 Restaurant Panel
*   **Catalog & Menu Management:** Add, edit, or delete dishes, adjust pricing, and toggle item availability (which synchronizes instantly across connected clients).
*   **Active Order Dispatcher:** Visual dashboard showing incoming orders categorised by status (`placed`, `preparing`, `ready`, `picked_up`, `delivered`).
*   **Sales Analytics:** Detailed business reports tracking total revenue, order count metrics, and visualizations of top-selling dishes via charts.
*   **Profile Moderation:** Toggle restaurant active status and request verified status approvals from administrators.

### 🏍️ Rider Dispatch Tracker
*   **Status Toggles:** Easy online/offline status switch that controls if the rider can receive automated delivery dispatches.
*   **Geospatial Dispatch Matching:** Dynamic lookup engine matching newly-readied orders to the nearest online riders within a defined search radius.
*   **OTP-Verified Handoff:** Secure order handoff matching unique verification OTPs generated on the customer's device to verify delivery.
*   **Earnings & Route View:** Real-time earnings dashboard with charts showing weekly performance, and detailed delivery timeline records.

### 👑 Central Admin Console
*   **Moderation Panel:** Approve verification requests for newly registered restaurants and restrict or block malicious user accounts.
*   **Central Financial Aggregator:** Track total application sales, active delivery margins, and operational metrics.
*   **Global Systems Metrics:** Live monitoring logs and aggregated server analytics reporting.

---

## 🛠️ Technology Stack

| Layer | Technologies Used | Description |
| :--- | :--- | :--- |
| **Frontend Core** | React 19/18, TypeScript, Vite | Component-driven Single Page Application (SPA). |
| **Styling** | Vanilla CSS, Tailwind CSS (v4) | Curated dark mode & premium responsive layouts. |
| **State & Router** | React Router DOM v6, React Context | Unified AppContext (auth/roles) & SocketContext. |
| **Maps & Charts** | Recharts, Leaflet | Geospatial route maps and rich analytical graphs. |
| **Backend Core** | Node.js, Express, TypeScript | Clean Architecture / DDD, strict Zod validators. |
| **Database** | MongoDB (Mongoose) | Geospatial index queries (`2dsphere`) & Replica Sets. |
| **Caching** | Redis | High-speed cache queries (cart states, configurations). |
| **Message Broker** | RabbitMQ (AMQP Protocol) | Asynchronous cross-service event-driven tasks. |
| **Realtime** | Socket.io | WebSocket server managing user-specific socket rooms. |
| **AI Integration** | Google Generative AI (`gemini-2.0-flash`) | Natural language search correction and query cleaning. |
| **Cloud Utilities** | Cloudinary API, Gmail OAuth2 | Media storage uploads and async mail transactions. |

---

## 📐 System Architecture

Kravix is built on an **event-driven microservices architecture**. Communication between the frontend React client and backend services is handled via REST APIs (orchestrated through a unified HTTP Client) and real-time WebSockets (Socket.io). Inter-service communications are mediated asynchronously through **RabbitMQ** or synchronously via secure HTTP calls using an **Internal Service Key**.

```mermaid
graph TD
    %% Clients
    Client[React Frontend <br> Port 5173]

    %% Realtime Socket Server
    Realtime[Realtime Service <br> Port 9999 <br> Socket.io]

    %% Microservices Gateway/Endpoints
    AuthService[Auth Service <br> Port 8000]
    RestService[Restaurant Service <br> Port 9000]
    RiderService[Rider Service <br> Port 7000]
    UtilService[Utilities Service <br> Port 8888]
    AdminService[Admin Service <br> Port 6001]
    AnalyticsService[Analytics Service <br> Port 6002]
    EmailService[Email Service <br> Port 8100]

    %% Shared Infrastructures
    MongoDB[(MongoDB Replica Set)]
    Redis[(Redis Cache)]
    RabbitMQ{RabbitMQ Broker}

    %% Client Interactions
    Client -.->|WebSocket| Realtime
    Client -->|HTTP / Custom apiClient| AuthService
    Client -->|HTTP / Custom apiClient| RestService
    Client -->|HTTP / Custom apiClient| RiderService
    Client -->|HTTP / Custom apiClient| UtilService
    Client -->|HTTP / Custom apiClient| AdminService
    Client -->|HTTP / Custom apiClient| AnalyticsService

    %% Service to Database Connections
    AuthService --> MongoDB
    RestService --> MongoDB
    RiderService --> MongoDB
    AdminService --> MongoDB
    AnalyticsService --> MongoDB

    %% Service to Redis Caching
    RestService --> Redis
    RiderService --> Redis
    AnalyticsService --> Redis

    %% Real-time Socket Event Publishing (Internal API calls)
    AuthService -->|HTTP POST + Internal Key| Realtime
    RestService -->|HTTP POST + Internal Key| Realtime
    RiderService -->|HTTP POST + Internal Key| Realtime
    AdminService -->|HTTP POST + Internal Key| Realtime

    %% RabbitMQ Queues
    AuthService -->|Publish email_queue| RabbitMQ
    RestService -->|Publish order_ready_queue| RabbitMQ
    RestService -->|Publish rider_queue| RabbitMQ
    RestService -->|Publish admin_event_queue| RabbitMQ
    UtilService -->|Publish payment_event| RabbitMQ
    
    RabbitMQ -->|Consume email_queue| EmailService
    RabbitMQ -->|Consume payment_event| RestService
    RabbitMQ -->|Consume order_ready_queue| RiderService
    RabbitMQ -->|Consume rider_queue| RiderService
    RabbitMQ -->|Consume admin_event_queue| AnalyticsService
```

---

## 📁 Directory Structure

The repository is structured as a monorepo containing the React application in `client/` and individual microservices in `services/`.

```
kravix-online-food-delivery-application/
├── client/                      # React frontend source
│   ├── public/                  # Static assets and crawler configs
│   ├── src/                     # React application source code
│   │   ├── assets/              # SVGs, animations, local placeholders
│   │   ├── components/          # Reusable visual components
│   │   │   ├── common/          # Modals, loading boundaries, SEO meta
│   │   │   ├── layout/          # Navigation panels, sidebar headers
│   │   │   └── ui/              # Buttons, inputs, inputs, filters
│   │   ├── constants/           # Route arrays, API endpoints, role lists
│   │   ├── context/             # Global contexts (Auth, WebSocket listeners)
│   │   ├── features/            # Feature bundles (customer, admin, rider, etc.)
│   │   ├── hooks/               # Custom hooks (location, responsive, etc.)
│   │   ├── pages/               # Page layouts grouped by user role
│   │   ├── services/            # Custom API client & API wrappers
│   │   └── utils/               # Secure local storage, distance calculators
│   ├── vercel.json              # Vercel hosting router configurations
│   └── vite.config.ts           # Vite bundler, CSS and alias configs
├── services/                    # Microservices folder
│   ├── admin/                   # Operations panel dashboard
│   ├── analytics/               # System financial metrics and audits
│   ├── auth/                    # JWT sessions, registration, and Google OAuth
│   ├── email/                   # Asynchronous Gmail consumer worker
│   ├── realtime/                # Socket.io notification broker
│   ├── restaurant/              # Menu catalogs, carts, coupons, reviews, orders
│   ├── rider/                   # Dispatch matcher and geolocation updates
│   └── utilities/               # Payments (Razorpay/Stripe) and Cloudinary uploads
├── start-dev.js                 # Dev multi-process launch script
├── kravix-rabbitmq.pem          # TLS Certificates for secure RabbitMQ connections
├── kravix-radis.pem             # TLS Certificates for secure Redis connections
└── private.md                   # Bot mock assertions for test suites
```

### Microservice Code Layout (Clean Architecture & Domain Driven Design)
Backend services (`auth`, `restaurant`, `rider`, etc.) share a unified structure:
```
services/<service_name>/src/
├── app.ts                       # Express middleware, cors setup, error handlers
├── index.ts                     # Database startup, RabbitMQ hook-up, listening ports
├── config/                      # Database links, RabbitMQ channels, Redis clients
├── constants/                   # HTTP errors, local messages, route names
├── controllers/                 # Express requests extractor, response codes mapping
├── domain/                      # Domain entities representing database records
├── dto/                         # Data Transfer Objects sanitizing user inputs
├── events/                      # RabbitMQ publishers and event class blueprints
├── interfaces/                  # Repositories & services abstractions contracts
├── mappers/                     # Database schemas mapping to Domain models
├── middleware/                  # JWT filters, correlation ID generators, rate limiters
├── model/                       # Mongoose database schema declarations
├── repositories/                # Direct database read/write queries
├── routes/                      # Route endpoint paths bindings
├── services/                    # Domain core business rules and logic execution
├── utils/                       # JWT triggers, geolocation maths, string handlers
├── validators/                  # Zod request validators matching schemas
└── workers/                     # RabbitMQ listeners consuming queued jobs
```

---

## 🔄 Key Event-Driven Workflows

### 💳 1. Asynchronous Payment & Order Placement Flow
When a customer pays for an order, the transaction is processed by the **Utilities Service** (handling Stripe or Razorpay) and executed asynchronously via RabbitMQ to update order statuses and trigger caches.

```
[React Client] ---> 1. POST /payments/stripe (Utilities Port 8888)
                       |
                       v (Stripe Card Charge Success)
[Utilities]   ---> 2. Publish PAYMENT_SUCCESS to RabbitMQ "payment_event" queue
                       |
                       v (Consumed asynchronously)
[Restaurant]  ---> 3. Updates Order Status in MongoDB ("placed")
              ---> 4. Increments Coupon utilization counter
              ---> 5. Publishes ORDER_PLACED to RabbitMQ "admin_event_queue"
              ---> 6. Triggers POST request to Realtime Service (Port 9999)
                       |
                       v (Real-time Socket Update)
[Realtime]    ---> 7. Emits "order:placed" event to Restaurant Room
                       |
                       v (Consumed asynchronously)
[Analytics]   ---> 8. Clears financial and revenue data cache records
```

### 🏍️ 2. Order Ready & Geospatial Rider Dispatch Flow
Once the restaurant marks the order as prepared, the system automatically checks for nearby delivery agents using geospatial search queries.

```
[Restaurant Panel] ---> 1. PATCH /orders/:id/status ("ready")
                       ---> 2. Publish ORDER_READY_FOR_RIDER to RabbitMQ "order_ready_queue"
                             |
                             v (Consumed asynchronously)
[Rider Service]    ---> 3. Execute geospatial search in MongoDB (find available riders
                             within `RIDER_SEARCH_RADIUS_METERS` from restaurant coords)
                       ---> 4. Send socket dispatch trigger requests to Realtime Service
                             |
                             v (WebSocket notification broadcast)
[Realtime Service] ---> 5. Emits "order:available" via WebSockets to Rider socket rooms (`Rider:${userId}`)
```

### 🛜 3. WebSockets Socket Room Configuration (`services/realtime/src/config/socket.ts`)
To keep alerts isolated and secure, users are placed into dedicated rooms upon WebSocket verification:
*   `User:${userId}`: Receives personal status updates (e.g., transitions to `placed`, `preparing`, `picked_up`, `delivered`).
*   `Restaurant:${restaurantId}`: Receives incoming order dispatches and item sync updates.
*   `Rider:${riderId}`: Receives immediate location-based delivery opportunities.
*   `Admin`: Global administrative monitor channel.

---

## 🤖 Gemini AI Search Normalizer

To deliver a premium search experience, Kravix integrates **Gemini AI** (`gemini-2.0-flash`) in the backend to normalize user search queries, combined with high-speed local processing for immediate responses.

```
                  ┌─────────────────────────────┐
                  │   User Query (e.g. "foove")  │
                  └──────────────┬──────────────┘
                                 │
                                 v
                  ┌─────────────────────────────┐
                  │    Local Synonyms Check     │
                  └──────────────┬──────────────┘
                                 ├───────────► Matches? ──► Return Local Match
                                 │
                                 v
                  ┌─────────────────────────────┐
                  │  Bengali-to-English Map     │
                  └──────────────┬──────────────┘
                                 ├───────────► Matches? ──► Recommend Special Dishes
                                 │
                                 v
                  ┌─────────────────────────────┐
                  │  Fuzzy Spelling Correction  │
                  └──────────────┬──────────────┘
                                 ├───────────► Matches? ──► Return Corrected Word
                                 │
                                 v
                  ┌─────────────────────────────┐
                  │   Call Gemini AI API        │
                  │   (Timeout Limit: 3000ms)   │
                  └──────────────┬──────────────┘
                                 │
                                 ├───────────► Success?  ──► Return AI Corrected Word
                                 │
                                 └───────────► Timeout?  ──► Fallback to Original Input
```

### ⚙️ Implementation Details (`services/restaurant/src/utils/searchNormalizer.ts`)
1.  **Local Synonyms & Typo Dictionary**: Corrects common food search typos instantly (e.g., `biriyani` -> `biryani`, `piza` -> `pizza`, `buger` -> `burger`).
2.  **Bengali Language Interpreter**: Maps traditional names of food items to English keywords (e.g., `bhat` -> `rice`, `dal` -> `lentils`, `mach` -> `fish`, `mangsho` -> `mutton`).
3.  **Gemini API Fallback**: Queries containing multiple complex typos or ambiguous words invoke `gemini-2.0-flash` with a 3-second timeout limit to maintain quick response times.

---

## ⚙️ Environment Variables Config

Create `.env` files in the client directory and each microservice directory as specified below:

### 📱 Client (`client/.env`)
```env
VITE_API_URL_AUTH=http://localhost:8000/api/v1/auth
VITE_API_URL_RESTAURANT=http://localhost:9000/api/v1/restaurants
VITE_API_URL_MENU=http://localhost:9000/api/v1/menu-items
VITE_API_URL_CART=http://localhost:9000/api/v1/cart
VITE_API_URL_ADDRESS=http://localhost:9000/api/v1/addresses
VITE_API_URL_ORDER=http://localhost:9000/api/v1/orders
VITE_API_URL_PAYMENT=http://localhost:8888/api/v1/payments
VITE_API_URL_CLOUDINARY=http://localhost:8888/api/v1/uploads
VITE_API_URL_REALTIME_SOCKET=http://localhost:9999
VITE_API_URL_RIDER=http://localhost:7000/api/v1/riders
VITE_API_URL_ADMIN=http://localhost:6001/api/v1/admin
VITE_API_URL_ANALYTICS=http://localhost:6002/api/v1/analytics
VITE_COUPON_BASE_URL=http://localhost:9000/api/v1/coupons
VITE_REVIEW_BASE_URL=http://localhost:9000/api/v1/reviews
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_yourStripePublishableKey
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_INTERNAL_KEY=your_kravix_internal_secret_key
SITE_URL=http://localhost:5173
```

---

### 🛡️ Auth Service (`services/auth/.env`)
```env
PORT=8000
ALLOWED_ORIGINS=http://localhost:5173,https://kravix-nu.vercel.app
MONGO_URI=mongodb://your_db_user:your_db_password@your_mongodb_cluster_address/your_db_name?replicaSet=your_replica_set&authSource=admin&tls=true
DB_NAME=kravix_db
JWT_SECRET=your_jwt_signing_secret_key
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
RABITMQ_URL=amqp://your_rabbitmq_user:your_rabbitmq_password@your_rabbitmq_host:5672
AUTH_EVENT_QUEUE=auth_event_queue
REALTIME_SOCKET_SERVICE_URI=http://localhost:9999
INTERNAL_SERVICE_KEY=your_kravix_internal_secret_key
EMAIL_QUEUE=email_queue
```

---

### 🍕 Restaurant Service (`services/restaurant/.env`)
```env
PORT=9000
ALLOWED_ORIGINS=http://localhost:5173,https://kravix-nu.vercel.app
MONGO_URI=mongodb://your_db_user:your_db_password@your_mongodb_cluster_address/your_db_name?replicaSet=your_replica_set&authSource=admin&tls=true
DB_NAME=kravix_db
JWT_SECRET=your_jwt_signing_secret_key
INTERNAL_SERVICE_KEY=your_kravix_internal_secret_key
RABITMQ_URL=amqp://your_rabbitmq_user:your_rabbitmq_password@your_rabbitmq_host:5672
PAYMENT_QUEUE=payment_event
ORDER_READY_QUEUE=order_ready_queue
RIDER_QUEUE=rider_queue
ADMIN_EVENT_QUEUE=admin_event_queue
RESTAURANT_ADMIN_EVENT_QUEUE=restaurant_admin_event_queue
UTILS_SERVICE_URI=http://localhost:8888
REALTIME_SOCKET_SERVICE_URI=http://localhost:9999
REDIS_URL=redis://your_redis_host:6379
GEMINI_API_KEY=your_gemini_generative_ai_api_key
REQUIRE_LOCATION_REAPPROVAL=true
```

---

### 🏍️ Rider Service (`services/rider/.env`)
```env
PORT=7000
ALLOWED_ORIGINS=http://localhost:5173,https://kravix-nu.vercel.app
MONGO_URI=mongodb://your_db_user:your_db_password@your_mongodb_cluster_address/your_db_name?replicaSet=your_replica_set&authSource=admin&tls=true
DB_NAME=kravix_db
JWT_SECRET=your_jwt_signing_secret_key
INTERNAL_SERVICE_KEY=your_kravix_internal_secret_key
RABITMQ_URL=amqp://your_rabbitmq_user:your_rabbitmq_password@your_rabbitmq_host:5672
ORDER_READY_QUEUE=order_ready_queue
RIDER_QUEUE=rider_queue
RIDER_SEARCH_RADIUS_METERS=10000
RESTAURANT_SERVICE_URI=http://localhost:9000
UTILS_SERVICE_URI=http://localhost:8888
REALTIME_SOCKET_SERVICE_URI=http://localhost:9999
REDIS_URL=redis://your_redis_host:6379
```

---

### 💳 Utilities Service (`services/utilities/.env`)
```env
PORT=8888
ALLOWED_ORIGINS=http://localhost:5173,https://kravix-nu.vercel.app
CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret
INTERNAL_SERVICE_KEY=your_kravix_internal_secret_key
JWT_SECRET=your_jwt_signing_secret_key
RAZORPAY_API_KEY=your_razorpay_api_key
RAZORPAY_API_KEY_SECRET=your_razorpay_api_secret
STRIPE_SECRET_KEY=sk_test_yourStripeSecretKey
RABITMQ_URL=amqp://your_rabbitmq_user:your_rabbitmq_password@your_rabbitmq_host:5672
PAYMENT_QUEUE=payment_event
RESTAURANT_BASE_URL=http://localhost:9000
CLIENT_URL=http://localhost:5173
```

---

### 🛜 Realtime Service (`services/realtime/.env`)
```env
PORT=9999
ALLOWED_ORIGINS=http://localhost:5173,https://kravix-nu.vercel.app
JWT_SECRET=your_jwt_signing_secret_key
INTERNAL_SERVICE_KEY=your_kravix_internal_secret_key
```

---

### 👑 Admin Service (`services/admin/.env`)
```env
PORT=6001
ALLOWED_ORIGINS=http://localhost:5173,https://kravix-nu.vercel.app
MONGO_URI=mongodb://your_db_user:your_db_password@your_mongodb_cluster_address/your_db_name?replicaSet=your_replica_set&authSource=admin&tls=true
DB_NAME=kravix_db
JWT_SECRET=your_jwt_signing_secret_key
INTERNAL_SERVICE_KEY=your_kravix_internal_secret_key
ADMIN_EMAIL=admin@kravix.dev
ADMIN_PASSWORD=your_secure_admin_password
REALTIME_SOCKET_SERVICE_URI=http://localhost:9999
RABITMQ_URL=amqp://your_rabbitmq_user:your_rabbitmq_password@your_rabbitmq_host:5672
PAYMENT_QUEUE=payment_event
ADMIN_EVENT_QUEUE=admin_event_queue
RESTAURANT_ADMIN_EVENT_QUEUE=restaurant_admin_event_queue
```

---

### 📊 Analytics Service (`services/analytics/.env`)
```env
PORT=6002
ALLOWED_ORIGINS=http://localhost:5173,https://kravix-nu.vercel.app
MONGO_URI=mongodb://your_db_user:your_db_password@your_mongodb_cluster_address/your_db_name?replicaSet=your_replica_set&authSource=admin&tls=true
DB_NAME=kravix_db
JWT_SECRET=your_jwt_signing_secret_key
INTERNAL_SERVICE_KEY=your_kravix_internal_secret_key
RABITMQ_URL=amqp://your_rabbitmq_user:your_rabbitmq_password@your_rabbitmq_host:5672
ADMIN_EVENT_QUEUE=admin_event_queue
REDIS_URL=redis://your_redis_host:6379
```

---

### ✉️ Email Service (`services/email/.env`)
```env
PORT=8100
RABBITMQ_URL=amqp://your_rabbitmq_user:your_rabbitmq_password@your_rabbitmq_host:5672
EMAIL_QUEUE=email_queue
CLIENT_URL=http://localhost:5173
GMAIL_CLIENT_ID=your_google_gmail_client_id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your_google_gmail_client_secret
GMAIL_REFRESH_TOKEN=your_google_gmail_oauth_refresh_token
GMAIL_REDIRECT_URI=http://localhost
EMAIL_FROM_ADDRESS=support@kravix.com
EMAIL_FROM_NAME=Kravix
```

---

## 🚀 Local Development Setup

Follow these steps to run the application locally on your machine:

### 📋 Prerequisites
*   **Node.js**: `v20.x` or later installed.
*   **MongoDB**: Run a local instance or configure an Atlas cluster.
*   **Redis**: Install local Redis server or run via Docker.
*   **RabbitMQ**: Configure standard AMQP broker.

---

### ⚙️ Docker Setup for Prerequisites
For a quick local start, spin up Redis and RabbitMQ using Docker:
```bash
# Start a Redis instance
docker run -d --name kravix-redis -p 6379:6379 redis:alpine

# Start a RabbitMQ broker with management console
docker run -d --name kravix-rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

---

### 🛠️ Setting up the Application
1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/samratmallick-dev/kravix-food-delivery-application.git
    cd kravix-online-food-delivery-application
    ```

2.  **Install Node Modules**:
    Run install commands inside the client and every microservice folder (or execute the monorepo helper script):
    ```bash
    # Client dependencies
    cd client && npm install && cd ..

    # Backend Services dependencies
    cd services/auth && npm install && cd ../..
    cd services/restaurant && npm install && cd ../..
    cd services/rider && npm install && cd ../..
    cd services/utilities && npm install && cd ../..
    cd services/realtime && npm install && cd ../..
    cd services/admin && npm install && cd ../..
    cd services/analytics && npm install && cd ../..
    cd services/email && npm install && cd ../..
    ```

3.  **Configure Environment Variables**:
    Create `.env` files in each service directory and inside the `client/` folder as detailed in the [Environment Variables](#-environment-variables-config) section.

4.  **Run with the Dev Orchestrator**:
    Start the entire microservices ecosystem along with the React client simultaneously using the development orchestrator script:
    ```bash
    node start-dev.js
    ```
    This script launches child processes for all services and redirects color-coded terminal outputs to your console.

---

## 🌐 Production Deployment

### 💻 Client Deployment (Vercel)
The React SPA is configured for Vercel. Ensure your deploy setup rewrites all wildcard paths to `index.html` to allow React Router to handle page updates:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### 🗄️ Backend Microservices (Render / AWS / Docker)
Each backend service includes a `Dockerfile` for containerization.
1.  **Production Builds**:
    Run `npm run build` to compile TypeScript to Javascript in `dist/`.
2.  **TLS Configurations**:
    For secure, production-grade cloud databases (e.g., Redis Enterprise or RabbitMQ Cloud clusters), reference TLS credential files located in the project root:
    *   `kravix-rabbitmq.pem` (TLS authorization credential for RabbitMQ)
    *   `kravix-radis.pem` (TLS connection certificate for Redis instances)

### 🤖 CI/CD Deployment Pipeline (`.github/workflows/docker-build-push.yml`)
The project utilizes GitHub Actions workflows to automatically test, build, and push Docker images to registries upon merges to production branch:
*   Triggered on commits to `main` or release tags.
*   Authenticates with DockerHub or AWS ECR.
*   Compiles services and packs individual Docker images for each microservice.

---

## 🔒 Security & Performance Optimizations

*   **Secure API Requests (`client/src/services/apiClient.ts`)**:
    *   **Auto-Authorization**: Automatically injects JWT Bearer tokens from localStorage.
    *   **Request Deduplication**: Uses a `pendingRequests` Map to group and throttle concurrent identical requests, preventing duplicate queries.
    *   **Correlation IDs**: Injects `X-Request-ID` and `X-Correlation-ID` headers to trace request flows across backend microservices.
    *   **Auto-Retry**: Implements exponential backoff ($2^{attempt} \times 300\text{ms}$) to retry failing requests (HTTP status $\ge 500$).
*   **Encrypted Storage**: The React client uses secure encryption utilities (`secureStorage.ts`) to store sensitive user session data locally.
*   **Redis Caching**:
    *   Caches restaurant menus, geographical boundary calculations, and analytical reports.
    *   Reduces database query overhead by serving hot data directly from memory.
*   **Rate Limiting & CORS**: Express applications use custom rate limiters and strict CORS origins mapping (restricting requests strictly to the React client domain).

---

## 🛰️ API Endpoint Reference

| Service | HTTP Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/v1/auth/register` | Register customer/restaurant/rider | No |
| **Auth** | `POST` | `/api/v1/auth/login` | Authenticate and issue JWT token | No |
| **Auth** | `POST` | `/api/v1/auth/google` | Google Single Sign-On OAuth | No |
| **Restaurant**| `GET` | `/api/v1/restaurants/nearest` | Geospatial query for closest partners | Yes |
| **Restaurant**| `GET` | `/api/v1/menu-items` | Fetch all menu cards | Yes |
| **Restaurant**| `POST` | `/api/v1/orders` | Create a new pending order transaction| Yes |
| **Rider** | `PUT` | `/api/v1/riders/me/availability`| Toggle rider availability status | Yes (Rider) |
| **Rider** | `POST` | `/api/v1/riders/dispatch/verify`| OTP verification on order handoff | Yes (Rider) |
| **Utilities** | `POST` | `/api/v1/payments/stripe` | Create Stripe transaction session | Yes |
| **Utilities** | `POST` | `/api/v1/uploads/images` | Upload image assets to Cloudinary | Yes |
| **Admin** | `POST` | `/api/v1/admin/restaurants/approve`| Approve restaurant applications | Yes (Admin) |
| **Analytics** | `GET` | `/api/v1/analytics/dashboard` | Fetch global financial logs | Yes (Admin) |

---

## 🩺 Troubleshooting Guide

### 🔴 1. RabbitMQ Connection Retries Failure
*   **Issue**: Backend microservices fail to connect to RabbitMQ broker and crash on startup.
*   **Solution**: Ensure your RabbitMQ server is running. If running locally, check if username/password credentials match `amqp://admin:admin123@localhost:5672`. In production, confirm TLS settings and path to `kravix-rabbitmq.pem`.

### 🟡 2. Redis Connection Refused
*   **Issue**: Restaurant and Analytics services log Redis error warnings.
*   **Solution**: Start your local Redis server using command `redis-server` or confirm container configurations. Make sure the port matches the configuration in `.env` (`6379`).

### 🔵 3. Geolocation Permission Denied
*   **Issue**: Customer application fails to retrieve restaurants list or lists zero nearest eateries.
*   **Solution**: Kravix needs browser geolocation permissions. Check browser address bar settings to allow site location permissions. If testing on localhost, verify browser rules for mock GPS positions.

---

## 👥 Team Members & Credits

This application was developed by the following project team members:

| Avatar | Name | Roll Number | Registration Number | Primary Roles & Contributions | Links |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **SM** | **Samrat Mallick** | `28100122019` | `222810110089` | Team Lead, Full Stack Developer, Database Design & Microservices Orchestration, Component Architecture, Layout Styling & API Integration | [<img src="https://img.shields.io/badge/GitHub-black?logo=github"/>](https://github.com/samratmallick-dev) <br> [<img src="https://img.shields.io/badge/LinkedIn-blue?logo=linkedin"/>](https://www.linkedin.com/in/samrat-mallick01) |
| **SC** | **Shubhranil Chowdhury**| `28100122046` | `222810110096` | Frontend Developer| [<img src="https://img.shields.io/badge/GitHub-black?logo=github"/>](https://github.com/shubhranil1) <br> [<img src="https://img.shields.io/badge/LinkedIn-blue?logo=linkedin"/>](https://www.linkedin.com/in/shubhranil-chowdhury) |
| **TG** | **Tanushri Ghosh** | `28100122007` | `222810110118` | Tech Documentation, Presentation | [<img src="https://img.shields.io/badge/GitHub-black?logo=github"/>](https://github.com/tanushri396815) <br> [<img src="https://img.shields.io/badge/LinkedIn-blue?logo=linkedin"/>](https://www.linkedin.com/in/tanushri-ghosh1/) |
| **AKD**| **Arup Kumar Das** | `28100122071` | `222810110063` |Lead Frontend Developer, UI/UX Designer, Visual Layout Mockups, Branding & Color Palette Audits | [<img src="https://img.shields.io/badge/GitHub-black?logo=github"/>](https://github.com/ArupKumarDas-Dev) <br> [<img src="https://img.shields.io/badge/LinkedIn-blue?logo=linkedin"/>](https://www.linkedin.com/in/arup-kumar-das-85952a273) |
| **SB** | **Soumyajit Barick** | `28100122016` | `222810110103` | Tech Documentation, Presentation | [<img src="https://img.shields.io/badge/GitHub-black?logo=github"/>](https://github.com/Soumyajit1608) <br> [<img src="https://img.shields.io/badge/LinkedIn-blue?logo=linkedin"/>](https://www.linkedin.com/in/soumyajit-barick-113a47253) |

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](License) file for details.

---

<p align="center">Made with ❤️ for Graduation Project 2026</p>
