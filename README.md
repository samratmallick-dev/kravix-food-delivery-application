<p align="center">
  <img src="./client/public/apple-touch-icon.png" width="20%" alt="Kravix Logo" />
</p>

<h1 align="center">🍛 Kravix — Be Smart, Eat Better</h1>
<p align="center">
  <em>🍔 Craving something delicious? Let's eat again! A production-grade, event-driven online food delivery web application built with a modern TypeScript monorepo architecture.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-99.3%25-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/License-MIT-22c55e?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/Architecture-Microservices-8B5CF6?style=flat-square" alt="Architecture" />
  <img src="https://img.shields.io/badge/Node.js-22-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white" alt="CI/CD" />
</p>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Project Architecture](#-project-architecture)
- [Folder Structure](#-folder-structure)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Screenshots](#-screenshots)
- [Installation Guide](#-installation-guide)
- [Environment Variables](#-environment-variables)
- [API Documentation Summary](#-api-documentation-summary)
- [Database Design Overview](#-database-design-overview)
- [Authentication & Security](#-authentication--security)
- [Payment System](#-payment-system)
- [Real-Time Features](#-real-time-features)
- [Deployment](#-deployment)
- [Scripts](#-scripts)
- [Future Improvements](#-future-improvements)
- [Contribution Guide](#-contribution-guide)
- [License](#-license)
- [Author & Credits](#-author--credits)

---

## 🌟 Overview

**Kravix** — **"Be Smart, Eat Better"** in Bengali — is a production-grade online food delivery application designed around a real-world business use case. The platform coordinates an event-driven food delivery ecosystem connecting three distinct roles: Customers, Restaurant Owners, and Delivery Riders, under the oversight of Platform Administrators. 

### Real-World Business Use Case
The platform operates as a multi-party marketplace where:
- **Customers** register, search for nearby restaurants using geographic coordinates, manage their cart, apply coupons, select payment gateways, and track their order.
- **Sellers (Restaurants)** manage restaurant availability, update menu items, configure global or localized promotional coupons, and view detailed revenue charts.
- **Riders** toggle online availability and receive real-time location-based delivery jobs.
- **Admins** manage roles, verify newly registered restaurants or riders, cancel orders, block users, and moderate review logs.

---

## 🏗️ Project Architecture

Kravix is organized as a monorepo containing a **React SPA frontend** and **eight backend microservices** developed in Node.js with Express v5 and TypeScript. 

```mermaid
graph TB
    subgraph Client["🌐 Client Application — React + Vite (Port 5173)"]
        UI[Customer / Seller / Rider / Admin UI]
    end

    subgraph Gateway["⚡ Direct Service Communications (No API Gateway)"]
        AUTH["🔐 Auth Service (Port 8000)"]
        REST["🍽️ Restaurant Service (Port 9000 — Menu, Cart, Address, Orders, Coupons, Reviews)"]
        RIDER["🏍️ Rider Service (Port 7000)"]
        ADMIN["🛡️ Admin Service (Port 6001)"]
        ANALYTICS["📈 Analytics Service (Port 6002)"]
        UTIL["🔧 Utilities Service (Port 8888)"]
        RT["📡 Realtime Socket Service (Port 9999)"]
        EMAIL["📧 Email Service (Port 8500)"]
    end

    subgraph Infra["🗄️ Shared Infrastructure & Third-Party APIs"]
        MONGO[(MongoDB Atlas - db: kravix_db)]
        RABBIT[("🐇 RabbitMQ Message Broker")]
        REDIS[("⚡ Redis Cache")]
        CLOUD["☁️ Cloudinary"]
        STRIPE["💳 Stripe"]
        RAZORPAY["💳 Razorpay"]
        GEMINI["🤖 Google Gemini 2.0"]
        GMAIL["✉️ Gmail API"]
    end

    UI -- "REST API" --> AUTH
    UI -- "REST API" --> REST
    UI -- "REST API" --> RIDER
    UI -- "REST API" --> ADMIN
    UI -- "REST API" --> ANALYTICS
    UI -- "REST API" --> UTIL
    UI -- "WebSocket" --> RT

    AUTH --> MONGO
    REST --> MONGO
    RIDER --> MONGO
    ADMIN --> MONGO
    ANALYTICS --> MONGO

    ANALYTICS -- "Caching" --> REDIS

    REST -- "Publishes events" --> RABBIT
    AUTH -- "Publishes events" --> RABBIT
    RABBIT -- "Consumes events" --> RIDER
    RABBIT -- "Consumes events" --> ADMIN
    RABBIT -- "Consumes events" --> UTIL
    RABBIT -- "Consumes events" --> EMAIL

    EMAIL --> GMAIL

    REST --> RT
    RIDER --> RT
    ADMIN --> RT

    UTIL --> CLOUD
    UTIL --> STRIPE
    UTIL --> RAZORPAY
    REST --> GEMINI
```

### Architectural Flow
1. **Client-to-Service Communication**: The frontend client communicates directly with respective microservice ports. There is no central API gateway; base endpoints are injected via client-side environment configurations.
2. **Inter-Service Event Flow**: Microservices communicate asynchronously via a **RabbitMQ** broker using dedicated exchange queues (`payment_event`, `order_ready_queue`, `rider_queue`, `admin_event_queue`, `auth_event_queue`).
3. **Database Sharing Model**: Microservices point to a unified MongoDB cluster (`kravix_db`) but are separated logically. Critical validation models (like User and Restaurant blocked states) are synchronized via inter-service event handlers.
4. **Caching Layer**: The Analytics service utilizes Redis (`ioredis`) for dashboard caching with a local in-memory fallback.

---

## 📁 Folder Structure

```txt
kravix/
 ├── .github/
 │    └── workflows/
 │         └── docker-build-push.yml   # Multi-service selective builds
 ├── client/                           # ── Frontend (React 19 + Vite 7 + TS) ──
 │    ├── public/                      # Static assets, icons, and index.html
 │    ├── src/
 │    │    ├── admin/                  # Admin routes, components, and pages
 │    │    ├── assets/                 # Brand assets
 │    │    ├── components/
 │    │    │    ├── common/            # Route guards, skeletons, utilities
 │    │    │    ├── customer/          # Leaflet maps and customer panels
 │    │    │    ├── home/              # Landing page details
 │    │    │    ├── navbar/            # Role-aware navigation bars
 │    │    │    ├── restaurant/        # Seller dashboard items
 │    │    │    └── rider/             # Rider dashboard items
 │    │    ├── context/                # Global states (AppContext, SocketContext)
 │    │    ├── pages/                  # Route views (Home, Checkout, Orders)
 │    │    ├── types/                  # TypeScript interface mappings
 │    │    └── utils/                  # Helper modules (secureStorage, constants)
 │    ├── tailwind.config.js
 │    ├── vite.config.ts
 │    └── package.json
 └── services/                         # ── Backend Microservices ──
      ├── admin/                       # Port 6001: Moderation, verification, and oversight
      ├── analytics/                   # Port 6002: Analytics aggregation, CSV export, Redis
      ├── auth/                        # Port 8000: User profiles, roles, and Google OAuth
      ├── email/                       # Port 8500: Email notifications via RabbitMQ and Gmail API
      ├── realtime/                    # Port 9999: Socket.IO message routing and auth check
      ├── restaurant/                  # Port 9000: Menus, geospatial discovery, cart, orders, coupons
      ├── rider/                       # Port 7000: Rider profiles, geosearch, tracking, delivery OTPs
      └── utilities/                   # Port 8888: Cloudinary uploader, Stripe, and Razorpay
```

---

## ✨ Features

### 👤 Customer Features
- **Stateless Authentication**: Secure user login via Google One-Tap OAuth and standard Email/Password authentication with JWT.
- **Account Security**: Comprehensive email verification, forgot password, and password reset flows powered by Gmail API.
- **Location-Based Discovery**: Retrieve nearest open and verified restaurants using Mongoose geospatial queries (`$geoNear`).
- **Geographic Address Management**: Register multiple delivery locations using an interactive inline Leaflet map modal.
- **Smart Food Search**: Natural language query search normalized via Google Gemini 2.0 (interpreting regional terms like "bhat", "dal", "mach") with multi-token AND-regex matching and OR-regex fallback for broader results.
- **Autocomplete Suggestions**: Live proximity-aware autocomplete dropdown returning ranked Dish and Restaurant suggestions as the user types, with debounced fetching tied to geolocation coordinates and full keyboard navigation support.
- **Typo Correction Hints**: Levenshtein-based fuzzy correction and prefix expansion run client-side without Gemini; the server returns a `correctedQuery` hint displayed as a "Did you mean …?" banner when applicable.
- **Cart Management**: Add, increment, decrement, and clear cart items saved dynamically.
- **Checkout & Promotions**: Apply flat, percentage-based, or free-delivery coupons with secure local persistence and automatic revalidation.
- **Dual Payment Integration**: Secure checkout powered by Stripe or Razorpay.
- **Order Management**: Dynamic step-by-step route visualization using Leaflet Maps and WebSocket, plus manual order cancellation with confirmation flows.
- **Celebration Effects**: Confetti UI celebration triggers upon successful order delivery.

### 🍳 Restaurant Features
- **Merchant Registration**: Create custom restaurant profiles with image uploads.
- **Menu Management**: Add, delete, and toggle real-time availability of menu items.
- **Sales Analytics Dashboard**: Track monthly, weekly, and daily earnings and order trends with interactive Recharts.
- **Order Pipeline Management**: Process orders through states: `placed` ➔ `accepted` ➔ `preparing` ➔ `ready_for_rider`.
- **Coupon Engine**: Manage restaurant-specific coupons (setting usage limits, minimum order amounts, and expiration dates).

### 🏍️ Rider Features
- **Online/Offline Toggle**: Toggle delivery availability dynamically.
- **Live Tracking System**: Stream GPS coordinate updates to the database and Socket rooms.
- **OTP Handoff Verification**: Secure delivery completion using one-time passwords generated at customer locations.
- **Earnings Analytics**: Monitor completed deliveries and aggregate delivery payouts.

### 🛡️ Admin Features
- **Platform Analytics Summary**: Unified panel metrics for total users, orders, verification requests, and system health.
- **Geographic & Sales Aggregations**: Export historical system logs and sales trends as CSV files.
- **Verification Workflows**: Formally review, approve, or reject restaurant and rider registrations.
- **User & Merchant Moderation**: Instantly block or unblock users or merchants violating platform policies.
- **Order Oversight**: Access system-wide order pipelines and manually trigger cancellations for stuck processes.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite 7
- **Styling**: Tailwind CSS v4, Lucide React icons
- **Client Routing**: React Router DOM 7
- **State Management**: React Context API, secure local storage (`react-secure-storage`)
- **Maps & Tracking**: Leaflet, React-Leaflet, Leaflet Routing Machine
- **Charts & Visualizations**: Recharts
- **Backend Runtime**: Node.js 22 (ES modules), Express v5, TypeScript
- **Database**: MongoDB Atlas, Mongoose 9 (geospatial indexes, aggregation pipelines)
- **Message Broker**: RabbitMQ (`amqplib`)
- **Caching**: Redis (`ioredis`)
- **Authentication**: JWT, Google OAuth 2.0 (`googleapis`)
- **AI Integrations**: Google Generative AI (`@google/generative-ai` — Gemini 2.0 Flash)
- **Payment Gateways**: Stripe, Razorpay
- **Image Storage**: Cloudinary SDK
- **Scheduling**: `node-cron` (Analytics snapshots)
- **DevOps & Containers**: Docker, multi-stage Alpine builds, GitHub Actions CI/CD

---

## 📸 Screenshots / Demo

🚧 **Coming Soon** — Screenshots and a live demo link will be added here.

<p align="center">
  <img src="https://img.shields.io/badge/🔗_Live_Demo-Coming_Soon-gray?style=for-the-badge" alt="Live Demo" />
</p>

---

## 🚀 Installation Guide

Since Kravix is structured as a monorepo without a root-level `package.json`, dependencies are managed and run within each project directory.

### Prerequisites
- **Node.js**: `v22.x` or higher
- **Docker**: For running RabbitMQ and Redis services
- **MongoDB Atlas**: Account or a local instance running on port `27017`

### Step 1: Clone the Repository
```bash
git clone https://github.com/samratmallick-dev/kravix-food-delivery-application.git
cd kravix-online-food-dellivery-application
```

### Step 2: Install Node Dependencies
Run the install command inside the client and each microservice directory:
```bash
# Frontend Client
cd client && npm install && cd ..

# Backend Microservices
for service in admin analytics auth email realtime restaurant rider utilities; do
  echo "Installing dependencies for: $service..."
  cd services/$service && npm install && cd ../..
done
```

### Step 3: Initial TypeScript Compilation
Compile the backend TypeScript files before starting the development servers:
```bash
for service in admin analytics auth email realtime restaurant rider utilities; do
  echo "Compiling: $service..."
  cd services/$service && npx tsc && cd ../..
done
```

### Step 4: Configure Infrastructure (via Docker)
Start the message broker (RabbitMQ) and cache (Redis):
```bash
# Start RabbitMQ container with management UI
docker run -d --name kravix-rabbitmq \
  -p 5672:5672 -p 15672:15672 \
  -e RABBITMQ_DEFAULT_USER=admin \
  -e RABBITMQ_DEFAULT_PASS=admin123 \
  rabbitmq:3-management

# Start Redis container
docker run -d --name kravix-redis -p 6379:6379 redis:7-alpine
```

### Step 5: Start Local Development Servers
Launch individual terminal tabs or processes to run the client and backend servers:
```bash
# Start Frontend Client (Runs on http://localhost:5173)
cd client && npm run dev

# Start Services (Each service compiles dynamically via concurrently and watches for code changes)
cd services/auth && npm run dev
cd services/restaurant && npm run dev
cd services/rider && npm run dev
cd services/admin && npm run dev
cd services/email && npm run dev
cd services/analytics && npm run dev
cd services/utilities && npm run dev
cd services/realtime && npm run dev
```

---

## 🔐 Environment Variables

You must create a `.env` file in the `client` directory and each service folder under `services/`. Use these configurations:

### Frontend Client (`client/.env`)
```env
VITE_API_URL_AUTH=http://localhost:8000/api/v1/auth
VITE_API_URL_RESTAURANT=http://localhost:9000/api/v1/restaurants
VITE_API_URL_MENU=http://localhost:9000/api/v1/menu
VITE_API_URL_CART=http://localhost:9000/api/v1/cart
VITE_API_URL_ADDRESS=http://localhost:9000/api/v1/address
VITE_API_URL_ORDER=http://localhost:9000/api/v1/orders
VITE_API_URL_PAYMENT=http://localhost:8888/api/v1/payment
VITE_API_URL_REALTIME_SOCKET=http://localhost:9999
VITE_API_URL_RIDER=http://localhost:7000/api/v1/riders
VITE_API_URL_ADMIN=http://localhost:6001/api/v1/admin
VITE_API_URL_ANALYTICS=http://localhost:6002/api/v1/analytics
VITE_COUPON_BASE_URL=http://localhost:9000/api/v1/coupons
VITE_REVIEW_BASE_URL=http://localhost:9000/api/v1/reviews
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_yourstripekeyhere
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
VITE_INTERNAL_KEY=your-internal-service-key-here
```

### Microservices Shared configurations
All backend microservices must share the **same** `JWT_SECRET` and `INTERNAL_SERVICE_KEY`.

#### Auth Service (`services/auth/.env`)
```env
PORT=8000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net
DB_NAME=kravix_db
JWT_SECRET=your-shared-jwt-secret-string
INTERNAL_SERVICE_KEY=your-internal-service-key-here
GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
RABITMQ_URL=amqp://admin:admin123@localhost:5672
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
```

#### Restaurant Service (`services/restaurant/.env`)
```env
PORT=9000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net
DB_NAME=kravix_db
JWT_SECRET=your-shared-jwt-secret-string
INTERNAL_SERVICE_KEY=your-internal-service-key-here
RABITMQ_URL=amqp://admin:admin123@localhost:5672
UTILS_SERVICE_URI=http://localhost:8888
REALTIME_SOCKET_SERVICE_URI=http://localhost:9999
PAYMENT_QUEUE=payment_event
RIDER_QUEUE=rider_queue
ORDER_READY_QUEUE=order_ready_queue
ADMIN_EVENT_QUEUE=admin_event_queue
GEMINI_API_KEY=your-google-gemini-api-key-here
ALLOWED_ORIGINS=http://localhost:5173
```

#### Rider Service (`services/rider/.env`)
```env
PORT=7000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net
DB_NAME=kravix_db
JWT_SECRET=your-shared-jwt-secret-string
INTERNAL_SERVICE_KEY=your-internal-service-key-here
RABITMQ_URL=amqp://admin:admin123@localhost:5672
REALTIME_SOCKET_SERVICE_URI=http://localhost:9999
ORDER_READY_QUEUE=order_ready_queue
RIDER_QUEUE=rider_queue
RIDER_SEARCH_RADIUS_METERS=1000
ALLOWED_ORIGINS=http://localhost:5173
```

#### Admin Service (`services/admin/.env`)
```env
PORT=6001
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net
DB_NAME=kravix_db
JWT_SECRET=your-shared-jwt-secret-string
INTERNAL_SERVICE_KEY=your-internal-service-key-here
ADMIN_EMAIL=admin@kravix.com
ADMIN_PASSWORD=your-secure-admin-password
RABITMQ_URL=amqp://admin:admin123@localhost:5672
ADMIN_EVENT_QUEUE=admin_event_queue
ALLOWED_ORIGINS=http://localhost:5173
```

#### Analytics Service (`services/analytics/.env`)
```env
PORT=6002
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net
DB_NAME=kravix_db
JWT_SECRET=your-shared-jwt-secret-string
INTERNAL_SERVICE_KEY=your-internal-service-key-here
RABITMQ_URL=amqp://admin:admin123@localhost:5672
REDIS_URL=redis://localhost:6379
ALLOWED_ORIGINS=http://localhost:5173
```

#### Email Service (`services/email/.env`)
```env
PORT=8500
RABBITMQ_URL=amqp://admin:admin123@localhost:5672
EMAIL_QUEUE=email_queue
GMAIL_CLIENT_ID=your-gmail-client-id
GMAIL_CLIENT_SECRET=your-gmail-client-secret
GMAIL_REDIRECT_URI=htts://localhost
GMAIL_REFRESH_TOKEN=your-gmail-refresh-token
EMAIL_FROM_ADDRESS=your-gmail@gmail.com
EMAIL_FROM_NAME=Kravix
CLIENT_URL=http://localhost:5173
```

#### Utilities Service (`services/utilities/.env`)
```env
PORT=8888
INTERNAL_SERVICE_KEY=your-internal-service-key-here
RABITMQ_URL=amqp://admin:admin123@localhost:5672
PAYMENT_QUEUE=payment_event
CLOUD_NAME=your-cloudinary-cloud-name
CLOUD_API_KEY=your-cloudinary-api-key
CLOUD_API_SECRET=your-cloudinary-api-secret
RAZORPAY_API_KEY=rzp_test_yourrazorpaykeyid
RAZORPAY_API_KEY_SECRET=yourrazorpaysecret
STRIPE_SECRET_KEY=sk_test_yourstripesecretkey
CLIENT_URL=http://localhost:5173
RESTAURANT_BASE_URL=http://localhost:9000
ALLOWED_ORIGINS=http://localhost:5173
```

#### Realtime Service (`services/realtime/.env`)
```env
PORT=9999
JWT_SECRET=your-shared-jwt-secret-string
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
```

---

## 📡 API Documentation Summary

### Auth Service (`:8000/api/v1/auth`)
- `POST /sessions` - Exchanges a Google auth code for a user session and profile. Returns a JWT.
- `POST /register` - Registers a new user via email and password.
- `POST /login` - Authenticates a user using email and password. Returns a JWT.
- `GET /verify-email` - Verifies a user's email address using a token.
- `POST /resend-verification` - Resends the email verification link.
- `POST /forgot-password` - Initiates the password reset flow and sends an email.
- `POST /reset-password` - Resets the user's password using a secure token.
- `PATCH /me/role` - Sets user role to `customer`, `seller`, or `rider`. Updates local token claims.
- `GET /me` - Fetches the authenticated user profile.

### Restaurant Service (`:9000`)
#### Restaurant Profile Management (`/api/v1/restaurants`)
- `POST /` - Registers restaurant profile (coordinates, address, cuisines, image upload) (Seller Only).
- `GET /` - Fetches nearest active verified restaurants based on user geospatial location parameters.
- `GET /me` - Retrieves seller's restaurant profile details.
- `PATCH /me` - Updates restaurant metadata.
- `PATCH /me/status` - Toggles restaurant `isOpen` boolean state.
- `GET /:id` - Fetches a single restaurant details.

#### Menu Management (`/api/v1/menu`)
- `POST /` - Adds a new food item (with name, price, description, and image) (Seller Only).
- `GET /autocomplete` - Returns proximity-aware Dish and Restaurant suggestions ranked by geospatial distance. Accepts `query`, `lat`, and `lng` parameters.
- `GET /search` - Normalizes user query via Gemini, executes multi-token AND-regex with OR-regex fallback, and returns matching active food items. Includes `correctedQuery` in the response when a typo correction was applied.
- `GET /:restaurantId` - Fetches menu items belonging to a restaurant.
- `DELETE /:itemId` - Deletes a menu item (Seller Only).
- `PATCH /:itemId/availability` - Toggles menu item availability status (Seller Only).

#### Shopping Cart (`/api/v1/cart`)
- `POST /` - Adds food item to user cart.
- `GET /` - Retrieves user cart list and aggregates price subtotal.
- `PATCH /increment` - Increments menu item quantity.
- `PATCH /decrement` - Decrements menu item quantity.
- `DELETE /` - Clears entire shopping cart items.

#### Address Management (`/api/v1/address`)
- `POST /` - Registers new delivery address.
- `GET /` - Retrieves user's registered delivery addresses.
- `DELETE /:addressId` - Deletes a registered address.

#### Order Management (`/api/v1/orders`)
- `POST /` - Places a new order from current cart (calculating fees, distance, and applying active coupons).
- `GET /me` - Fetches active and completed orders for the authenticated customer.
- `GET /me/:orderId` - Fetches complete details of a specific customer order.
- `PATCH /me/:orderId/cancel` - Cancels a customer order.
- `POST /reorder/:orderId` - Re-populates cart with elements of a past order.
- `GET /restaurants/:restaurantId` - Fetches incoming orders for a restaurant (Seller Only).
- `PATCH /:orderId/status` - Transitions order status (`preparing`, `ready_for_rider`) (Seller Only).

#### Coupon Engine (`/api/v1/coupons`)
- `POST /` - Creates restaurant-specific or global coupons (Seller / Admin Only).
- `GET /` - Retrieves valid coupons matching query parameters.
- `POST /apply` - Validates minimum amount and limits, and computes discount.

#### Reviews (`/api/v1/reviews`)
- `POST /` - Submits a review score and comment (restaurant or rider).
- `GET /restaurant/:id` - Fetches reviews matching a restaurant.
- `GET /rider/:id` - Fetches reviews matching a rider.
- `POST /report` - Flags a review for admin review.

### Rider Service (`:7000/api/v1/riders`)
- `POST /` - Registers a delivery rider profile with vehicles information.
- `GET /me` - Fetches the authenticated rider profile details.
- `PATCH /me/availability` - Toggles availability status.
- `PATCH /me/location` - Receives and stores updated live coordinate data.
- `GET /me/earnings` - Aggregates completed delivery fees.
- `GET /orders/current` - Fetches currently active delivery job.
- `POST /orders/:orderId/accept` - Accept a delivery request.
- `POST /orders/otp/generate` - Generates unique handoff OTP.
- `PATCH /orders/status` - Updates order delivery status (`picked_up`, `out_for_delivery`, `delivered`).

### Admin Service (`:6001/api/v1/admin`)
- `POST /login` - Verifies email/password against environment variables and issues a JWT with admin permissions.
- `GET /dashboard` - Aggregates registered users, riders, verified restaurants, and pending items.
- `PATCH /users/:userId/block` - Blocks/unblocks a user profile.
- `PATCH /restaurants/:restaurantId/verify` - Approves a restaurant and registers it on maps.
- `PATCH /riders/:riderId/verify` - Verifies a delivery rider.
- `PATCH /orders/:orderId/cancel` - Cancels an order.

### Analytics Service (`:6002/api/v1/analytics`)
- `GET /` - Fetches platform statistics dashboard (revenue trends, peak hours, top foods) (Admin / Seller Only).
- `GET /export` - Streams revenue trends as a CSV document file download.

### Utilities Service (`:8888/api/v1`)
- `POST /cloudinary/images` - Uploads raw base64 data to Cloudinary.
- `POST /payment/stripe` - Initiates Stripe checkout session.
- `POST /payment/stripe/verify` - Confirms Stripe transaction session.
- `POST /payment/razorpay` - Creates Razorpay order session.
- `POST /payment/razorpay/verify` - Verifies Razorpay HMAC signature.

### Realtime Service (`:9999/api/v1/socket`)
- `POST /events` - Emits a Socket.IO event to a room internally (Internal Microservice Key Authentication).

---

## 🗄️ Database Design Overview

The application utilizes Mongoose ODM to write schemas and interface with MongoDB collections:

### 1. User (`User` - Auth/Admin Services)
- `email`: String (unique)
- `name`: String
- `image`: String
- `role`: String (`customer` | `seller` | `rider` | `null`)
- `isBlocked`: Boolean
- `blockedUntil`: Date

### 2. Restaurant (`Restaurant` - Restaurant Service)
- `ownerId`: String (references User)
- `name`: String (text index)
- `image`: String
- `location`: GeoJSON Point (`{ type: "Point", coordinates: [lng, lat] }`)
- `address`: String
- `cuisines`: Array of Strings
- `isVerified`: Boolean
- `isOpen`: Boolean

### 3. MenuItem (`MenuItem` - Restaurant Service)
- `restaurantId`: ObjectId (references Restaurant)
- `name`: String (text index + single-field index)
- `description`: String
- `price`: Number
- `imageUrl`: String
- `isAvailable`: Boolean

### 4. Cart (`Cart` - Restaurant Service)
- `userId`: String (unique)
- `items`: Array (`{ menuItemId, quantity }`)

### 5. Order (`Order` - Restaurant Service)
- `userId`: String
- `restaurantId`: String
- `riderId`: String (nullable)
- `items`: Array (`{ itemId, name, price, quantity }`)
- `subtotal`: Number
- `deliveryFee`: Number
- `platformFee`: Number
- `totalAmount`: Number
- `status`: String (`placed` | `preparing` | `ready_for_rider` | `delivered` | `cancelled`, etc.)
- `paymentStatus`: String (`pending` | `paid` | `failed`)
- `deliveryOtp`: String (nullable)
- `couponCode`: String (nullable)
- `discountAmount`: Number

### 6. Coupon (`Coupon` - Restaurant Service)
- `code`: String (unique)
- `discountType`: String (`percentage` | `flat` | `free_delivery`)
- `discountValue`: Number
- `restaurantId`: String (nullable — for global vs restaurant specific)
- `isActive`: Boolean

### Relationships Mapping
```
   [User] ──(1:1)──> [Cart]
     │
     └──(1:1)──> [Restaurant] ──(1:N)──> [MenuItem]
     │                 │
     │                 └──(1:N)──> [Order]
     │                                │
     └──(1:N)─────────────────────────┘
```

---

## 🔐 Authentication & Security

Kravix implements a dual-layer security model for web traffic:

### Google OAuth Flow
```
   [Client App] ───(One-Tap Code)───> [Auth Service]
        │                                 │
   [JWT Token] <───(Issues JWT)────── [Google API Token Exchange]
```
1. The customer initiates authentication via Google OAuth 2.0 login.
2. The client sends the authorization `code` directly to `/api/v1/auth/sessions`.
3. The Auth service verifies the code with Google OAuth servers, retrieves user information, registers the profile if new, and publishes a `USER_REGISTERED` event to the `auth_event_queue`.
4. The service returns a signed JWT token containing user identifiers and claims.

### Role-Based Access Controls
- Client requests append the token in the `Authorization: Bearer <token>` header.
- Microservices validate the JWT signature statelessly via localized `isAuthenticated` middleware.
- Dedicated middleware guards (e.g. `isSeller`, `isAdminAuthenticated`, `checkBlocked`) parse user role attributes in claims to prevent cross-privilege route access.
- Inter-service REST endpoints authenticate requests using a secure, shared `INTERNAL_SERVICE_KEY` in the headers.

---

## 💳 Payment System

The payment flow isolates checkout from backend order mutation via Stripe and Razorpay integrations:

```
[Client] ──(1. Place Order)──> [Restaurant Service] ──(Create Pending Order)
   │                                                         │
[Client] ──(2. Initiate Payment Session)──> [Utilities Service]
   │                                             │
   │                                      [Stripe/Razorpay Server]
   │                                             │
[Client] ──(3. Pay on Gateway UI) ───────────────┘
   │
   │ <──(Callback/Success Redirect)
   ▼
[Client] ──(4. Verify)──> [Utilities Service] ──(Publish success)──> [RabbitMQ]
                                                                        │
[Restaurant Service] <──(Update Order Status: placed, paid) ────────────┘
```

1. **Order Creation**: The customer places an order. The Restaurant service creates a pending order with `paymentStatus: pending` and returns the order details.
2. **Payment Session Initiation**: The client sends the order ID to the Utilities service (`/payment/stripe` or `/payment/razorpay`). The service retrieves the order from the Restaurant service over internal HTTP (using `INTERNAL_SERVICE_KEY`) and registers a session on Stripe or Razorpay.
3. **Gateway Handoff**: The client completes payment on Stripe Checkout or Razorpay modal.
4. **Signature Verification & Publishing**: The client redirects back and calls the verification route on the Utilities service. If signature checks match, the Utilities service publishes a `PAYMENT_SUCCESS` event to the `payment_event` queue.
5. **Consumption**: The Restaurant service consumes the event, updates status (`paymentStatus: paid`, `status: placed`), records coupon usage, and sends a WebSocket event `order:new` to the merchant dashboard.

---

## 📡 Real-Time Features

Real-time coordination is facilitated by the Realtime Socket service using **Socket.IO**.

### Connection & Authentication
- Socket.IO handshakes require a valid JWT token in `auth.token`.
- Upon token validation, the socket maps the client connection into a personalized user room: `User:<userId>`.
- If the user holds a restaurant owner role, the socket automatically connects them to `Restaurant:<restaurantId>`.

### Key Real-Time Event Flows
- **Restaurant Notification** (`order:new`): Broadcasts to the restaurant room when a payment is processed.
- **Rider Job Offer** (`order:available`): Dispatched to the rooms of riders within geographical range when a restaurant completes order preparation.
- **Menu Sync**: Broadcasts updates (`menuitem:deleted`, `menuitem:availability`) to notify clients viewing the restaurant menu.
- **Rider Coordinates updates** (`join:rider`): Broadcasts rider live coordinates during delivery.

---

## 🐳 Deployment & CI/CD

### Docker Container Configuration
All microservices are package-ready and feature double-stage Alpine configurations for production deployment:

```dockerfile
# Stage 1: Build compilation
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Stage 2: Minimal runtime image
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY --from=builder /app/dist ./dist
CMD [ "node", "dist/index.js" ]
```

### CI/CD Workflow (`docker-build-push.yml`)
The repository contains a GitHub Actions workflow configured in `.github/workflows/docker-build-push.yml`:
- **Path-selective triggers**: Triggers when backend files change within the `services/**` folders.
- **Selective Service Building**: Uses path filters (`dorny/paths-filter`) to compile and push only modified services, optimizing build times.
- **Docker Hub Repository Pushing**: Tags images with `latest` and publishes them directly to Docker Hub.

---

## 📜 Scripts

Each service folder contains distinct development and compilation scripts in their `package.json`:

```bash
# Compile TypeScript files into Javascript (/dist)
npm run build

# Run service in production mode
npm run start

# Run service in development mode (TypeScript compilation and hot-reloads)
npm run dev
```

---

## 🗺️ Future Improvements

- **Dedicated API Gateway**: Route all public calls through a centralized gateway (e.g., Kong, Nginx, Express Gateway) to support rate-limiting, unified CORS policies, and centralized logging.
- **In-App Wallet System**: Add customer wallets to support refunds, promotional cashbacks, and instant checkout.
- **Rider Payout Pipeline**: Build automated merchant revenue settlements and automated rider payout pipelines.
- **Push Notification Integration**: Implement web push notifications (via Firebase Cloud Messaging) to alert customers about order status changes when the web tab is closed.
- **AI Recommendation Engine**: Feed order histories and cuisine preferences to Gemini to generate personalized food recommendation carousels.

---

## 🤝 Contribution Guide

We appreciate contributions to Kravix! To contribute:

1. **Fork the Repository**: Create a personal copy on GitHub.
2. **Create a Feature Branch**:
   ```bash
   git checkout -b feat/your-feature-name
   ```
3. **Write Code**: Ensure strict TypeScript configurations are met.
4. **Follow Conventional Commit Guidelines**:
   - `feat(scope): new user feature`
   - `fix(scope): resolved calculation bug`
   - `docs(scope): updated api references`
5. **Open a Pull Request**: Submit your changes to the `main` branch.

---

## 🛠️ Code Style Guidelines

- **TypeScript strict mode**: Enforced across all workspace packages.
- **ESLint & Prettier**: Configured uniformly for both client and microservices.
- **Consistent Express Request Flow**: `routes` ➔ `middleware` ➔ `controllers` ➔ `models` (handling routing, token authentication, controller business logic, and schema definition respectively).

---

## 📄 License

This repository is licensed under the MIT License. See [License](./License) for details.

---

## 👤 Author & Credits

Designed and developed with ❤️ by **Samrat Mallick** from Kolkata, India.
- **GitHub**: [@samratmallick-dev](https://github.com/samratmallick-dev)

### Special Thanks
Built using these open-source tools and packages:
- [React 19](https://react.dev/) & [Vite](https://vite.dev/)
- [Express 5](https://expressjs.com/) & [TypeScript](https://www.typescriptlang.org/)
- [Leaflet Maps](https://leafletjs.com/)
- [RabbitMQ Broker](https://www.rabbitmq.com/)
- [Redis Cache](https://redis.io/)
- [Stripe Checkout](https://stripe.com/) & [Razorpay India](https://razorpay.com/)
- [Google Gemini API](https://ai.google.dev/)
- [Cloudinary Service](https://cloudinary.com/)
