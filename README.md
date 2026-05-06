<p align="center">
  <img src="./client/public/apple-touch-icon.png" width="30%" alt="Abar Khabo Banner" />
</p>

<h1 align="center">🍛 আবার খাবো — Abar Khabo</h1>
<p align="center"><em>"Seamlessly Connecting Cravings to Your Doorstep"</em></p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.IO-010101?logo=socketdotio&logoColor=white" />
  <img src="https://img.shields.io/badge/RabbitMQ-FF6600?logo=rabbitmq&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white" />
</p>

---

## 📖 Introduction

**আবার খাবো (Abar Khabo)** — Bengali for *"Let's Eat Again"* — is a high-performance, production-grade microservices ecosystem designed for the modern food delivery industry. Built with a focus on scalability, real-time responsiveness, and visual excellence, it bridges the gap between **Customers**, **Restaurant Partners**, and **Delivery Riders**.

The platform leverages a distributed architecture, ensuring that each component—from authentication to real-time tracking—operates independently and efficiently.

---

## 🚀 Key Architectural Highlights

- **Microservices Architecture**: 6 independent services communicating via REST and asynchronous message queues.
- **Event-Driven Dispatch**: RabbitMQ handles critical background tasks like payment processing and rider assignment.
- **Real-Time Synergy**: Socket.IO powered live updates for order status and rider location tracking.
- **Geospatial Precision**: MongoDB `2dsphere` indexing for lightning-fast "near me" restaurant and rider searches.
- **Dual Payment Gateways**: Seamless integration with **Razorpay** (India) and **Stripe** (International).
- **Pro-Grade Security**: JWT-based authentication with role-based access control (RBAC) and Google OAuth 2.0.

---

## 🛠️ Tech Stack

### Frontend (The Visual Experience)
- **Framework**: React 19 + Vite 7 (TypeScript)
- **Styling**: Tailwind CSS 4 + Modern CSS Variables
- **State Management**: React Context API
- **Maps**: Leaflet + React-Leaflet + Leaflet Routing Machine
- **Real-time**: Socket.IO Client

### Backend (The Engine Room)
- **Runtime**: Node.js 22 (TypeScript)
- **Framework**: Express 5
- **Database**: MongoDB (Atlas) + Mongoose
- **Messaging**: RabbitMQ (Message Broker)
- **Storage**: Cloudinary (Image Management)

### Infrastructure & DevOps
- **Containerization**: Docker (Multi-stage builds)
- **CI/CD**: GitHub Actions
- **Registry**: Docker Hub
- **Payments**: Razorpay & Stripe SDKs

---

## 🗺️ System Architecture

### View Mermaid Diagram Source

```
graph TD
    Client[React Frontend] <--> Gateway[Socket.IO Realtime Service]
    Client <--> Auth[Auth Service]
    Client <--> RestService[Restaurant Service]
    Client <--> RiderService[Rider Service]
    Client <--> UtilityService[Utilities Service]
    Client <--> AdminService[Admin Service]

    RestService <--> DB[(MongoDB)]
    Auth <--> DB
    RiderService <--> DB
    AdminService <--> DB

    RestService -- Events --> RBQ[RabbitMQ Broker]
    UtilityService -- Payment Events --> RBQ
    RBQ -- Dispatch --> RiderService
    RBQ -- Updates --> AdminService
```

---

## 🗄️ Database Models & Snapshots

The platform uses a unified MongoDB cluster where each service manages its specific domain models. Below are professional snapshots of the core data entities.

### 👤 User Snapshot
Represents the core identity of any person on the platform.
```json
{
  "_id": "69f7779a0c3cc708b5d583b3",
  "name": "Samrat Mallick",
  "email": "samratmallick832@gmail.com",
  "role": "seller",
  "isBlocked": false,
  "createdAt": "2026-05-03T16:28:10.567Z"
}
```

### 🏠 Restaurant Snapshot
Stores restaurant metadata and geospatial location.
```json
{
  "_id": "69f7922cef88c57f30ac8c0d",
  "name": "Abc Biryani",
  "ownerId": "69f7779a0c3cc708b5d583b3",
  "isVerified": true,
  "autoLocation": {
    "type": "Point",
    "coordinates": [88.6472, 22.8587],
    "formattedAddress": "Habra, North 24 Parganas, WB"
  },
  "isOpen": true
}
```

### 🚴 Rider Snapshot
Tracks rider availability, location, and performance metrics.
```json
{
  "_id": "69f79276c50609133fc886ca",
  "userId": "69f777b10c3cc708b5d583b7",
  "isVerified": true,
  "location": { "type": "Point", "coordinates": [88.6472, 22.8587] },
  "isAvailable": false,
  "totalDeliveries": 3,
  "totalEarnings": 105
}
```

