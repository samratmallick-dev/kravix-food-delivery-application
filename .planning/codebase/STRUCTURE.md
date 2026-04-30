# Codebase Structure

**Analysis Date:** 2026-04-30

## Directory Layout

```
abar-khabo/
├── client/                 # React Frontend (Vite)
│   ├── src/                # Frontend source code
│   │   ├── admin/          # Admin-specific components & context
│   │   ├── components/     # Shared UI components
│   │   ├── context/        # State management (Context API)
│   │   ├── pages/          # Route-level components
│   │   └── utils/          # Frontend helpers
├── services/               # Microservices Backend
│   ├── admin/              # Management of users, restaurants, riders
│   ├── auth/               # User authentication & registration
│   ├── realtime/           # Socket.IO event broadcasting
│   ├── restaurant/         # Menu management & order processing
│   ├── rider/              # Delivery tracking & management
│   └── utilities/          # Payments (Stripe/Razorpay) & Cloudinary
├── .agent/                 # GSD configuration & skills
└── .planning/              # Project memory & documentation
```

## Directory Purposes

**client/**
- Purpose: User-facing React application.
- Contains: TypeScript components, CSS, assets.
- Key files: `App.tsx` (routing), `main.tsx` (entry).

**services/auth/**
- Purpose: Handles user/admin/rider authentication.
- Contains: Google OAuth integration, JWT generation.
- Key files: `src/controllers/user.controller.ts`.

**services/restaurant/**
- Purpose: Core business logic for restaurants and menus.
- Contains: Order processing, menu CRUD.
- Key files: `src/config/paymentConsumer.ts` (listens for payments).

**services/realtime/**
- Purpose: Centralized socket server.
- Contains: Socket.io logic for real-time order status updates.
- Key files: `src/config/socket.ts`.

**services/utilities/**
- Purpose: Shared utility services.
- Contains: Payment gateway integrations, image upload logic.
- Key files: `src/routes/payment.routes.ts`.

## Key File Locations

**Entry Points:**
- `client/src/main.tsx` - Frontend entry.
- `services/*/src/index.ts` - Backend service entry points.

**Configuration:**
- `services/*/.env` - Service-specific environment variables.
- `client/.env` - Frontend environment variables.
- `services/*/tsconfig.json` - Backend TypeScript configuration.
- `client/vite.config.ts` - Frontend build configuration.

**Core Logic:**
- `services/*/src/controllers/` - Main business logic handlers.
- `services/*/src/model/` - Mongoose database schemas.

## Naming Conventions

**Files:**
- `kebab-case.ts` - Preferred for all modules and utility files.
- `PascalCase.tsx` - Preferred for React components.
- `*.routes.ts` - Suffix for route definition files.
- `*.controller.ts` - Suffix for request handler files.

**Directories:**
- `kebab-case` - All directories in lowercase.
- Plural names for collections (e.g., `controllers`, `models`, `routes`).

## Where to Add New Code

**New Microservice:**
- Implementation: Create new folder in `services/`.
- Must include: `package.json`, `tsconfig.json`, `Dockerfile`, `src/index.ts`.

**New Frontend Page:**
- Implementation: `client/src/pages/`.
- Routes: Update `client/src/App.tsx`.

**New Backend API:**
- Route: `services/*/src/routes/`.
- Handler: `services/*/src/controllers/`.
- Model: `services/*/src/model/`.

## Special Directories

**.agent/**
- Purpose: GSD system resources.
- Committed: Yes.

**.planning/**
- Purpose: Project memory, roadmap, and codebase maps.
- Committed: Yes.

---

*Structure analysis: 2026-04-30*
*Update when directory structure changes*
