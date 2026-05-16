<p align="center">
  <img src="./client/public/apple-touch-icon.png" width="30%" alt="Kravix Banner" />
</p>

<h1 align="center">🍛 Kravix — Online Food Ordering and Delivery Platform</h1>
<p align="center"><em>🍔 Craving something delicious? Let's eat again! A full-stack food delivery platform built with love from Kolkata.</em></p>

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
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Screenshots / Demo](#-screenshots--demo)
- [Architecture Diagram](#-architecture-diagram)
- [Contributing](#-contributing)
- [Roadmap](#-roadmap)
- [License](#-license)
- [Contact & Acknowledgements](#-contact--acknowledgements)

---

## 🌟 Overview

**Kravix (Kravix)** — meaning **"Let's Eat Again"** in Bengali — is a production-grade online food delivery web application. Built as a TypeScript-first monorepo with a microservices backend, it delivers a seamless experience for three key user roles:

| Role | Description |
|------|-------------|
| 🧑‍💻 **Customers** | Browse nearby restaurants, search food, build carts, place orders, pay online, and track deliveries in real time |
| 🍳 **Restaurant Owners** | Register restaurants, manage menus, process incoming orders, and view sales analytics |
| 🏍️ **Delivery Riders** | Accept delivery requests, update live location, manage earnings, and complete deliveries with OTP verification |
| 🛡️ **Admins** | Platform-wide dashboard, user/restaurant/rider management, order oversight, and verification workflows |

> **Key Value Proposition:** A complete, event-driven food delivery ecosystem with real-time tracking, dual payment gateway support (Stripe + Razorpay), AI-powered menu descriptions (Gemini), and a robust admin panel — all in one monorepo.

---

## ✨ Features

### 👤 Customer Features
- 🔐 **Google OAuth & JWT Authentication** — Secure sign-in with Google One-Tap
- 🗺️ **Location-Based Discovery** — Browse nearest restaurants using geospatial queries
- 🔍 **Smart Search** — Search food items across all restaurants
- 🛒 **Cart Management** — Add, increment, decrement items with real-time totals
- 📍 **Address Management** — Save and manage multiple delivery addresses
- 💳 **Dual Payment Gateways** — Pay via Stripe or Razorpay
- 📦 **Order Tracking** — Real-time order status updates via WebSocket
- 🗂️ **Order History** — View past orders and reorder with one tap
- 🎉 **Delivery Celebration** — Confetti animation on successful delivery

### 🍳 Restaurant Owner Features
- 🏪 **Restaurant Registration** — Create restaurant profiles with image uploads
- 📋 **Menu Management** — Add, delete, and toggle item availability
- 🤖 **AI-Powered Descriptions** — Auto-generate menu descriptions with Google Gemini
- 📊 **Sales Dashboard** — Interactive charts for revenue and order analytics
- 📝 **Order Management** — Accept, prepare, and mark orders ready for pickup

### 🏍️ Rider Features
- 📱 **Rider Dashboard** — Professional dashboard with earnings overview
- 🟢 **Availability Toggle** — Go online/offline for delivery requests
- 📍 **Live Location Updates** — Real-time GPS tracking on customer maps
- ✅ **OTP-Based Delivery** — Secure order handoff with one-time passwords
- 💰 **Earnings Analytics** — Track delivery income and history

### 🛡️ Admin Features
- 📊 **Platform Dashboard** — Overview of users, restaurants, riders, and orders
- ✅ **Verification Workflows** — Approve restaurants and riders
- 🚫 **User Moderation** — Block/unblock users across the platform
- 📦 **Order Oversight** — View and cancel orders when necessary

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19, TypeScript, Vite 7 | SPA with code-splitting & lazy loading |
| **Styling** | Tailwind CSS 4 | Utility-first responsive design |
| **State** | React Context API | Global state management |
| **Routing** | React Router DOM 7 | Client-side navigation with route guards |
| **Maps** | Leaflet + React-Leaflet | Interactive maps & delivery tracking |
| **Charts** | Recharts | Sales analytics & dashboard visuals |
| **Backend** | Node.js, Express 5, TypeScript | RESTful microservices |
| **Database** | MongoDB Atlas (Mongoose 9) | Document store with geospatial indexes |
| **Auth** | JWT + Google OAuth 2.0 | Stateless authentication |
| **Realtime** | Socket.IO 4 | WebSocket events for live updates |
| **Message Queue** | RabbitMQ (amqplib) | Async inter-service communication |
| **Payments** | Stripe + Razorpay | Dual payment gateway integration |
| **File Storage** | Cloudinary | Image uploads for menus & profiles |
| **AI** | Google Gemini API | AI-generated menu item descriptions |
| **DevOps** | Docker, GitHub Actions | Multi-stage builds & automated CI/CD |

---

## 📁 Project Structure

```
kravix/
├── .github/
│   └── workflows/
│       └── docker-build-push.yml    # CI/CD — per-service Docker builds
├── client/                          # ── Frontend (React + Vite + TS) ──
│   ├── public/                      # Static assets & favicons
│   ├── src/
│   │   ├── admin/                   # Admin panel (pages, components, hooks)
│   │   ├── assets/                  # Images & static resources
│   │   ├── components/
│   │   │   ├── common/              # ProtectedRoutes, PublicRoutes, Skeleton
│   │   │   ├── customer/            # Customer-facing UI components
│   │   │   ├── home/                # Landing page & footer
│   │   │   ├── navbar/              # Navigation bar
│   │   │   ├── restaurant/          # Seller dashboard components
│   │   │   └── rider/               # Rider dashboard components
│   │   ├── context/                 # AppContext, SocketContext
│   │   ├── pages/                   # Route-level page components
│   │   ├── types/                   # TypeScript type definitions
│   │   └── utils/                   # Helper functions
│   ├── index.html                   # Entry HTML with SEO meta tags
│   ├── vite.config.ts               # Vite bundler configuration
│   └── package.json
├── services/                        # ── Backend Microservices ──
│   ├── auth/          (port 8000)   # Authentication & user profiles
│   ├── restaurant/    (port 9000)   # Restaurants, menus, cart, address, orders
│   ├── rider/         (port 7000)   # Rider profiles, delivery, earnings
│   ├── admin/         (port 6001)   # Admin dashboard & moderation
│   ├── realtime/      (port 9999)   # Socket.IO event relay service
│   └── utilities/     (port 8888)   # Cloudinary uploads & payment processing
├── .gitignore
└── README.md
```

Each backend service follows a consistent structure:

```
services/<service-name>/
├── src/
│   ├── app.ts              # Express app setup, middleware, route mounting
│   ├── index.ts            # Server bootstrap & DB/MQ connections
│   ├── config/             # CORS, database, RabbitMQ configuration
│   ├── controllers/        # Request handlers (business logic)
│   ├── middleware/          # Auth guards, file uploads (Multer)
│   ├── model/ (or models/) # Mongoose schemas & models
│   ├── routes/             # Express route definitions
│   └── utils/              # Shared helpers
├── Dockerfile              # Multi-stage Docker build (Node 22 Alpine)
├── .env.example            # Environment variable template (no secrets)
├── .env                    # Environment variables (git-ignored)
├── tsconfig.json
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | ≥ 22.x | Runtime for all services |
| npm | ≥ 10.x | Package management |
| Docker | ≥ 24.x | Containerized deployments (optional) |
| RabbitMQ | ≥ 3.x | Message broker for event-driven flows |
| MongoDB | Atlas or local | Database (Atlas recommended) |

### Step 1: Clone the Repository

```bash
git clone https://github.com/samratmallick-dev/kravix-online-food-dellivery-application.git
cd kravix-online-food-dellivery-application
```

### Step 2: Install Dependencies

Each service has its own `package.json`. Install dependencies for each:

```bash
# Frontend
cd client && npm install

# Backend services
cd services/auth && npm install
cd services/restaurant && npm install
cd services/rider && npm install
cd services/admin && npm install
cd services/utilities && npm install
cd services/realtime && npm install
```

### Step 2.5: Compile TypeScript (Initial Build)

Before running the services for the first time, compile TypeScript to generate the `dist/` output:

```bash
# Compile each backend service
cd services/auth && npx tsc
cd services/restaurant && npx tsc
cd services/rider && npx tsc
cd services/admin && npx tsc
cd services/utilities && npx tsc
cd services/realtime && npx tsc
```

> **Note:** This step is only needed for the initial setup. In development, `npm run dev` automatically watches and recompiles TypeScript via `tsc --watch`.

### Step 3: Configure Environment Variables

Each service and the client includes a `.env.example` file. Copy them to create your `.env` files:

```bash
# Client
cd client/.env.example client/.env

# Backend services
cd services/auth/.env.example services/auth/.env
cd services/restaurant/.env.example services/restaurant/.env
cd services/rider/.env.example services/rider/.env
cd services/admin/.env.example services/admin/.env
cd services/utilities/.env.example services/utilities/.env
cd services/realtime/.env.example services/realtime/.env
```

Then fill in the required secret values in each `.env` file. Refer to the [Environment Variables](#-environment-variables) section for details.

> **Critical**: All backend services must share the **same** `JWT_SECRET` and `INTERNAL_SERVICE_KEY`. All services must point to the **same** MongoDB database (`DB_NAME`).

### Step 4: Start RabbitMQ

```bash
# Using Docker (recommended)
docker run -d --name rabbitmq \
  -p 5672:5672 -p 15672:15672 \
  -e RABBITMQ_DEFAULT_USER=admin \
  -e RABBITMQ_DEFAULT_PASS=admin123 \
  rabbitmq:3-management
```

Management UI will be available at `http://localhost:15672`.

### Step 5: Start All Backend Services (Development)

Open **6 separate terminals** and run:

```bash
# Terminal 1 — Auth Service (port 8000)
cd services/auth && npm run dev

# Terminal 2 — Restaurant Service (port 9000)
cd services/restaurant && npm run dev

# Terminal 3 — Rider Service (port 7000)
cd services/rider && npm run dev

# Terminal 4 — Admin Service (port 6001)
cd services/admin && npm run dev

# Terminal 5 — Utilities Service (port 8888)
cd services/utilities && npm run dev

# Terminal 6 — Realtime Socket Service (port 9999)
cd services/realtime && npm run dev
```

Each `npm run dev` runs `concurrently "tsc --watch" "node --watch dist/index.js"` — compiling TypeScript and auto-restarting on changes.

### Step 6: Start the Frontend

```bash
cd client
npm run dev
```

The application will be running at `http://localhost:5173`.

### Step 7: Build for Production

```bash
# Build each backend service
cd services/auth && npm run build && npm start
cd services/restaurant && npm run build && npm start
# ... repeat for each service

# Build frontend
cd client && npm run build
# Serve the dist/ folder with any static file server
npm run preview
```

---

## 🐳 Docker Setup

All backend microservices are fully containerized with **multi-stage Docker builds** for optimized production images.

### Docker Architecture

Each service includes:
- **`Dockerfile`** — Multi-stage build (build stage with full dev dependencies → production stage with minimal footprint)
- **`.dockerignore`** — Excludes `node_modules`, `.env`, source files, and other non-essential files from the build context

### Multi-Stage Build Process

```dockerfile
# Stage 1: Build — Compile TypeScript
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Stage 2: Production — Minimal runtime image
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY --from=builder /app/dist ./dist
CMD [ "node", "dist/index.js" ]
```

### Building & Running Containers Manually

```bash
# Build a single service
docker build -t kravix-restaurant ./services/restaurant

# Run a service (pass env vars at runtime)
docker run -d \
  --name kravix-restaurant \
  -p 9000:9000 \
  --env-file ./services/restaurant/.env \
  kravix-restaurant
```

### Build All Services

```bash
# Build all 6 services
for service in admin auth realtime restaurant rider utilities; do
  echo "Building $service..."
  docker build -t kravix-$service ./services/$service
done
```

### Docker Hub Images

Pre-built images are automatically published to Docker Hub via CI/CD:

| Service    | Docker Hub Image                               |
| ---------- | ---------------------------------------------- |
| Admin      | `samratmallick/kravix-admin:latest`        |
| Auth       | `samratmallick/kravix-auth:latest`         |
| Realtime   | `samratmallick/kravix-realtime:latest`     |
| Restaurant | `samratmallick/kravix-restaurant:latest`   |
| Rider      | `samratmallick/kravix-rider:latest`        |
| Utilities  | `samratmallick/kravix-utilities:latest`    |

```bash
# Pull and run a published image
docker pull samratmallick/kravix-restaurant:latest
docker run -d -p 9000:9000 --env-file .env samratmallick/kravix-restaurant:latest
```

---

## 🔄 CI/CD Pipeline

The project uses **GitHub Actions** for automated Docker image builds and pushes.

### Workflow: `docker-build-push.yml`

**Location:** `.github/workflows/docker-build-push.yml`

### Trigger Conditions

| Trigger              | Condition                                         |
| -------------------- | ------------------------------------------------- |
| `push` to `main`     | Only when files in `services/` are changed        |
| `pull_request` to `main` | Only when files in `services/` are changed    |
| `workflow_dispatch`  | Manual trigger — builds **all** services          |

### How It Works

```mermaid
flowchart LR
    A[Push / PR to main] --> B{Detect Changed Services}
    B --> C[Build only changed services]
    C --> D[docker build + tag]
    D --> E[Push to Docker Hub]
    F[Manual Dispatch] --> G[Build ALL services]
    G --> D
```

1. **Change Detection** — Uses `dorny/paths-filter` to detect which services have file changes
2. **Selective Builds** — Only changed services are rebuilt (saves CI minutes)
3. **Docker Hub Push** — Images are tagged as `latest` and pushed to the `samratmallick` Docker Hub account
4. **Manual Override** — `workflow_dispatch` rebuilds all 6 services regardless of changes 6 — Realtime Service (port 9999)
cd services/realtime && npm run dev

# Terminal 7 — Utilities Service (port 8888)
cd services/utilities && npm run dev
```

### 5. Build with Docker

Each service includes a multi-stage `Dockerfile` (Node 22 Alpine):

```bash
# Build a single service
docker build -t kravix-auth ./services/auth

# Run the container
docker run -p 8000:8000 --env-file ./services/auth/.env kravix-auth
```

> The GitHub Actions workflow (`.github/workflows/docker-build-push.yml`) automatically detects changed services and builds/pushes only the affected Docker images to Docker Hub.

---

## 🔐 Environment Variables

### Client (`client/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL_AUTH` | Auth service base URL | `http://localhost:8000/api/v1/auth` |
| `VITE_API_URL_RESTAURANT` | Restaurant API URL | `http://localhost:9000/api/v1/restaurants` |
| `VITE_API_URL_MENU` | Menu API URL | `http://localhost:9000/api/v1/menu` |
| `VITE_API_URL_CART` | Cart API URL | `http://localhost:9000/api/v1/cart` |
| `VITE_API_URL_ADDRESS` | Address API URL | `http://localhost:9000/api/v1/address` |
| `VITE_API_URL_ORDER` | Orders API URL | `http://localhost:9000/api/v1/orders` |
| `VITE_API_URL_PAYMENT` | Payment API URL | `http://localhost:8888/api/v1/payment` |
| `VITE_API_URL_REALTIME_SOCKET` | Socket.IO server URL | `http://localhost:9999` |
| `VITE_API_URL_RIDER` | Rider API URL | `http://localhost:7000/api/v1/riders` |
| `VITE_API_URL_ADMIN` | Admin API URL | `http://localhost:6001/api/v1/admin` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_test_...` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID | `861...apps.googleusercontent.com` |
| `VITE_INTERNAL_KEY` | Internal service key | `your-internal-key` |

### Backend Services

| Variable | Services | Description | Example |
|----------|----------|-------------|---------|
| `PORT` | All | Service listen port | `8000` |
| `ALLOWED_ORIGINS` | All | CORS allowed origins | `http://localhost:5173` |
| `MONGO_URI` | Auth, Restaurant, Rider, Admin | MongoDB connection string | `mongodb+srv://...` |
| `DB_NAME` | Auth, Restaurant, Rider, Admin | Database name | `kravix_db` |
| `JWT_SECRET` | Auth, Restaurant, Rider, Admin, Realtime | JWT signing secret | `your-256-bit-secret` |
| `INTERNAL_SERVICE_KEY` | Restaurant, Rider, Admin, Realtime, Utilities | Inter-service auth key | `your-internal-key` |
| `GOOGLE_CLIENT_ID` | Auth | Google OAuth client ID | `861...` |
| `GOOGLE_CLIENT_SECRET` | Auth | Google OAuth client secret | `GOCSPX-...` |
| `RABITMQ_URL` | Restaurant, Rider, Admin, Utilities | RabbitMQ connection URL | `amqp://admin:admin123@localhost:5672` |
| `PAYMENT_QUEUE` | Restaurant, Admin, Utilities | Payment event queue name | `payment_event` |
| `ORDER_READY_QUEUE` | Restaurant, Rider | Order ready queue name | `order_ready_queue` |
| `RIDER_QUEUE` | Restaurant, Rider | Rider assignment queue | `rider_oueue` |
| `ADMIN_EVENT_QUEUE` | Restaurant, Admin | Admin event queue | `admin_event_queue` |
| `CLOUD_NAME` | Utilities | Cloudinary cloud name | `your-cloud-name` |
| `CLOUD_API_KEY` | Utilities | Cloudinary API key | `977...` |
| `CLOUD_API_SECRET` | Utilities | Cloudinary API secret | `your-secret` |
| `RAZORPAY_API_KEY` | Utilities | Razorpay key ID | `rzp_test_...` |
| `RAZORPAY_API_KEY_SECRET` | Utilities | Razorpay key secret | `your-secret` |
| `STRIPE_SECRET_KEY` | Utilities | Stripe secret key | `sk_test_...` |
| `GEMINI_API_KEY` | Restaurant | Google Gemini API key | `AIza...` |
| `RIDER_SEARCH_RADIUS_METERS` | Rider | Geo search radius | `500` |
| `ADMIN_EMAIL` | Admin | Admin login email | `admin@admin.dev` |
| `ADMIN_PASSWORD` | Admin | Admin login password | `your-password` |

---

## 📡 API Documentation

### Auth Service — `:8000/api/v1/auth`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/sessions` | Login / register via Google OAuth | ❌ |
| `PATCH` | `/me/role` | Set user role (customer/seller/rider) | ✅ |
| `GET` | `/me` | Get authenticated user profile | ✅ |

### Restaurant Service — `:9000/api/v1/restaurants`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/` | Create a new restaurant | ✅ Seller |
| `GET` | `/` | Get nearest restaurants (geospatial) | ✅ |
| `GET` | `/me` | Get own restaurant profile | ✅ Seller |
| `PATCH` | `/me` | Update restaurant details | ✅ Seller |
| `PATCH` | `/me/status` | Toggle restaurant open/closed | ✅ Seller |
| `GET` | `/:id` | Get single restaurant by ID | ✅ |

### Menu Service — `:9000/api/v1/menu`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/` | Add menu item (with image upload) | ✅ Seller |
| `GET` | `/search` | Search food items globally | ✅ |
| `GET` | `/:restaurantId` | Get all items for a restaurant | ✅ |
| `DELETE` | `/:itemId` | Delete a menu item | ✅ Seller |
| `PATCH` | `/:itemId/availability` | Toggle item availability | ✅ Seller |

### Cart Service — `:9000/api/v1/cart`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/` | Add item to cart | ✅ |
| `GET` | `/` | Fetch current cart | ✅ |
| `PATCH` | `/increment` | Increment item quantity | ✅ |
| `PATCH` | `/decrement` | Decrement item quantity | ✅ |
| `DELETE` | `/` | Clear entire cart | ✅ |

### Address Service — `:9000/api/v1/address`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/` | Add a delivery address | ✅ |
| `GET` | `/` | Get saved addresses | ✅ |
| `DELETE` | `/:addressId` | Delete an address | ✅ |

### Order Service — `:9000/api/v1/orders`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/` | Create a new order | ✅ |
| `GET` | `/me` | Get customer's orders | ✅ |
| `GET` | `/me/:orderId` | Get single order details | ✅ |
| `POST` | `/reorder/:orderId` | Reorder a delivered order | ✅ |
| `GET` | `/restaurants/:restaurantId` | Get restaurant orders | ✅ Seller |
| `GET` | `/restaurants/:restaurantId/sales-stats` | Sales analytics data | ✅ Seller |
| `PATCH` | `/:orderId/status` | Update order status | ✅ Seller |
| `GET` | `/:id/payment` | Fetch order for payment | ❌ |

### Rider Service — `:7000/api/v1/riders`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/` | Register rider profile | ✅ |
| `GET` | `/me` | Get rider profile | ✅ |
| `PATCH` | `/me/availability` | Toggle online/offline | ✅ |
| `PATCH` | `/me/location` | Update live GPS location | ✅ |
| `GET` | `/me/earnings` | Fetch earnings data | ✅ |
| `GET` | `/orders/current` | Get current active order | ✅ |
| `PATCH` | `/orders/status` | Update delivery status | ✅ |
| `GET` | `/orders/delivery-history` | Get delivery history | ✅ |
| `POST` | `/orders/:orderId/accept` | Accept a delivery request | ✅ |
| `POST` | `/orders/otp/generate` | Generate delivery OTP | ✅ |

### Admin Service — `:6001/api/v1/admin`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/login` | Admin login | ❌ |
| `GET` | `/dashboard` | Platform analytics overview | ✅ Admin |
| `GET` | `/users` | List all users | ✅ Admin |
| `GET` | `/users/:userId` | Get user details | ✅ Admin |
| `PATCH` | `/users/:userId/block` | Block/unblock user | ✅ Admin |
| `GET` | `/restaurants` | List all restaurants | ✅ Admin |
| `GET` | `/restaurants/:restaurantId` | Get restaurant details | ✅ Admin |
| `PATCH` | `/restaurants/:restaurantId/verify` | Verify a restaurant | ✅ Admin |
| `DELETE` | `/restaurants/:restaurantId` | Delete a restaurant | ✅ Admin |
| `GET` | `/riders` | List all riders | ✅ Admin |
| `GET` | `/riders/:riderId` | Get rider details | ✅ Admin |
| `PATCH` | `/riders/:riderId/verify` | Verify a rider | ✅ Admin |
| `DELETE` | `/riders/:riderId` | Delete a rider | ✅ Admin |
| `GET` | `/orders` | List all orders | ✅ Admin |
| `GET` | `/orders/:orderId` | Get order details | ✅ Admin |
| `PATCH` | `/orders/:orderId/cancel` | Cancel an order | ✅ Admin |

### Utilities Service — `:8888/api/v1`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/cloudinary/images` | Upload image to Cloudinary | 🔑 Internal |
| `POST` | `/payment/razorpay` | Create Razorpay order | ❌ |
| `POST` | `/payment/razorpay/verify` | Verify Razorpay payment | ❌ |
| `POST` | `/payment/stripe` | Create Stripe checkout session | ❌ |
| `POST` | `/payment/stripe/verify` | Verify Stripe payment | ❌ |

### Realtime Service — `:9999/api/v1/socket`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/events` | Emit Socket.IO event (internal) | 🔑 Internal |

---

## 📸 Screenshots / Demo

> 🚧 **Coming Soon** — Screenshots and a live demo link will be added here.

<p align="center">
  <img src="https://img.shields.io/badge/🔗_Live_Demo-Coming_Soon-gray?style=for-the-badge" alt="Live Demo" />
</p>

---

## 🏗️ Architecture Diagram

```mermaid
graph TB
    subgraph Client["🌐 Client — React + Vite (port 5173)"]
        UI[Customer / Seller / Rider / Admin UI]
    end

    subgraph Gateway["⚡ Backend Microservices"]
        AUTH["🔐 Auth Service<br/>:8000"]
        REST["🍽️ Restaurant Service<br/>:9000"]
        RIDER["🏍️ Rider Service<br/>:7000"]
        ADMIN["🛡️ Admin Service<br/>:6001"]
        UTIL["🔧 Utilities Service<br/>:8888"]
        RT["📡 Realtime Service<br/>:9999"]
    end

    subgraph Infra["🗄️ Infrastructure"]
        MONGO[(MongoDB Atlas)]
        RABBIT[("🐇 RabbitMQ")]
        CLOUD["☁️ Cloudinary"]
        STRIPE["💳 Stripe"]
        RAZORPAY["💳 Razorpay"]
        GEMINI["🤖 Google Gemini"]
    end

    UI -- "REST API" --> AUTH
    UI -- "REST API" --> REST
    UI -- "REST API" --> RIDER
    UI -- "REST API" --> ADMIN
    UI -- "REST API" --> UTIL
    UI -- "WebSocket" --> RT

    AUTH --> MONGO
    REST --> MONGO
    RIDER --> MONGO
    ADMIN --> MONGO

    REST -- "Publishes events" --> RABBIT
    RABBIT -- "Consumes events" --> RIDER
    RABBIT -- "Consumes events" --> ADMIN
    RABBIT -- "Consumes events" --> UTIL

    REST --> RT
    RIDER --> RT
    ADMIN --> RT

    UTIL --> CLOUD
    UTIL --> STRIPE
    UTIL --> RAZORPAY
    REST --> GEMINI
```

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

### Workflow

```bash
# 1. Fork the repository
# 2. Create a feature branch
git checkout -b feat/your-feature-name

# 3. Make your changes and commit
git commit -m "feat(scope): add your feature description"

# 4. Push to your fork
git push origin feat/your-feature-name

# 5. Open a Pull Request against `main`
```

### Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Purpose |
|--------|---------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation changes |
| `style:` | Code formatting (no logic change) |
| `refactor:` | Code restructuring |
| `perf:` | Performance improvement |
| `test:` | Adding or updating tests |
| `chore:` | Build, CI, or tooling changes |

### Code Style

- TypeScript strict mode across all packages
- ESLint configured for both client and services
- Consistent Express controller pattern: `config → model → middleware → controller → route`

---

## 📄 License

```
MIT License

Copyright (c) 2026 Samrat Mallick

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 📬 Contact & Acknowledgements

### Author

<a href="https://github.com/samratmallick-dev">
  <img src="https://img.shields.io/badge/GitHub-samratmallick--dev-181717?style=for-the-badge&logo=github" alt="GitHub" />
</a>

### Acknowledgements

This project is built with the help of these amazing open-source technologies:

- [React](https://react.dev/) — UI library
- [Vite](https://vitejs.dev/) — Frontend build tool
- [Express](https://expressjs.com/) — Node.js web framework
- [MongoDB](https://www.mongodb.com/) & [Mongoose](https://mongoosejs.com/) — Database & ODM
- [Socket.IO](https://socket.io/) — Real-time communication
- [RabbitMQ](https://www.rabbitmq.com/) — Message broker
- [Leaflet](https://leafletjs.com/) — Interactive maps
- [Recharts](https://recharts.org/) — Charting library
- [Cloudinary](https://cloudinary.com/) — Media management
- [Stripe](https://stripe.com/) & [Razorpay](https://razorpay.com/) — Payment processing
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS framework
- [Lucide React](https://lucide.dev/) / [React-Icons](https://react-icons.github.io/react-icons) — Icon library

---

<p align="center">
  Made with ❤️ in Kolkata, India
  <br />
  <strong>Kravix — Let's Eat Again! 🍛</strong>
</p>