### 📦 Order Snapshot
A comprehensive record of a transaction, including items and tracking status.
```json
{
  "_id": "69f79c377a1b5cf6a362aaea",
  "restaurantName": "Abc Biryani",
  "items": [
    { "name": "Chichen Biryani", "price": 140, "quantity": 2 }
  ],
  "totalAmount": 301,
  "status": "delivered",
  "paymentMethod": "razorpay",
  "paymentStatus": "paid"
}
```

---

## 🔄 Core Workflows

### 💳 Payment & Order Flow
1. **Checkout**: User selects payment method (Stripe/Razorpay).
2. **Verification**: Utility Service verifies payment and publishes a `PAYMENT_SUCCESS` event to RabbitMQ.
3. **Activation**: Restaurant Service consumes the event, marks the order as `placed`, and notifies the restaurant via WebSockets.

### 🚴 Rider Dispatch Flow
1. **Ready to Ship**: Restaurant marks order as `ready_for_rider`.
2. **Queueing**: Event published to `order_ready_queue`.
3. **Dispatch**: Rider Service identifies the nearest available riders using geospatial search and notifies them via the `rider_queue`.

---

## 🔐 Environment Variables

The application requires several environment variables to be set for each service. Below is a comprehensive list of required variables.

### 🏠 Client (`client/.env`)
| Variable | Purpose |
| :--- | :--- |
| `VITE_API_URL_AUTH` | Auth service base URL |
| `VITE_API_URL_RESTAURANT` | Restaurant API base URL |
| `VITE_API_URL_PAYMENT` | Utilities service (payment) URL |
| `VITE_API_URL_REALTIME_SOCKET` | Socket.IO server URL |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe public key |

### 🔑 Core Services (Shared)
All services require `JWT_SECRET`, `MONGO_URI`, and `INTERNAL_SERVICE_KEY` to be synchronized.

<details>
<summary><b>View Detailed Service Configs</b></summary>

#### Auth Service
- `PORT`: 8000
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`

#### Restaurant Service
- `PORT`: 9000
- `RABITMQ_URL`: RabbitMQ connection string
- `PAYMENT_QUEUE`: `payment_event`
- `ORDER_READY_QUEUE`: `order_ready_queue`

#### Rider Service
- `PORT`: 7000
- `RIDER_SEARCH_RADIUS_METERS`: 5000 (default)

#### Utilities Service
- `PORT`: 8888
- `RAZORPAY_API_KEY` / `RAZORPAY_API_KEY_SECRET`
- `STRIPE_SECRET_KEY`
- `CLOUD_NAME` / `CLOUD_API_KEY` / `CLOUD_API_SECRET`
</details>

---

## 🌐 API Reference

### 🔐 Auth Service (`Port 8000`)
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/v1/auth/sessions` | `POST` | Google OAuth2 login & session creation |
| `/api/v1/auth/me` | `GET` | Retrieve current authenticated user profile |
| `/api/v1/auth/me/role` | `PATCH` | Update user role (`customer`, `seller`, `rider`) |

### 🍽️ Restaurant & Menu (`Port 9000`)
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/v1/restaurants` | `POST` | Register a new restaurant (Seller only) |
| `/api/v1/restaurants` | `GET` | Search restaurants with geospatial filters |
| `/api/v1/restaurants/status` | `PATCH` | Toggle restaurant `isOpen` status |
| `/api/v1/menu/restaurant/:id` | `GET` | Fetch all menu items for a specific restaurant |
| `/api/v1/menu` | `POST` | Add a new item to the menu |
| `/api/v1/menu/:id` | `PATCH` | Update menu item details or availability |

### 📦 Order & Cart (`Port 9000`)
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/v1/cart` | `GET` | Retrieve the current user's shopping cart |
| `/api/v1/cart` | `POST` | Add or update quantity of an item in cart |
| `/api/v1/orders` | `POST` | Initialize a new order from cart |
| `/api/v1/orders` | `GET` | Fetch user's order history |
| `/api/v1/orders/:id/status` | `PATCH` | Transition order through lifecycle states |

### 🚴 Rider Service (`Port 7000`)
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/v1/riders/profile` | `POST` | Register a new rider profile |
| `/api/v1/riders/status` | `PATCH` | Toggle rider availability (Online/Offline) |
| `/api/v1/riders/location` | `PATCH` | Update real-time GPS coordinates |
| `/api/v1/riders/accept-order` | `POST` | Accept a dispatched delivery request |

### 💳 Utilities & Payments (`Port 8888`)
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/v1/payment/razorpay/create` | `POST` | Generate Razorpay order ID |
| `/api/v1/payment/razorpay/verify` | `POST` | Verify Razorpay payment signature |
| `/api/v1/payment/stripe/create-checkout-session` | `POST` | Initialize Stripe Checkout session |

