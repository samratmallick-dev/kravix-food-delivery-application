<p align="center">
  <h1 align="center">🍛 আবার খাবো — Abar Khabo</h1>
  <p align="center"><em>"Let's Eat Again"</em></p>
  <p align="center">
    A production-grade, microservices-based online food delivery platform built with React, Node.js, Express, MongoDB, Socket.IO, and RabbitMQ — featuring real-time order tracking, multi-gateway payments, geospatial restaurant search, and a full admin dashboard.
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-000000?logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.IO-010101?logo=socketdotio&logoColor=white" />
  <img src="https://img.shields.io/badge/RabbitMQ-FF6600?logo=rabbitmq&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/GitHub_Actions-2088FF?logo=githubactions&logoColor=white" />
  <img src="https://img.shields.io/badge/Stripe-635BFF?logo=stripe&logoColor=white" />
  <img src="https://img.shields.io/badge/Razorpay-0C2451?logo=razorpay&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" />
</p>

---

## 📑 Table of Contents

1.  [Project Overview](#-project-overview)
2.  [Tech Stack](#%EF%B8%8F-tech-stack)
3.  [Folder & File Structure](#-folder--file-structure)
4.  [Environment Variables](#-environment-variables)
5.  [Installation & Setup Guide](#-installation--setup-guide)
6.  [Docker Setup](#-docker-setup)
7.  [CI/CD Pipeline](#-cicd-pipeline)
8.  [API Documentation](#-api-documentation)
9.  [Authentication Flow](#-authentication-flow)
10. [Database Models](#%EF%B8%8F-database-models)
11. [Error Handling System](#-error-handling-system)
12. [Middleware Explanation](#-middleware-explanation)
13. [Business Logic](#-business-logic)
14. [Role-Based Access Control](#-role-based-access-control)
15. [API Response Format Standard](#-api-response-format-standard)
16. [Deployment Guide](#-deployment-guide)
17. [Future Improvements](#-future-improvements)
18. [Contribution Guide](#-contribution-guide)
19. [License](#-license)

---

## 📖 Project Overview

### What is আবার খাবো?

**আবার খাবো (Abar Khabo)** —  _"Let's Eat Again"_  — is a full-featured, microservices-based online food delivery platform. It connects **customers**, **restaurant sellers**, and **delivery riders** through a seamless, real-time experience.

### Problem It Solves

Traditional food ordering systems are monolithic and difficult to scale. আবার খাবো solves this by:

-   Providing a **distributed microservices architecture** where each domain (auth, restaurants, riders, payments, admin) runs independently
-   Enabling **real-time order tracking** via WebSockets so every stakeholder sees live updates
-   Supporting **dual payment gateways** (Razorpay + Stripe) for maximum flexibility
-   Using **geospatial queries** to find restaurants and riders near the customer
-   Offering a comprehensive **admin dashboard** for platform management

### Key Features

| Feature              | Description                                                         |
| -------------------- | ------------------------------------------------------------------- |
| 🔐 Google OAuth Login | One-click sign-in with Google accounts                              |
| 🧑‍🍳 Multi-Role System  | Customer, Seller, Rider, and Admin roles                            |
| 📍 Geospatial Search  | Find nearest restaurants using MongoDB `2dsphere` indexes           |
| 🛒 Smart Cart System  | Single-restaurant cart enforcement with quantity management         |
| 💳 Dual Payments      | Razorpay & Stripe payment integration                               |
| 📦 Real-Time Tracking | Live order status updates via Socket.IO                             |
| 🗺️ Map Integration    | Leaflet maps for address selection & delivery tracking              |
| 🚴 Rider Management   | Geolocation-based rider assignment via RabbitMQ queues              |
| 🛡️ Admin Dashboard    | Full control: verify restaurants/riders, block users, cancel orders |
| 🌐 Multilingual Ready | Locale infrastructure for Bengali, Hindi, English                   |
| 📱 Responsive Design  | Mobile-first Tailwind CSS design                                    |

### Target Users

-   **Customers** — Browse restaurants, search food, order & pay, track delivery
-   **Restaurant Sellers** — Register restaurant, manage menu, process orders
-   **Delivery Riders** — Accept orders, navigate to restaurant & customer, mark delivery
-   **Platform Admins** — Verify entities, monitor orders, block/unblock users

---

## ⚙️ Tech Stack

### Frontend

| Technology                     | Purpose                                    |
| ------------------------------ | ------------------------------------------ |
| **React 19**                   | UI library for building the SPA            |
| **TypeScript**                 | Type-safe JavaScript                       |
| **Vite 7**                     | Lightning-fast dev server & build tool     |
| **Tailwind CSS 4**             | Utility-first CSS framework                |
| **React Router v7**            | Client-side routing with nested layouts    |
| **Axios**                      | HTTP client for API calls                  |
| **Socket.IO Client**           | WebSocket connection for real-time updates |
| **Leaflet + React-Leaflet**    | Interactive maps & routing                 |
| **Leaflet Routing Machine**    | Turn-by-turn route visualization           |
| **@react-oauth/google**        | Google OAuth2 login popup                  |
| **@stripe/stripe-js**          | Stripe Checkout frontend SDK               |
| **Lucide React & React Icons** | Icon libraries                             |
| **React Hot Toast**            | Notification toasts                        |

### Backend (Microservices)

| Technology                   | Purpose                                   |
| ---------------------------- | ----------------------------------------- |
| **Node.js**                  | JavaScript runtime                        |
| **Express 5**                | Web framework for REST APIs               |
| **TypeScript**               | Type-safe server code                     |
| **MongoDB + Mongoose**       | NoSQL database with ODM                   |
| **JWT (jsonwebtoken)**       | Stateless authentication tokens           |
| **Google APIs (googleapis)** | Server-side OAuth2 token exchange         |
| **Socket.IO**                | WebSocket server for real-time events     |
| **RabbitMQ (amqplib)**       | Message broker for async event processing |
| **Cloudinary**               | Cloud-based image storage                 |
| **Multer**                   | Multipart file upload handling            |
| **Razorpay SDK**             | Indian payment gateway                    |
| **Stripe SDK**               | International payment gateway             |
| **Axios**                    | Inter-service HTTP communication          |
| **bcryptjs**                 | Password hashing (admin login)            |
| **DataURI**                  | Convert file buffers to data URIs         |

### Infrastructure & DevOps

| Technology           | Purpose                                                        |
| -------------------- | -------------------------------------------------------------- |
| **MongoDB Atlas**    | Managed cloud database (replica set)                           |
| **RabbitMQ**         | Message queue for payment events, rider dispatch, admin events |
| **Cloudinary**       | CDN for restaurant/menu/rider images                           |
| **Docker**           | Containerization with multi-stage builds for all services      |
| **GitHub Actions**   | CI/CD pipeline for automated Docker image builds & pushes      |
| **Docker Hub**       | Container registry for published service images                |

---

## 📁 Folder & File Structure

### High-Level Overview

```
abar-khabo-online-food-delivery-application/
│
├── .github/workflows/         → CI/CD (GitHub Actions)
├── client/                    → Frontend (React + Vite + TypeScript)
└── services/
    ├── admin/                 → Admin Dashboard Service      (Port 6001)
    ├── auth/                  → Authentication Service       (Port 8000)
    ├── restaurant/            → Restaurant + Orders Service  (Port 9000)
    ├── rider/                 → Rider Service                (Port 7000)
    ├── utilities/             → Payments + Cloudinary        (Port 8888)
    └── realtime/              → Socket.IO Realtime Service   (Port 9999)
```

---

### 🖥️ Client — `client/`

Frontend SPA built with React 19, Vite 7, and TypeScript.

| Path | Description |
| ---- | ----------- |
| `.env` | Frontend environment variables |
| `index.html` | HTML entry point with SEO meta tags |
| `package.json` | Frontend dependencies |
| `vite.config.ts` | Vite configuration |
| `tsconfig.json` | TypeScript root config |
| `eslint.config.js` | ESLint configuration |
| `public/` | Static assets (favicons, manifest) |

**`src/` — Source Code:**

| Path | Description |
| ---- | ----------- |
| `main.tsx` | Application entry — providers wrapping `<App />` |
| `App.tsx` | Route definitions (BrowserRouter) |
| `index.css` | Global Tailwind styles |
| **`context/`** | **React Context Providers** |
| `context/AppContext.tsx` | Auth state, location, cart data |
| `context/SocketContext.tsx` | Socket.IO connection management |
| **`pages/`** | **Page-Level Components (15 pages)** |
| `pages/login.tsx` | Google OAuth login page |
| `pages/select-role.tsx` | Role selection (customer/seller/rider) |
| `pages/home.tsx` | Restaurant listing with geo-search |
| `pages/search.tsx` | Food & restaurant search |
| `pages/customerRestaurantPage.tsx` | Single restaurant menu view |
| `pages/cart.tsx` | Shopping cart |
| `pages/address.tsx` | Address management with Leaflet map |
| `pages/checkout.tsx` | Checkout & payment gateway selection |
| `pages/paymentSuccess.tsx` | Razorpay payment callback |
| `pages/orderSuccess.tsx` | Stripe payment callback |
| `pages/customerOrder.tsx` | Order history list |
| `pages/orderDetails.tsx` | Single order real-time tracking |
| `pages/restaurant.tsx` | Seller dashboard (manage restaurant) |
| `pages/rider.tsx` | Rider dashboard (accept/track orders) |
| `pages/account.tsx` | User profile page |
| **`components/`** | **Reusable UI Components** |
| `components/common/` | Shared: ProtectedRoutes, PublicRoutes, AppSkeleton, constants |
| `components/navbar/` | Navigation bar |
| `components/home/` | Home page components + Footer |
| `components/customer/` | Customer-specific components |
| `components/restaurant/` | Seller-specific components |
| `components/rider/` | Rider-specific components |
| **`admin/`** | **🛡️ Admin Panel Module** |
| `admin/components/` | AdminLayout, sidebar, etc. |
| `admin/context/` | AdminAuthContext, AdminSocketContext |
| `admin/hooks/` | Custom hooks for admin |
| `admin/pages/` | Admin pages (dashboard, users, restaurants, riders, orders) |
| **`types/`** | **TypeScript Type Definitions** |
| `types/types.ts` | Shared interfaces (User, Restaurant, Order, etc.) |
| **`utils/`** | **Utility Functions** |
| `utils/orderFlow.ts` | Order status transition maps |
| `locales/` | i18n locale files (multilingual support) |
| `assets/` | Static assets (images, logos) |

---

### 🔐 Auth Service — `services/auth/` (Port 8000)

| Path | Description |
| ---- | ----------- |
| `Dockerfile` | Multi-stage Docker build |
| `.dockerignore` | Docker build exclusions |
| `src/index.ts` | Server entry point |
| `src/app.ts` | Express app setup + route mounting |
| `src/config/cors/cors.ts` | CORS configuration |
| `src/config/db/db.ts` | MongoDB connection |
| `src/controllers/auth.controllers.ts` | Login (Google OAuth), Role update, Profile |
| `src/middleware/isAuthenticated.ts` | JWT token validation |
| `src/middleware/TryCatchHandler.ts` | Global async error wrapper |
| `src/model/User.ts` | User schema (name, email, role, blocked status) |
| `src/routes/auth.routes.ts` | `POST /sessions`, `PATCH /me/role`, `GET /me` |

---

### 🍽️ Restaurant Service — `services/restaurant/` (Port 9000)

| Path | Description |
| ---- | ----------- |
| `Dockerfile` | Multi-stage Docker build |
| `.dockerignore` | Docker build exclusions |
| `src/index.ts` | Entry: connects DB + RabbitMQ, starts payment consumer |
| `src/app.ts` | Express app with 5 route groups |
| **Config** | |
| `src/config/cors/cors.ts` | CORS configuration |
| `src/config/db/db.ts` | MongoDB connection |
| `src/config/datauri.ts` | File-to-DataURI conversion |
| `src/config/rabbitmq.ts` | RabbitMQ connection & channel setup |
| `src/config/paymentConsumer.ts` | Listens for payment success events |
| `src/config/orderPublisher.ts` | Publishes "order ready" events for rider dispatch |
| **Controllers** | |
| `src/controllers/restaurant.controllers.ts` | CRUD + geo-search + status toggle |
| `src/controllers/menuItems.controllers.ts` | Menu CRUD + search + availability toggle |
| `src/controllers/cart.controllers.ts` | Cart add/increment/decrement/clear |
| `src/controllers/order.controllers.ts` | Order lifecycle (create → deliver) |
| `src/controllers/address.controllers.ts` | Address CRUD with geolocation |
| **Middleware** | |
| `src/middleware/isAuthenticated.ts` | JWT + isSeller + checkBlocked |
| `src/middleware/TryCatchHandler.ts` | Global async error wrapper |
| `src/middleware/multer.ts` | File upload config |
| **Models** | |
| `src/model/Restaurant.ts` | Restaurant schema with `2dsphere` index |
| `src/model/MenuItems.ts` | Menu item schema |
| `src/model/Cart.ts` | Cart schema with compound unique index |
| `src/model/Order.ts` | Order schema with TTL index |
| `src/model/Address.ts` | Address schema with geolocation |
| `src/model/User.ts` | User ref schema (blocked status) |
| **Routes** | |
| `src/routes/restaurant.routes.ts` | `/api/v1/restaurants` |
| `src/routes/menuItem.routes.ts` | `/api/v1/menu` |
| `src/routes/cart.routes.ts` | `/api/v1/cart` |
| `src/routes/address.routes.ts` | `/api/v1/address` |
| `src/routes/order.routes.ts` | `/api/v1/orders` |

---

### 🚴 Rider Service — `services/rider/` (Port 7000)

| Path | Description |
| ---- | ----------- |
| `Dockerfile` | Multi-stage Docker build |
| `.dockerignore` | Docker build exclusions |
| `src/index.ts` | Entry: DB + RabbitMQ, listens for rider dispatch events |
| `src/app.ts` | Express app |
| `src/config/` | DB, CORS, RabbitMQ, DataURI configs |
| `src/controllers/rider.controllers.ts` | Profile, availability, order acceptance, status updates |
| `src/middleware/` | Auth + TryCatch + Multer |
| `src/model/Rider.ts` | Rider schema with `2dsphere` location |
| `src/model/User.ts` | User ref schema |
| `src/routes/rider.routes.ts` | `/api/v1/riders` |

---

### 🛡️ Admin Service — `services/admin/` (Port 6001)

| Path | Description |
| ---- | ----------- |
| `Dockerfile` | Multi-stage Docker build |
| `.dockerignore` | Docker build exclusions |
| `src/index.ts` | Entry: DB + RabbitMQ connection |
| `src/app.ts` | Express app |
| `src/config/` | DB, CORS, RabbitMQ configs |
| **Controllers** | |
| `src/controllers/admin.controllers.ts` | Admin login (email/password) |
| `src/controllers/dashboard.controllers.ts` | Aggregate dashboard stats |
| `src/controllers/user.controllers.ts` | List, view, block/unblock users |
| `src/controllers/restaurant.controllers.ts` | List, verify, delete restaurants |
| `src/controllers/rider.controllers.ts` | List, verify, delete riders |
| `src/controllers/order.controllers.ts` | List, view, cancel orders |
| **Middleware** | |
| `src/middleware/isAdminAuthenticated.ts` | Admin JWT validation |
| `src/middleware/TryCatchHandler.ts` | Error wrapper |
| `src/models/` | Shared DB schemas (User, Restaurant, Rider, Order, MenuItem) |
| `src/routes/admin.routes.ts` | `/api/v1/admin` |

---

### 🔧 Utilities Service — `services/utilities/` (Port 8888)

| Path | Description |
| ---- | ----------- |
| `Dockerfile` | Multi-stage Docker build |
| `.dockerignore` | Docker build exclusions |
| `src/index.ts` | Entry: Express + RabbitMQ |
| `src/config/cors.ts` | CORS |
| `src/config/cloudinary.ts` | Cloudinary SDK setup |
| `src/config/razorpay.ts` | Razorpay SDK instance |
| `src/config/verifyRazorpay.ts` | Signature verification |
| `src/config/rabitmq.ts` | RabbitMQ connection |
| `src/config/paymentProducer.ts` | Publishes payment success events |
| `src/controllers/payment.controllers.ts` | Razorpay & Stripe create/verify |
| `src/routes/cloudinary.routes.ts` | `/api/v1/cloudinary` (internal image upload) |
| `src/routes/payment.routes.ts` | `/api/v1/payment` |

---

### 📡 Realtime Service — `services/realtime/` (Port 9999)

| Path | Description |
| ---- | ----------- |
| `Dockerfile` | Multi-stage Docker build |
| `.dockerignore` | Docker build exclusions |
| `src/index.ts` | HTTP server + Socket.IO initialization |
| `src/app.ts` | Express app |
| `src/config/cors.ts` | CORS |
| `src/config/socket.ts` | Socket.IO setup with JWT auth + room management |
| `src/controllers/socket.controllers.ts` | HTTP → Socket event bridge |
| `src/routes/internal.routes.ts` | `POST /api/v1/socket/events` (internal) |

---

### 🚀 CI/CD — `.github/workflows/`

| Path | Description |
| ---- | ----------- |
| `docker-build-push.yml` | Auto-build & push Docker images on push/PR to `main` |

## 🔐 Environment Variables

> ⚠️ **Important**: Never commit real secrets. Create a `.env.example` file with placeholder values. The values below are **examples only**.

### Client (`client/.env`)

| Variable                       | Purpose                                        | Example                                       |
| ------------------------------ | ---------------------------------------------- | --------------------------------------------- |
| `VITE_API_URL_AUTH`            | Auth service base URL                          | `http://localhost:8000/api/v1/auth`           |
| `VITE_API_URL_RESTAURANT`      | Restaurant API URL                             | `http://localhost:9000/api/v1/restaurants`    |
| `VITE_API_URL_MENU`            | Menu items API URL                             | `http://localhost:9000/api/v1/menu`           |
| `VITE_API_URL_CART`            | Cart API URL                                   | `http://localhost:9000/api/v1/cart`           |
| `VITE_API_URL_ADDRESS`         | Address API URL                                | `http://localhost:9000/api/v1/address`        |
| `VITE_API_URL_ORDER`           | Orders API URL                                 | `http://localhost:9000/api/v1/orders`         |
| `VITE_API_URL_PAYMENT`         | Payment API URL                                | `http://localhost:8888/api/v1/payment`        |
| `VITE_API_URL_REALTIME_SOCKET` | Socket.IO server URL                           | `http://localhost:9999`                       |
| `VITE_API_URL_RIDER`           | Rider API URL                                  | `http://localhost:7000/api/v1/riders`         |
| `VITE_API_URL_ADMIN`           | Admin API URL                                  | `http://localhost:6001/api/v1/admin`          |
| `VITE_STRIPE_PUBLISHABLE_KEY`  | Stripe publishable key (frontend)              | `pk_test_xxx...`                              |
| `VITE_GOOGLE_CLIENT_ID`        | Google OAuth Client ID                         | `861656642222-xxx.apps.googleusercontent.com` |
| `VITE_INTERNAL_KEY`            | Internal service key (for frontend validation) | `d39db01ff86ca...`                            |

### Auth Service (`services/auth/.env`)

| Variable               | Purpose                                     | Example                              |
| ---------------------- | ------------------------------------------- | ------------------------------------ |
| `PORT`                 | Server port                                 | `8000`                               |
| `ALLOWED_ORIGINS`      | CORS allowed origins                        | `http://localhost:5173`              |
| `MONGO_URI`            | MongoDB Atlas connection string             | `mongodb://user:pass@host:27017/...` |
| `DB_NAME`              | Database name                               | `abarkhabo_db`                       |
| `JWT_SECRET`           | JWT signing secret (shared across services) | `d39db01ff86ca45c...`                |
| `GOOGLE_CLIENT_ID`     | Google OAuth Client ID                      | `861656642222-xxx...`                |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret                  | `GOCSPX-xxx...`                      |

### Restaurant Service (`services/restaurant/.env`)

| Variable                      | Purpose                             | Example                           |
| ----------------------------- | ----------------------------------- | --------------------------------- |
| `PORT`                        | Server port                         | `9000`                            |
| `ALLOWED_ORIGINS`             | CORS allowed origins                | `http://localhost:5173`           |
| `MONGO_URI`                   | MongoDB connection string           | `mongodb://...`                   |
| `DB_NAME`                     | Database name                       | `abarkhabo_db`                    |
| `JWT_SECRET`                  | JWT signing secret                  | `d39db01ff86ca45c...`             |
| `INTERNAL_SERVICE_KEY`        | Key for inter-service auth          | `d39db01ff86ca...`                |
| `RABITMQ_URL`                 | RabbitMQ connection URL             | `amqp://user:pass@localhost:5672` |
| `PAYMENT_QUEUE`               | Payment event queue name            | `payment_event`                   |
| `ORDER_READY_QUEUE`           | Queue for rider dispatch triggers   | `order_ready_queue`               |
| `RIDER_QUEUE`                 | Queue for rider notifications       | `rider_oueue`                     |
| `ADMIN_EVENT_QUEUE`           | Queue for admin notification events | `admin_event_queue`               |
| `UTILS_SERVICE_URI`           | Utilities service base URL          | `http://localhost:8888`           |
| `REALTIME_SOCKET_SERVICE_URI` | Socket service URL                  | `http://localhost:9999`           |

### Rider Service (`services/rider/.env`)

| Variable                      | Purpose                                         | Example                           |
| ----------------------------- | ----------------------------------------------- | --------------------------------- |
| `PORT`                        | Server port                                     | `7000`                            |
| `ALLOWED_ORIGINS`             | CORS allowed origins                            | `http://localhost:5173`           |
| `MONGO_URI`                   | MongoDB connection string                       | `mongodb://...`                   |
| `DB_NAME`                     | Database name                                   | `abarkhabo_db`                    |
| `JWT_SECRET`                  | JWT signing secret                              | `d39db01ff86ca45c...`             |
| `INTERNAL_SERVICE_KEY`        | Inter-service auth key                          | `d39db01ff86ca...`                |
| `RABITMQ_URL`                 | RabbitMQ connection URL                         | `amqp://user:pass@localhost:5672` |
| `ORDER_READY_QUEUE`           | Queue name for ready orders                     | `order_ready_queue`               |
| `RIDER_QUEUE`                 | Queue name for rider events                     | `rider_oueue`                     |
| `RIDER_SEARCH_RADIUS_METERS`  | Geo-search radius for nearby riders             | `500`                             |
| `RESTAURANT_SERVICE_URI`      | Restaurant service URL (for internal API calls) | `http://localhost:9000`           |
| `UTILS_SERVICE_URI`           | Utilities service URL                           | `http://localhost:8888`           |
| `REALTIME_SOCKET_SERVICE_URI` | Socket service URL                              | `http://localhost:9999`           |

### Admin Service (`services/admin/.env`)

| Variable                      | Purpose                   | Example                           |
| ----------------------------- | ------------------------- | --------------------------------- |
| `PORT`                        | Server port               | `6001`                            |
| `ALLOWED_ORIGINS`             | CORS allowed origins      | `http://localhost:5173`           |
| `MONGO_URI`                   | MongoDB connection string | `mongodb://...`                   |
| `DB_NAME`                     | Database name             | `abarkhabo_db`                    |
| `JWT_SECRET`                  | JWT signing secret        | `d39db01ff86ca45c...`             |
| `INTERNAL_SERVICE_KEY`        | Inter-service auth key    | `d39db01ff86ca...`                |
| `ADMIN_EMAIL`                 | Admin login email         | `admin@admin.dev`                 |
| `ADMIN_PASSWORD`              | Admin login password      | `Admin@123`                       |
| `REALTIME_SOCKET_SERVICE_URI` | Socket service URL        | `http://localhost:9999`           |
| `RABITMQ_URL`                 | RabbitMQ connection URL   | `amqp://user:pass@localhost:5672` |
| `PAYMENT_QUEUE`               | Payment queue name        | `payment_event`                   |
| `ADMIN_EVENT_QUEUE`           | Admin event queue name    | `admin_event_queue`               |

### Realtime Socket Service (`services/realtime/.env`)

| Variable               | Purpose                         | Example                 |
| ---------------------- | ------------------------------- | ----------------------- |
| `PORT`                 | Server port                     | `9999`                  |
| `ALLOWED_ORIGINS`      | CORS allowed origins            | `http://localhost:5173` |
| `JWT_SECRET`           | JWT secret (for Socket.IO auth) | `d39db01ff86ca45c...`   |
| `INTERNAL_SERVICE_KEY` | Inter-service auth key          | `d39db01ff86ca...`      |

### Utilities Service (`services/utilities/.env`)

| Variable                  | Purpose                            | Example                           |
| ------------------------- | ---------------------------------- | --------------------------------- |
| `PORT`                    | Server port                        | `8888`                            |
| `ALLOWED_ORIGINS`         | CORS allowed origins               | `http://localhost:5173`           |
| `CLOUD_NAME`              | Cloudinary cloud name              | `your_cloud_name`                 |
| `CLOUD_API_KEY`           | Cloudinary API key                 | `977838324119192`                 |
| `CLOUD_API_SECRET`        | Cloudinary API secret              | `xxx...`                          |
| `INTERNAL_SERVICE_KEY`    | Inter-service auth key             | `d39db01ff86ca...`                |
| `RAZORPAY_API_KEY`        | Razorpay API key                   | `rzp_test_xxx`                    |
| `RAZORPAY_API_KEY_SECRET` | Razorpay secret key                | `xxx...`                          |
| `STRIPE_SECRET_KEY`       | Stripe secret key                  | `sk_test_xxx...`                  |
| `RABITMQ_URL`             | RabbitMQ connection URL            | `amqp://user:pass@localhost:5672` |
| `PAYMENT_QUEUE`           | Payment event queue name           | `payment_event`                   |
| `RESTAURANT_BASE_URL`     | Restaurant service URL             | `http://localhost:9000`           |
| `CLIENT_URL`              | Frontend URL (for Stripe redirect) | `http://localhost:5173`           |

---

## 🚀 Installation & Setup Guide

### Prerequisites

-   **Node.js** >= 18.x
-   **npm** >= 9.x
-   **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account)
-   **RabbitMQ** (local install or [CloudAMQP](https://www.cloudamqp.com/))
-   **Google Cloud Console** project with OAuth 2.0 credentials
-   **Cloudinary** account (free tier works)
-   **Razorpay** test account (optional, for Indian payments)
-   **Stripe** test account (optional, for international payments)

### Step 1: Clone the Repository

```bash
git clone https://github.com/samratmallick-dev/abar-khabo-online-food-dellivery-application.git
cd abar-khabo-online-food-dellivery-application
```

### Step 2: Install Dependencies

Each service has its own `package.json`. Install dependencies for each:

```bash
# Frontend
cd client && npm install && cd ..

# Backend services
cd services/auth && npm install && cd ../..
cd services/restaurant && npm install && cd ../..
cd services/rider && npm install && cd ../..
cd services/admin && npm install && cd ../..
cd services/utilities && npm install && cd ../..
cd services/realtime && npm install && cd ../..
```

### Step 3: Configure Environment Variables

1. Copy the example values from the [Environment Variables](#-environment-variables) section above.
2. Create `.env` files in each directory:
   - `client/.env`
   - `services/auth/.env`
   - `services/restaurant/.env`
   - `services/rider/.env`
   - `services/admin/.env`
   - `services/utilities/.env`
   - `services/realtime/.env`
3. **Critical**: All backend services must share the **same** `JWT_SECRET` and `INTERNAL_SERVICE_KEY`.
4. All services must point to the **same** MongoDB database (`DB_NAME`).

### Step 4: Start RabbitMQ

```bash
# Using Docker (recommended)
docker run -d --name rabbitmq \
  -p 5672:5672 -p 15672:15672 \
  -e RABBITMQ_DEFAULT_USER=rabbitmqadmin \
  -e RABBITMQ_DEFAULT_PASS=rabbitmq@admin \
  rabbitmq:3-management
```

Management UI will be available at `http://localhost:15672`.

### Step 5: Start All Backend Services (Development)

Open **6 separate terminals** and run:

```bash
# Terminal 1 — Auth Service
cd services/auth && npm run dev

# Terminal 2 — Restaurant Service
cd services/restaurant && npm run dev

# Terminal 3 — Rider Service
cd services/rider && npm run dev

# Terminal 4 — Admin Service
cd services/admin && npm run dev

# Terminal 5 — Utilities Service
cd services/utilities && npm run dev

# Terminal 6 — Realtime Socket Service
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
docker build -t abarkhabo-restaurant ./services/restaurant

# Run a service (pass env vars at runtime)
docker run -d \
  --name abarkhabo-restaurant \
  -p 9000:9000 \
  --env-file ./services/restaurant/.env \
  abarkhabo-restaurant
```

### Build All Services

```bash
# Build all 6 services
for service in admin auth realtime restaurant rider utilities; do
  echo "Building $service..."
  docker build -t abarkhabo-$service ./services/$service
done
```

### Docker Hub Images

Pre-built images are automatically published to Docker Hub via CI/CD:

| Service    | Docker Hub Image                               |
| ---------- | ---------------------------------------------- |
| Admin      | `samratmallick/abarakhabo-admin:latest`        |
| Auth       | `samratmallick/abarakhabo-auth:latest`         |
| Realtime   | `samratmallick/abarakhabo-realtime:latest`     |
| Restaurant | `samratmallick/abarakhabo-restaurant:latest`   |
| Rider      | `samratmallick/abarakhabo-rider:latest`        |
| Utilities  | `samratmallick/abarakhabo-utilities:latest`    |

```bash
# Pull and run a published image
docker pull samratmallick/abarakhabo-restaurant:latest
docker run -d -p 9000:9000 --env-file .env samratmallick/abarakhabo-restaurant:latest
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
4. **Manual Override** — `workflow_dispatch` rebuilds all 6 services regardless of changes

### Required Repository Secrets

| Secret             | Description                                  |
| ------------------ | -------------------------------------------- |
| `DOCKERHUB_TOKEN`  | Docker Hub access token for authentication   |

> 💡 Generate a Docker Hub access token at [hub.docker.com/settings/security](https://hub.docker.com/settings/security).

### Pipeline Jobs

| Job                | Service    | Condition                                        |
| ------------------ | ---------- | ------------------------------------------------ |
| `build-admin`      | Admin      | `services/admin/**` changed or manual dispatch   |
| `build-auth`       | Auth       | `services/auth/**` changed or manual dispatch    |
| `build-realtime`   | Realtime   | `services/realtime/**` changed or manual dispatch|
| `build-restaurant` | Restaurant | `services/restaurant/**` changed or manual dispatch|
| `build-rider`      | Rider      | `services/rider/**` changed or manual dispatch   |
| `build-utilities`  | Utilities  | `services/utilities/**` changed or manual dispatch|

---

## 🌐 API Documentation

### Base URLs

| Service       | Base URL                                   |
| ------------- | ------------------------------------------ |
| Auth          | `http://localhost:8000/api/v1/auth`        |
| Restaurant    | `http://localhost:9000/api/v1/restaurants` |
| Menu          | `http://localhost:9000/api/v1/menu`        |
| Cart          | `http://localhost:9000/api/v1/cart`        |
| Address       | `http://localhost:9000/api/v1/address`     |
| Orders        | `http://localhost:9000/api/v1/orders`      |
| Payment       | `http://localhost:8888/api/v1/payment`     |
| Rider         | `http://localhost:7000/api/v1/riders`      |
| Admin         | `http://localhost:6001/api/v1/admin`       |
| Socket Events | `http://localhost:9999/api/v1/socket`      |
| Cloudinary    | `http://localhost:8888/api/v1/cloudinary`  |

---

### 🔐 Auth Service (`/api/v1/auth`)

#### `POST /sessions` — Google OAuth Login

Exchange a Google authorization code for a JWT token.

| Field            | Value                   |
| ---------------- | ----------------------- |
| **URL**          | `/api/v1/auth/sessions` |
| **Method**       | `POST`                  |
| **Auth**         | None                    |
| **Content-Type** | `application/json`      |

**Request Body:**
```json
{
  "code": "4/0AX4XfWh..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "error": false,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "_id": "665a1b2c3d4e5f6a7b8c9d0e",
    "name": "Samrat Mallick",
    "email": "samrat@example.com",
    "image": "https://lh3.googleusercontent.com/...",
    "role": null,
    "isBlocked": false,
    "blockedUntil": null
  }
}
```

**Error Responses:**
| Status | Message                                     |
| ------ | ------------------------------------------- |
| 400    | `Authorization code is required`            |
| 400    | `Authorization code has already been used`  |
| 401    | `Google token exchange failed`              |
| 401    | `Failed to obtain access token from Google` |
| 503    | `Service temporarily unavailable`           |

---

#### `PATCH /me/role` — Update User Role

| Field      | Value                  |
| ---------- | ---------------------- |
| **URL**    | `/api/v1/auth/me/role` |
| **Method** | `PATCH`                |
| **Auth**   | `Bearer <token>`       |

**Request Body:**
```json
{
  "role": "customer"  // "customer" | "seller" | "rider"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Role Updated Successfully",
  "token": "eyJhbG...",
  "data": { "...updated user object..." }
}
```

**Error Responses:**
| Status | Message             |
| ------ | ------------------- |
| 400    | `Invalid role`      |
| 401    | `Unauthorized user` |
| 404    | `User not found`    |

---

#### `GET /me` — Get User Profile

| Field      | Value             |
| ---------- | ----------------- |
| **URL**    | `/api/v1/auth/me` |
| **Method** | `GET`             |
| **Auth**   | `Bearer <token>`  |

**Success Response (200):**
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "error": false,
  "data": {
    "_id": "665a1b2c...",
    "name": "Samrat Mallick",
    "email": "samrat@example.com",
    "image": "https://...",
    "role": "customer",
    "restaurantId": null,
    "isBlocked": false,
    "blockedUntil": null
  }
}
```

---

### 🍽️ Restaurant Service (`/api/v1/restaurants`)

#### `POST /` — Create Restaurant (Seller Only)

| Field            | Value                                        |
| ---------------- | -------------------------------------------- |
| **URL**          | `/api/v1/restaurants/`                       |
| **Method**       | `POST`                                       |
| **Auth**         | `Bearer <token>` (Seller role + block check) |
| **Content-Type** | `multipart/form-data`                        |

**Form Fields:** `name`, `description`, `latitude`, `longitude`, `formattedAddress`, `phone`, `file` (image)

**Success Response (201):** Returns created restaurant + new JWT token with `restaurantId`.

---

#### `GET /` — Get Nearest Restaurants (Geospatial)

| Field      | Value                                                                            |
| ---------- | -------------------------------------------------------------------------------- |
| **URL**    | `/api/v1/restaurants/?latitude=22.57&longitude=88.43&radius=5000&search=biryani` |
| **Method** | `GET`                                                                            |
| **Auth**   | `Bearer <token>`                                                                 |

**Query Parameters:**
| Param       | Type   | Required | Default | Description                    |
| ----------- | ------ | -------- | ------- | ------------------------------ |
| `latitude`  | number | ✅        | -       | User's latitude                |
| `longitude` | number | ✅        | -       | User's longitude               |
| `radius`    | number | ❌        | `5000`  | Search radius in meters        |
| `search`    | string | ❌        | `""`    | Search by restaurant/food name |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Restaurants fetched successfully",
  "error": false,
  "count": 5,
  "data": [
    {
      "_id": "...",
      "name": "Bengali Kitchen",
      "description": "Authentic Bengali cuisine",
      "image": "https://res.cloudinary.com/...",
      "isOpen": true,
      "isVerified": true,
      "distance": 1234.56,
      "distanceKm": 1.23,
      "autoLocation": { "type": "Point", "coordinates": [88.43, 22.57], "formattedAddress": "..." }
    }
  ]
}
```

---

#### `GET /me` — Get My Restaurant (Seller)

| **Auth** | `Bearer <token>` (Seller) |
| -------- | ------------------------- |

#### `PATCH /me/status` — Toggle Open/Close (Seller)

**Body:** `{ "status": true }` (boolean)

> Cannot close with active orders.

#### `PATCH /me` — Update Restaurant Info (Seller)

**Body:** `{ "name": "New Name", "description": "Updated" }`

#### `GET /:id` — Get Single Restaurant

---

### 🍔 Menu Service (`/api/v1/menu`)

#### `POST /` — Add Menu Item (Seller)

**Content-Type:** `multipart/form-data` — Fields: `name`, `description`, `price`, `file` (image)

#### `GET /:restaurantId` — Get All Menu Items

#### `DELETE /:itemId` — Delete Menu Item (Seller)

#### `PATCH /:itemId/availability` — Toggle Availability (Seller)

Emits `menuitem:availability` socket event.

#### `GET /search?search=biryani&latitude=22&longitude=88&radius=5000` — Search Food

Returns matching menu items with their restaurant info and distance.

---

### 🛒 Cart Service (`/api/v1/cart`)

All routes require `Bearer <token>`.

#### `POST /` — Add to Cart

**Body:** `{ "restaurantId": "...", "itemId": "..." }`

> ⚠️ Returns `400` if cart contains items from a **different restaurant**.

#### `GET /` — Fetch Cart

Returns cart items populated with menu item and restaurant details, plus `subTotal` and `cartLength`.

#### `PATCH /increment` — Increment Quantity

**Body:** `{ "itemId": "..." }`

#### `PATCH /decrement` — Decrement Quantity

**Body:** `{ "itemId": "..." }` — Removes item when quantity reaches 0.

#### `DELETE /` — Clear Cart

---

### 📍 Address Service (`/api/v1/address`)

#### `POST /` — Add Address

```json
{
  "mobile": 9876543210,
  "formattedAddress": "123 Park Street, Kolkata",
  "latitude": 22.5726,
  "longitude": 88.3639
}
```

#### `GET /` — Get My Addresses

#### `DELETE /:addressId` — Delete Address

---

### 📦 Order Service (`/api/v1/orders`)

#### `POST /` — Create Order

```json
{
  "paymentMethod": "razorpay",  // "razorpay" | "stripe"
  "addressId": "665a..."
}
```

**Business logic applied:**
- Validates address ownership
- Checks cart is not empty
- Verifies restaurant is open
- Calculates delivery fee, platform fee (₹7), GST (5% food + 18% delivery)
- Free delivery for orders ≥ ₹250
- Creates order with 15-minute TTL for payment
- Clears cart after order creation

**Success (201):**
```json
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "orderId": "665a...",
    "totalAmount": 287.35,
    "paymentMethod": "razorpay"
  }
}
```

#### `GET /me` — My Orders (Customer)

#### `GET /me/:orderId` — Single Order Detail (Customer)

#### `GET /restaurants/:restaurantId` — Restaurant Orders (Seller)

Query: `?limit=10`

#### `PATCH /:orderId/status` — Update Order Status (Seller)

**Body:** `{ "status": "accepted" }` — Allowed: `accepted`, `preparing`, `ready_for_rider`

When set to `ready_for_rider`, publishes event to RabbitMQ for rider dispatch.

#### Internal Endpoints (Internal Service Key Required)

| Route                                    | Method | Description                  |
| ---------------------------------------- | ------ | ---------------------------- |
| `/internal/rider-assignment`             | PATCH  | Assign rider to order        |
| `/internal/current?riderId=...`          | GET    | Get rider's current order    |
| `/internal/status`                       | PATCH  | Update order status by rider |
| `/internal/delivery-history?riderId=...` | GET    | Rider's delivery history     |
| `/internal/:orderId`                     | GET    | Get order by ID              |
| `/:id/payment`                           | GET    | Get order payment info       |

---

### 💳 Payment Service (`/api/v1/payment`)

#### `POST /razorpay` — Create Razorpay Order

**Body:** `{ "orderId": "665a..." }`

**Response:** `{ "razorpayOrderId": "order_xxx", "key_id": "rzp_test_xxx" }`

#### `POST /razorpay/verify` — Verify Razorpay Payment

```json
{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "xxx",
  "orderId": "665a..."
}
```

#### `POST /stripe` — Create Stripe Checkout Session

**Body:** `{ "orderId": "665a..." }`

**Response:** `{ "sessionId": "cs_xxx", "url": "https://checkout.stripe.com/..." }`

#### `POST /stripe/verify` — Verify Stripe Payment

**Body:** `{ "sessionId": "cs_xxx" }`

---

### 🚴 Rider Service (`/api/v1/riders`)

#### `POST /` — Create Rider Profile

**Content-Type:** `multipart/form-data`
Fields: `phoneNumber`, `aadhaarNumber`, `drivingLicesce`, `latitude`, `longitude`, `file` (photo)

#### `GET /me` — Get My Profile

#### `PATCH /me/availability` — Toggle Availability

```json
{
  "isAvailable": true,
  "latitude": 22.57,
  "longitude": 88.43
}
```

> Must be verified to go online.

#### `GET /orders/current` — Current Active Order

#### `PATCH /orders/status` — Update Order Status

```json
{
  "orderId": "665a...",
  "latitude": 22.57,   // optional, used for delivery proximity check
  "longitude": 88.43
}
```

**Status transitions:** `rider_assigned → picked_up → out_for_delivery → reached_delivery_location → delivered`

> Final "delivered" status requires rider to be within **100 meters** of the delivery address.

#### `POST /orders/:orderId/accept` — Accept Order

#### `GET /orders/delivery-history` — Delivery History

---

### 🛡️ Admin Service (`/api/v1/admin`)

#### `POST /login` — Admin Login

```json
{
  "email": "admin@admin.dev",
  "password": "Admin@123"
}
```

**All routes below require admin JWT token.**

#### Dashboard
| Route            | Method | Description                                                                     |
| ---------------- | ------ | ------------------------------------------------------------------------------- |
| `GET /dashboard` | GET    | Aggregated stats (users by role, restaurant/rider counts, order stats, revenue) |

#### User Management
| Route                                      | Method | Description                                 |
| ------------------------------------------ | ------ | ------------------------------------------- |
| `GET /users?page=1&limit=20&role=customer` | GET    | List users with pagination & role filter    |
| `GET /users/:userId`                       | GET    | Get single user                             |
| `PATCH /users/:userId/block`               | PATCH  | Toggle block/unblock (7-day block duration) |

#### Restaurant Management
| Route                                              | Method | Description                        |
| -------------------------------------------------- | ------ | ---------------------------------- |
| `GET /restaurants?page=1&limit=20&isVerified=true` | GET    | List restaurants                   |
| `GET /restaurants/:restaurantId`                   | GET    | Get restaurant + menu items        |
| `PATCH /restaurants/:restaurantId/verify`          | PATCH  | Verify/unverify restaurant         |
| `DELETE /restaurants/:restaurantId`                | DELETE | Delete restaurant + all menu items |

#### Rider Management
| Route                                         | Method | Description           |
| --------------------------------------------- | ------ | --------------------- |
| `GET /riders?page=1&limit=20&isVerified=true` | GET    | List riders           |
| `GET /riders/:riderId`                        | GET    | Get single rider      |
| `PATCH /riders/:riderId/verify`               | PATCH  | Verify/unverify rider |
| `DELETE /riders/:riderId`                     | DELETE | Delete rider          |

#### Order Management
| Route                                                          | Method | Description              |
| -------------------------------------------------------------- | ------ | ------------------------ |
| `GET /orders?page=1&limit=20&status=placed&paymentStatus=paid` | GET    | List orders with filters |
| `GET /orders/:orderId`                                         | GET    | Get single order         |
| `PATCH /orders/:orderId/cancel`                                | PATCH  | Cancel order             |

---

### 📡 Realtime Socket Service (`/api/v1/socket`)

#### `POST /events` — Emit Socket Event (Internal Only)

```json
{
  "event": "order:update",
  "room": "User:665a1b2c...",
  "payload": { "orderId": "...", "status": "accepted" }
}
```

**Headers:** `x-internal-key: <INTERNAL_SERVICE_KEY>`

---

### 🖼️ Cloudinary Service (`/api/v1/cloudinary`)

#### `POST /images` — Upload Image (Internal Only)

**Body:** `{ "image": "<base64 data URI>" }`

**Headers:** `x-internal-key: <INTERNAL_SERVICE_KEY>`

---

## 🔑 Authentication Flow

### Login Flow (Google OAuth 2.0)

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Google
    participant AuthService
    participant MongoDB

    User->>Frontend: Click "Sign in with Google"
    Frontend->>Google: Open OAuth consent popup
    Google-->>Frontend: Authorization code
    Frontend->>AuthService: POST /api/v1/auth/sessions { code }
    AuthService->>Google: Exchange code for access_token
    Google-->>AuthService: Access token + refresh token
    AuthService->>Google: GET /oauth2/v1/userinfo
    Google-->>AuthService: { email, name, picture }
    AuthService->>MongoDB: findOne({ email }) or create new user
    MongoDB-->>AuthService: User document
    AuthService->>AuthService: Generate JWT (15-day expiry)
    AuthService-->>Frontend: { token, data: user }
    Frontend->>Frontend: Store token in localStorage
    Frontend->>Frontend: Set user in AppContext
    Frontend-->>User: Redirect to role selection or home
```

### Token Handling

-   **Token Generation:** JWT signed with `JWT_SECRET`, includes `_id`, `name`, `email`, `image`, `role`, optionally `restaurantId`
-   **Token Expiry:** 15 days
-   **Token Storage:** Browser `localStorage`
-   **Token Transmission:** `Authorization: Bearer <token>` header on every API request
-   **Token Refresh:** Not implemented — user must re-login after expiry

### Protected Routes (Frontend)

-   **`ProtectedRoutes`** — Checks `isAuth` from `AppContext`; redirects to `/login` if not authenticated
-   **`PublicRoutes`** — Only accessible when NOT authenticated; redirects to `/` if already logged in
-   **Role-based routing:**
    -   No role → `/select-role` page
    -   `customer` → Home page with restaurant listings
    -   `seller` → `/seller` dashboard
    -   `rider` → `/rider` dashboard
    -   `admin` → `/admin` dashboard (separate auth via `AdminAuthContext`)

### Authorization Code Replay Prevention

The auth service maintains an in-memory `Set<string>` of used authorization codes. Codes are rejected if reused within 5 minutes:

```typescript
const usedCodes = new Set<string>();
// ...
usedCodes.add(code);
setTimeout(() => usedCodes.delete(code), 5 * 60 * 1000);
```

---

## 🗄️ Database Models

All services share a **single MongoDB database** (`abarkhabo_db`) but each service defines its own model subset.

### User Model (`users` collection)

| Field          | Type    | Required | Default | Description                                    |
| -------------- | ------- | -------- | ------- | ---------------------------------------------- |
| `name`         | String  | ✅        | -       | User's display name (from Google)              |
| `email`        | String  | ✅        | -       | Unique, lowercase email                        |
| `image`        | String  | ✅        | -       | Google profile picture URL                     |
| `role`         | String  | ❌        | `null`  | `"customer"`, `"seller"`, `"rider"`, or `null` |
| `isBlocked`    | Boolean | ❌        | `false` | Whether user is blocked by admin               |
| `blockedUntil` | Date    | ❌        | `null`  | Block expiry timestamp                         |
| `createdAt`    | Date    | auto     | -       | Mongoose timestamp                             |
| `updatedAt`    | Date    | auto     | -       | Mongoose timestamp                             |

**Example Document:**
```json
{
  "_id": "665a1b2c3d4e5f6a7b8c9d0e",
  "name": "Samrat Mallick",
  "email": "samrat@example.com",
  "image": "https://lh3.googleusercontent.com/a/xxx",
  "role": "customer",
  "isBlocked": false,
  "blockedUntil": null,
  "createdAt": "2025-06-01T10:30:00.000Z",
  "updatedAt": "2025-06-01T10:30:00.000Z"
}
```

---

### Restaurant Model (`restaurants` collection)

| Field                           | Type     | Required | Default | Description                            |
| ------------------------------- | -------- | -------- | ------- | -------------------------------------- |
| `name`                          | String   | ✅        | -       | Restaurant name (trimmed)              |
| `description`                   | String   | ❌        | -       | Restaurant description                 |
| `image`                         | String   | ✅        | -       | Cloudinary image URL                   |
| `ownerId`                       | String   | ✅        | -       | User ID of the seller                  |
| `phone`                         | Number   | ✅        | -       | Contact number                         |
| `isVerified`                    | Boolean  | ✅        | `false` | Admin verification status              |
| `autoLocation.type`             | String   | ✅        | -       | Always `"Point"`                       |
| `autoLocation.coordinates`      | [Number] | ✅        | -       | `[longitude, latitude]`                |
| `autoLocation.formattedAddress` | String   | ❌        | -       | Human-readable address                 |
| `isOpen`                        | Boolean  | ❌        | `false` | Whether restaurant is accepting orders |

**Indexes:** `autoLocation: "2dsphere"` for geospatial queries.

**Example Document:**
```json
{
  "_id": "665b2c3d4e5f6a7b8c9d0f1a",
  "name": "Bengali Kitchen",
  "description": "Authentic Bengali cuisine since 2020",
  "image": "https://res.cloudinary.com/samrat/uploads/restaurant_abc.jpg",
  "ownerId": "665a1b2c3d4e5f6a7b8c9d0e",
  "phone": 9876543210,
  "isVerified": true,
  "autoLocation": {
    "type": "Point",
    "coordinates": [88.3639, 22.5726],
    "formattedAddress": "Park Street, Kolkata, WB 700016"
  },
  "isOpen": true,
  "createdAt": "2025-06-01T...",
  "updatedAt": "2025-06-02T..."
}
```

---

### MenuItem Model (`menuitems` collection)

| Field          | Type                      | Required | Default | Description          |
| -------------- | ------------------------- | -------- | ------- | -------------------- |
| `restaurantId` | ObjectId (ref Restaurant) | ✅        | -       | Parent restaurant    |
| `name`         | String                    | ✅        | -       | Dish name (trimmed)  |
| `description`  | String                    | ❌        | -       | Dish description     |
| `price`        | Number                    | ✅        | -       | Price in INR         |
| `imageUrl`     | String                    | ❌        | -       | Cloudinary image URL |
| `isAvailable`  | Boolean                   | ✅        | `true`  | Availability toggle  |

**Indexes:** `restaurantId: 1` (indexed).

---

### Cart Model (`carts` collection)

| Field          | Type                      | Required | Default | Description                  |
| -------------- | ------------------------- | -------- | ------- | ---------------------------- |
| `userId`       | ObjectId (ref User)       | ✅        | -       | Cart owner                   |
| `restaurantId` | ObjectId (ref Restaurant) | ✅        | -       | Restaurant of this cart item |
| `itemId`       | ObjectId (ref MenuItem)   | ✅        | -       | Menu item                    |
| `quantity`     | Number                    | ❌        | `1`     | Quantity (min: 1)            |

**Indexes:** Compound unique index on `{ userId, restaurantId, itemId }`.

---

### Address Model (`addresses` collection)

| Field                  | Type     | Required | Default   | Description             |
| ---------------------- | -------- | -------- | --------- | ----------------------- |
| `userId`               | String   | ✅        | -         | Address owner           |
| `mobile`               | Number   | ✅        | -         | Contact phone           |
| `formatedAddress`      | String   | ✅        | -         | Human-readable address  |
| `location.type`        | String   | ✅        | `"Point"` | GeoJSON type            |
| `location.coordinates` | [Number] | ✅        | -         | `[longitude, latitude]` |

**Indexes:** `location: "2dsphere"`.

---

### Order Model (`orders` collection)

| Field              | Type   | Required | Default     | Description                                                                |
| ------------------ | ------ | -------- | ----------- | -------------------------------------------------------------------------- |
| `userId`           | String | ✅        | -           | Customer ID                                                                |
| `restaurantId`     | String | ✅        | -           | Restaurant ID                                                              |
| `restaurantName`   | String | ✅        | -           | Denormalized restaurant name                                               |
| `riderId`          | String | ❌        | `null`      | Assigned rider ID                                                          |
| `riderPhoneNumber` | Number | ❌        | `null`      | Rider's phone                                                              |
| `riderName`        | String | ❌        | `null`      | Rider's name                                                               |
| `distance`         | Number | ✅        | -           | Distance in km (restaurant → customer)                                     |
| `riderAmount`      | Number | ✅        | -           | Rider's earning for this delivery                                          |
| `items[]`          | Array  | ✅        | -           | Array of `{ itemId, name, price, quantity }`                               |
| `subtotal`         | Number | -        | -           | Sum of (price × quantity)                                                  |
| `deliveryFee`      | Number | -        | -           | Calculated delivery charge                                                 |
| `platformFee`      | Number | -        | -           | Fixed ₹7                                                                   |
| `totalAmount`      | Number | -        | -           | Final total including GST                                                  |
| `addressId`        | String | ✅        | -           | Delivery address ID                                                        |
| `deliveryAddress`  | Object | ✅        | -           | Snapshot: `{ formatedAddress, mobile, customerName, latitude, longitude }` |
| `status`           | String | -        | `"placed"`  | Order lifecycle status                                                     |
| `paymentMethod`    | String | ✅        | -           | `"razorpay"` or `"stripe"`                                                 |
| `paymentStatus`    | String | -        | `"pending"` | `"pending"`, `"paid"`, or `"failed"`                                       |
| `expiresAt`        | Date   | -        | -           | TTL: auto-deletes unpaid orders after 15 minutes                           |

**Status Values:** `placed` → `accepted` → `preparing` → `ready_for_rider` → `rider_assigned` → `picked_up` → `out_for_delivery` → `reached_delivery_location` → `delivered` | `cancelled`

---

### Rider Model (`riders` collection)

| Field                  | Type     | Required   | Default      | Description             |
| ---------------------- | -------- | ---------- | ------------ | ----------------------- |
| `userId`               | String   | ✅ (unique) | -            | User ID                 |
| `picture`              | String   | ❌          | -            | Cloudinary photo URL    |
| `phoneNumber`          | String   | ✅          | -            | Contact phone           |
| `aadhaarNumber`        | String   | ✅          | -            | Government ID (Aadhaar) |
| `drivingLicesce`       | String   | ✅          | -            | Driving license number  |
| `isVerified`           | Boolean  | ✅          | `false`      | Admin verification      |
| `location.type`        | String   | ✅          | `"Point"`    | GeoJSON type            |
| `location.coordinates` | [Number] | ✅          | -            | `[longitude, latitude]` |
| `isAvailable`          | Boolean  | ✅          | `false`      | Online/offline toggle   |
| `lastActiveAt`         | Date     | ✅          | `Date.now()` | Last activity timestamp |

**Indexes:** `location: "2dsphere"`.

---

## ❗ Error Handling System

### Global TryCatch Handler

Every controller is wrapped with the `TryCatch` higher-order function:

```typescript
export const TryCatch = (handler: RequestHandler): RequestHandler => {
    return async (req, res, next) => {
        try {
            await handler(req, res, next);
        } catch (error: any) {
            const body = {
                success: false,
                message: error.message || "Something went wrong",
                error: true,
                data: {}
            };
            if (process.env.NODE_ENV === "development") body["stack"] = error.stack;
            return res.status(500).json(body);
        }
    };
};
```

**Key features:**
-   Catches all unhandled errors in controllers
-   Returns consistent error response format
-   Includes stack trace in development mode
-   Prevents server crashes from uncaught promise rejections

### Error Response Categories

| Category            | Status | Example Message                             |
| ------------------- | ------ | ------------------------------------------- |
| Validation          | 400    | `"Name and price are required fields"`      |
| Authentication      | 401    | `"Unauthorized - No Auth Token in Headers"` |
| Authorization       | 403    | `"Forbidden - Seller access only"`          |
| Not Found           | 404    | `"Restaurant not found"`                    |
| Conflict            | 409    | `"Rider profile already exists"`            |
| Service Unavailable | 503    | `"Service temporarily unavailable"`         |
| Internal Error      | 500    | `"Something went wrong"`                    |

### JWT-Specific Errors

```typescript
if (error instanceof jwt.TokenExpiredError) {
    // 401 — "Token expired"
}
if (error instanceof jwt.JsonWebTokenError) {
    // 401 — "Invalid token"
}
```

### Process-Level Error Handling

```typescript
process.on("unhandledRejection", (reason) => {
    console.error("[Auth] Unhandled Rejection:", reason);
});
```

---

## 🔄 Middleware Explanation

### 1. `isAuthenticated` — JWT Validation Middleware

**Used in:** Auth, Restaurant, Rider services

**Flow:**
1. Skips `OPTIONS` requests (CORS preflight)
2. Extracts `Authorization: Bearer <token>` header
3. Verifies JWT with shared `JWT_SECRET`
4. Attaches decoded user to `req.user`
5. Returns `401` for missing/invalid/expired tokens

### 2. `isSeller` — Role Guard Middleware

**Used in:** Restaurant service (restaurant management routes)

```typescript
if (!user || user.role !== "seller") {
    return 403 — "Forbidden - Seller access only"
}
```

### 3. `checkBlocked` — Block Status Middleware

**Used in:** Restaurant, Rider services

**Flow:**
1. Looks up user in database by ID
2. If `isBlocked === true` and `blockedUntil > now` → return `403`
3. If block period expired → auto-unblock (set `isBlocked: false`)
4. Otherwise → continue

### 4. `isAdminAuthenticated` — Admin JWT Guard

**Used in:** Admin service

Verifies the JWT contains `role: "admin"`. Rejects all non-admin tokens.

### 5. `TryCatchHandler` — Error Wrapper

Wraps all async controller functions to catch errors and return consistent responses. See [Error Handling](#-error-handling-system).

### 6. `multer` — File Upload

Configured with `memoryStorage()` for processing file uploads (restaurant images, menu photos, rider photos). Files are converted to DataURI and uploaded to Cloudinary.

### 7. CORS Configuration

Each service configures CORS to allow requests from `ALLOWED_ORIGINS` (typically `http://localhost:5173`):

```typescript
app.use(cors(corsOptions));
app.options("/{*path}", cors(corsOptions));
app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");
    next();
});
```

### 8. Internal Service Key Validation

For inter-service calls, the `x-internal-key` header is checked against `INTERNAL_SERVICE_KEY`:

```typescript
if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({ success: false, message: "Forbidden" });
}
```

---

## 🧠 Business Logic

### Architecture Overview

```
User → Frontend (React) → API Call (Axios) → Backend (Express) → Database (MongoDB)
                                                     ↓
                                              Cloudinary (Images)
                                                     ↓
                                              RabbitMQ (Events)
                                                     ↓
                                              Socket.IO (Realtime)
```

### Backend Layers

```
Routes → Middleware (Auth + Role + Block Check) → Controllers → Models → Database
```

### Cart System

1. **Single-Restaurant Enforcement:** A user's cart can only contain items from **one restaurant** at a time. Adding an item from a different restaurant returns a `400` error.
2. **Upsert Logic:** Adding an item that already exists in the cart increments its quantity (using `$inc`).
3. **Availability Check:** Items marked `isAvailable: false` cannot be added.
4. **Decrement/Remove:** Decrementing an item with quantity `1` removes it from the cart entirely.

### Order System

#### Order Creation
1. Validate address and cart
2. Verify restaurant is open
3. Calculate fees:
   - **Subtotal** = sum of (item price × quantity)
   - **Delivery Fee** = Free for orders ≥ ₹250, otherwise: ₹35 base + ₹9/km after 3km
   - **Platform Fee** = Fixed ₹7
   - **GST** = 5% on food + 18% on delivery
   - **Total** = Subtotal + Delivery + Platform + GST
4. Calculate **rider amount** (earnings): ₹35 base + ₹9/km after 3km
5. Create order with `expiresAt` = 15 minutes (TTL index auto-deletes unpaid orders)
6. Clear user's cart

#### Order Status Flow

```
                                    ┌──────────────────────────────────────────────────────────────────────────────────────────┐
                                    │                              ORDER LIFECYCLE                                           │
                                    └──────────────────────────────────────────────────────────────────────────────────────────┘

[Order Created] → placed → accepted → preparing → ready_for_rider → rider_assigned → picked_up → out_for_delivery → reached_delivery_location → delivered ✅
                    │         │                        ↓
                    │         │              Publishes RabbitMQ event
                    │         │              (ORDER_READY_FOR_RIDER)
                    ↓         ↓
                 cancelled (Admin)
```

**Who controls each transition:**

```
Seller:  placed → accepted → preparing → ready_for_rider
Rider:   rider_assigned → picked_up → out_for_delivery → reached_delivery_location → delivered
Admin:   placed → cancelled | accepted → cancelled
System:  ready_for_rider → rider_assigned (via RabbitMQ + auto-dispatch)
```

### Payment Flow

```
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

### Rider Dispatch System

```
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

### Delivery Proximity Verification

```
┌──────────────────────────────────────────────────────────────────────────┐
│                   DELIVERY CONFIRMATION                                  │
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

---

## 👥 Role-Based Access Control

### Role Hierarchy

| Role                     | Capabilities                                                                                                                                               |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Unauthenticated**      | Login page only                                                                                                                                            |
| **Unassigned (no role)** | Select role page only                                                                                                                                      |
| **Customer**             | Browse restaurants, search food, manage cart, place orders, track delivery, manage addresses                                                               |
| **Seller**               | Create/manage restaurant, add/edit/delete menu items, process orders (accept → preparing → ready), toggle restaurant open/close                            |
| **Rider**                | Create rider profile, toggle availability, accept orders, update delivery status, view delivery history                                                    |
| **Admin**                | Dashboard stats, manage all users (view, block/unblock), manage restaurants (verify, delete), manage riders (verify, delete), manage orders (view, cancel) |

### Blocking/Unblocking Logic

-   Admin can **block** any user for **7 days** (`BLOCK_DURATION_MS = 7 * 24 * 60 * 60 * 1000`)
-   Blocked users:
    -   Cannot create restaurants or menu items
    -   Cannot toggle restaurant status
    -   Cannot place orders
    -   Cannot toggle rider availability
    -   Cannot accept orders
-   After 7 days, `checkBlocked` middleware **auto-unblocks** the user
-   Admin can manually **unblock** before the period ends
-   Block events are published to RabbitMQ for cross-service propagation

### Access Restrictions by Middleware Chain

| Route Pattern                   | Middleware Chain                               |
| ------------------------------- | ---------------------------------------------- |
| `POST /restaurants`             | `isAuthenticated → isSeller → checkBlocked`    |
| `PATCH /orders/:id/status`      | `isAuthenticated → isSeller → checkBlocked`    |
| `POST /orders`                  | `isAuthenticated → checkBlocked`               |
| `POST /riders`                  | `isAuthenticated` (role checked in controller) |
| `PATCH /riders/me/availability` | `isAuthenticated → checkBlocked`               |
| Admin routes                    | `isAdminAuthenticated`                         |
| Internal routes                 | `x-internal-key` header check                  |

---

## 📦 API Response Format Standard

All API responses follow a **consistent JSON structure**:

### Success Response

```json
{
  "success": true,
  "message": "Descriptive success message",
  "error": false,
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Descriptive error message",
  "error": true,
  "data": {}
}
```

### Paginated Response (Admin)

```json
{
  "success": true,
  "message": "Items fetched successfully",
  "error": false,
  "data": {
    "items": [ ... ],
    "total": 150,
    "page": 1,
    "pages": 8
  }
}
```

### Response with Token (Auth)

```json
{
  "success": true,
  "message": "Login successful",
  "error": false,
  "token": "eyJhbGciOi...",
  "data": { ... }
}
```

### HTTP Status Code Usage

| Code  | Usage                                                   |
| ----- | ------------------------------------------------------- |
| `200` | Successful operation                                    |
| `201` | Resource created                                        |
| `400` | Bad request / Validation error                          |
| `401` | Unauthorized (missing/invalid token)                    |
| `403` | Forbidden (wrong role / blocked / invalid internal key) |
| `404` | Resource not found                                      |
| `409` | Conflict (duplicate resource)                           |
| `500` | Internal server error                                   |
| `503` | Service unavailable (DB not connected)                  |

---

## 🌍 Deployment Guide

### Backend Deployment (All Microservices)

Each service is a standalone Node.js application. Recommended deployment targets:

| Platform                   | Best For                                    |
| -------------------------- | ------------------------------------------- |
| **Docker + VPS**           | Production-grade with containerization ✅     |
| **Railway / Render**       | Quick deployment with free tiers            |
| **AWS EC2 / DigitalOcean** | Full control with Docker                    |
| **Heroku**                 | Easy deployment with Git Push               |

#### Option 1: Deploy with Docker (Recommended)

```bash
# Pull pre-built images from Docker Hub
docker pull samratmallick/abarakhabo-admin:latest
docker pull samratmallick/abarakhabo-auth:latest
docker pull samratmallick/abarakhabo-realtime:latest
docker pull samratmallick/abarakhabo-restaurant:latest
docker pull samratmallick/abarakhabo-rider:latest
docker pull samratmallick/abarakhabo-utilities:latest

# Run each service with its env file
docker run -d --name auth -p 8000:8000 --env-file ./services/auth/.env \
  samratmallick/abarakhabo-auth:latest

docker run -d --name restaurant -p 9000:9000 --env-file ./services/restaurant/.env \
  samratmallick/abarakhabo-restaurant:latest

docker run -d --name rider -p 7000:7000 --env-file ./services/rider/.env \
  samratmallick/abarakhabo-rider:latest

docker run -d --name admin -p 6001:6001 --env-file ./services/admin/.env \
  samratmallick/abarakhabo-admin:latest

docker run -d --name utilities -p 8888:8888 --env-file ./services/utilities/.env \
  samratmallick/abarakhabo-utilities:latest

docker run -d --name realtime -p 9999:9999 --env-file ./services/realtime/.env \
  samratmallick/abarakhabo-realtime:latest
```

#### Option 2: Deploy Without Docker

1. **Build TypeScript:**
   ```bash
   cd services/<service-name>
   npm run build
   ```
2. **Set Environment Variables** on your hosting platform
3. **Start:**
   ```bash
   npm start  # runs "node dist/index.js"
   ```

#### Production Checklist:

- [ ] Set `NODE_ENV=production` in all services
- [ ] Use MongoDB Atlas (production cluster with TLS)
- [ ] Use managed RabbitMQ (e.g., CloudAMQP)
- [ ] Update `ALLOWED_ORIGINS` to your production frontend URL
- [ ] Use TLS/HTTPS for all services
- [ ] Update `CLIENT_URL` in Utilities service for Stripe redirects
- [ ] Update all `VITE_API_URL_*` variables in the frontend `.env`
- [ ] Set up `DOCKERHUB_TOKEN` secret in GitHub repo for CI/CD

### Frontend Deployment

```bash
cd client
npm run build
```

This generates a `dist/` directory. Deploy it to:

| Platform                | Command / Method                       |
| ----------------------- | -------------------------------------- |
| **Vercel**              | `vercel --prod` (auto-detects Vite)    |
| **Netlify**             | Drag & drop `dist/` or Git integration |
| **AWS S3 + CloudFront** | Upload `dist/` to S3 bucket            |
| **GitHub Pages**        | Use `gh-pages` package                 |

> ⚠️ For SPA routing, configure your hosting to redirect all routes to `index.html`.

### RabbitMQ in Production

Use a managed service:
- [CloudAMQP](https://www.cloudamqp.com/) — Free tier available
- Update all `RABITMQ_URL` variables with the managed instance URL

---

## 🔮 Future Improvements

### Feature Enhancements

| Feature                 | Description                                                 |
| ----------------------- | ----------------------------------------------------------- |
| 📱 Push Notifications    | Firebase Cloud Messaging for order updates                  |
| 💬 In-App Chat           | Customer ↔ Rider real-time messaging                        |
| ⭐ Ratings & Reviews     | Post-delivery restaurant/rider ratings                      |
| 🏷️ Promo Codes / Coupons | Discount system with validation                             |
| 🔍 Advanced Search       | Filter by cuisine, price range, rating, dietary preferences |
| 📊 Seller Analytics      | Revenue charts, popular items, order trends                 |
| 🌐 Full i18n             | Complete multilingual support (Bengali, Hindi, English)     |
| 📋 Order History Export  | PDF/CSV export for customers and sellers                    |
| 🔔 Email Notifications   | Transactional emails for order confirmations                |
| 🛒 Multi-Restaurant Cart | Allow items from multiple restaurants in one order          |

### Performance Improvements

| Area                       | Improvement                                                        |
| -------------------------- | ------------------------------------------------------------------ |
| 🗄️ Caching                  | Redis layer for frequently accessed data (restaurant lists, menus) |
| 📖 Connection Pooling       | Optimize MongoDB connections per service                           |
| 📸 Image Optimization       | WebP conversion + CDN caching for Cloudinary images                |
| 🔄 Database Indexing        | Additional compound indexes for complex queries                    |
| 📦 API Response Compression | gzip/Brotli compression middleware                                 |

### Scalability Ideas

| Area                  | Status | Improvement                                                  |
| --------------------- | ------ | ------------------------------------------------------------ |
| 🐳 Docker              | ✅ Done | All services containerized with multi-stage builds           |
| 📤 CI/CD               | ✅ Done | GitHub Actions for automated Docker builds & pushes          |
| 🐳 Docker Compose      | 🔜     | Unified multi-service orchestration with a single command    |
| ☸️ Kubernetes          | 🔜     | Orchestrate microservices at scale                           |
| 🔀 API Gateway         | 🔜     | Nginx/Kong as a single entry point with rate limiting        |
| 📊 Monitoring          | 🔜     | Prometheus + Grafana for service health monitoring           |
| 📝 Centralized Logging | 🔜     | ELK stack or Datadog for log aggregation                     |
| 🧪 Testing             | 🔜     | Unit tests (Jest), integration tests, E2E tests (Playwright) |

---

## 🤝 Contribution Guide

We welcome contributions! Here's how to get started:

### How to Contribute

1. **Fork** the repository
2. **Clone** your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/abar-khabo-online-food-dellivery-application.git
   ```
3. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make your changes** following the coding conventions
5. **Test** your changes locally
6. **Commit** with a descriptive message
7. **Push** and create a **Pull Request**

### Branch Naming Conventions

| Type          | Pattern                  | Example                      |
| ------------- | ------------------------ | ---------------------------- |
| Feature       | `feature/<description>`  | `feature/push-notifications` |
| Bug Fix       | `fix/<description>`      | `fix/cart-quantity-bug`      |
| Hotfix        | `hotfix/<description>`   | `hotfix/payment-crash`       |
| Documentation | `docs/<description>`     | `docs/api-documentation`     |
| Refactor      | `refactor/<description>` | `refactor/order-controller`  |

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]
[optional footer]
```

**Examples:**
```
feat(cart): add multi-restaurant warning dialog
fix(order): resolve delivery fee calculation for >10km
docs(readme): add API documentation for rider service
refactor(auth): extract token generation to utility
chore(deps): update express to v5.2.1
```

### Coding Conventions

-   **TypeScript** for all backend services and frontend code
-   **ESLint** for linting (pre-configured in `eslint.config.js`)
-   **Consistent Response Format** — Always use `{ success, message, error, data }`
-   **Middleware Pattern** — Use `TryCatch` wrapper for all async controllers
-   **No `console.log` in production** — Use proper logging levels

---

## 📜 License

This project is licensed under the **MIT License**.

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

<p align="center">
  Made with ❤️ by <a href="https://github.com/samratmallick-dev">Abar Khabo Team - (Samrat Mallick)</a>
</p>