### 🛡️ Admin Service (`Port 6001`)
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/v1/admin/login` | `POST` | Secure administrative login |
| `/api/v1/admin/dashboard` | `GET` | Aggregate stats (Sales, Users, Orders) |
| `/api/v1/admin/restaurants/:id/verify` | `PATCH` | Approve/Verify a restaurant partner |
| `/api/v1/admin/users/:id/block` | `PATCH` | Suspend or unblock a user account |

---

---

---

## 🔄 Core Architectural Flows

Detailed technical breakdowns of the platform's most critical operational processes.

### 🔑 1. Google OAuth Authentication Flow
The system uses a secure server-side exchange flow to verify identities.

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                      GOOGLE OAUTH AUTHENTICATION                         │
└──────────────────────────────────────────────────────────────────────────┘

User → Frontend → Click "Sign in with Google"
         ↓
Frontend → Google → Open OAuth consent popup
         ↓
Google → Frontend → Authorization code
         ↓
Frontend → AuthService → POST /api/v1/auth/sessions { code }
         ↓
AuthService → Google → Exchange code for access_token
         ↓
Google → AuthService → Access token + refresh token
         ↓
AuthService → Google → GET /oauth2/v1/userinfo
         ↓
Google → AuthService → { email, name, picture }
         ↓
AuthService → MongoDB → findOne({ email }) or create new user
         ↓
MongoDB → AuthService → User document
         ↓
AuthService → AuthService → Generate JWT (15-day expiry)
         ↓
AuthService → Frontend → { token, data: user }
         ↓
Frontend → Frontend → Store token in localStorage
         ↓
Frontend → Frontend → Set user in AppContext
         ↓
Frontend → User → Redirect to role selection or home
```

### 📍 2. Delivery Confirmation Flow
Security-first delivery validation using geospatial distance checks.

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                   DELIVERY CONFIRMATION (HAIVERSINE)                     │
└──────────────────────────────────────────────────────────────────────────┘

Rider taps "Mark Delivered"
         ↓
System calculates Haversine distance:
   Rider GPS (lat, lng) ←→ Customer Address (lat, lng)
         ↓
    ┌────┴──────────────┐
    ↓                   ↓
 ≤ 100m              > 100m
    ↓                   ↓
 ✅ Delivered         ❌ Rejected
 Status updated      "You are too far
 Rider freed          from delivery
                      location"
```

### 🚴 3. Rider Dispatch Flow
Geospatial-aware dispatch system powered by message queues and WebSockets.

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                      RIDER DISPATCH FLOW                                 │
└──────────────────────────────────────────────────────────────────────────┘

Seller marks order "ready_for_rider"
         ↓
RestaurantService → RabbitMQ (ORDER_READY_QUEUE)
         ↓
RiderService consumes event
         ↓
MongoDB 2dsphere query: find riders within 500m of restaurant
         ↓
    ┌────┴────┐
    ↓         ↓
 Rider A   Rider B   ← Socket.IO push notification
    ↓
First rider to accept → POST /orders/:orderId/accept
    ↓
Order updated: status = "rider_assigned", riderId assigned
    ↓
Rider availability set to false (busy)
```

### 💳 4. Payment Flow
Detailed transaction lifecycle across multiple providers.

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                         PAYMENT FLOW                                     │
└──────────────────────────────────────────────────────────────────────────┘

Customer → Frontend → POST /orders { paymentMethod, addressId }
                          ↓
                    OrderService creates order (15-min TTL)
                          ↓
              ┌───────────┴───────────┐
              ↓                       ↓
         [Razorpay]              [Stripe]
              ↓                       ↓
    POST /payment/razorpay    POST /payment/stripe
              ↓                       ↓
    UtilsService → Razorpay   UtilsService → Stripe
    creates payment order     creates checkout session
              ↓                       ↓
    Frontend opens popup      Redirect to Stripe page
              ↓                       ↓
    User completes payment    User completes payment
              ↓                       ↓
    POST /razorpay/verify     POST /stripe/verify
    (HMAC signature check)    (session status check)
              ↓                       ↓
              └───────────┬───────────┘
                          ↓
              RabbitMQ: publishPaymentSuccess()
                          ↓
              RestaurantService consumes event
                          ↓
              Update order: paymentStatus = "paid"
              Remove expiresAt (cancel TTL)
                          ↓
              Socket.IO → Emit "order:update" to user & seller rooms
```

### 🔄 5. Order Lifecycle
The platform manages a complex state machine for orders to ensure real-time tracking accuracy.

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                           ORDER LIFECYCLE                                │
└──────────────────────────────────────────────────────────────────────────┘

[Order Created] → placed → accepted → preparing → ready_for_rider → rider_assigned → picked_up → out_for_delivery → delivered
                    │           │                       │
                    │           │                Publishes RabbitMQ event
                    ↓           ↓                (ORDER_READY_FOR_RIDER)
              cancelled (Admin)

---

Who controls each transition:

Seller:  placed → accepted → preparing → ready_for_rider
Rider:   rider_assigned → picked_up → out_for_delivery → reached_delivery_location → delivered
Admin:   placed → cancelled | accepted → cancelled
System:  ready_for_rider → rider_assigned (via RabbitMQ + auto-dispatch)
```

---

## 📁 Folder Structure

```text
.
├── .github/workflows/          # CI/CD pipelines (GitHub Actions)
├── client/                     # React Frontend Application
│   ├── public/                 # Static assets & manifest
│   └── src/
│       ├── admin/              # Specialized Admin module
│       ├── components/         # Reusable UI components
│       ├── context/            # React Context (Auth, Socket, App)
│       ├── pages/              # Page-level components
│       ├── types/              # TypeScript interfaces
│       ├── utils/              # Helper functions & constants
│       ├── App.tsx             # Root routing
│       └── main.tsx            # Entry point
└── services/                   # Backend Microservices
    ├── admin/                  # Port 6001: Management logic
    ├── auth/                   # Port 8000: Google OAuth & Identity
    ├── realtime/               # Port 9999: Socket.IO gateway
    ├── restaurant/             # Port 9000: Core Business (Orders/Menu)
    ├── rider/                  # Port 7000: Logistics & Dispatch
    └── utilities/              # Port 8888: Payments & Cloudinary
        └── src/
            ├── config/         # Service-specific configuration
            ├── controllers/    # Business logic handlers
            ├── middleware/     # Security & validation guards
            ├── model/          # Mongoose schemas
            └── routes/         # API endpoint definitions
```

---

## 🛠️ Installation & Setup

### 1. Prerequisites
- **Node.js** v20+
- **Docker** & **Docker Compose**
- **RabbitMQ** Instance
- **MongoDB Atlas** Account

### 2. Environment Setup
Clone the repo and create `.env` files for each service (refer to `.env.example` in each directory).

### 3. Local Development
```bash
# Install dependencies for all services
npm run install-all

# Start services in development mode
# Open separate terminals for each service:
cd services/auth && npm run dev
cd services/restaurant && npm run dev
# ... and so on
```

### 4. Docker Deployment
```bash
# Build all images
docker compose build

# Launch the ecosystem
docker compose up -d
```

---

## 🛡️ License
Distributed under the **MIT License**. See `LICENSE` for more information.

---

## ⚡ Performance & Optimization

The platform is engineered for speed and responsiveness, implementing several industry-standard optimization techniques:

### 🎨 Frontend Optimizations
- **Component-Level Code Splitting**: Utilizes `React.lazy` and `Suspense` for all major pages and the admin dashboard, ensuring users only download the code they need for the current view.
- **Intelligent Loading States**: Implemented `AppSkeleton` components across the application to maintain a high perceived performance and reduce layout shift during data fetching.
- **Socket-Driven UI**: Replaced expensive polling with a persistent **Socket.IO** connection, enabling real-time updates for order status and restaurant availability with minimal overhead.
- **Debounced Interaction**: Search and filter operations are optimized to prevent redundant API calls during rapid user input.

### ⚙️ Backend & Infrastructure Optimizations
- **Geospatial Efficiency**: Leverages MongoDB's native `2dsphere` indexes, allowing the Restaurant and Rider services to perform complex distance-based queries in milliseconds.
- **Event-Driven Decoupling**: Uses **RabbitMQ** as a message broker to offload non-blocking tasks (like payment event propagation and rider dispatch) from the main request-response cycle.
- **Database Indexing**: Critical fields like `email`, `ownerId`, and `userId` are indexed for fast lookups. Compound unique indexes in the Cart service prevent data duplication.
- **Multi-Stage Docker Builds**: Production images are built using multi-stage Dockerfiles, stripping away development dependencies and source code to minimize the final container footprint (Node-Alpine based).
- **Internal Service Communication**: High-speed inter-service communication is secured via `INTERNAL_SERVICE_KEY` validation, bypassing unnecessary public-facing overhead.

---

<p align="center">
  Built with ❤️ by <strong>Samrat Mallick</strong>
</p>
