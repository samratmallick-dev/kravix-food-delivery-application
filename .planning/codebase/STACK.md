# Technology Stack

**Analysis Date:** 2026-04-30

## Languages

**Primary:**
- TypeScript 5.9.x - All application code (client and services)

**Secondary:**
- JavaScript - Configuration files (ESLint, etc.)

## Runtime

**Environment:**
- Node.js 20.x+ - All services and client development
- Browser - Client application execution

**Package Manager:**
- npm 10.x+
- Lockfile: `package-lock.json` present in all directories

## Frameworks

**Core:**
- React 19.x - Frontend UI framework
- Express 5.x - Service backend framework
- Socket.io 4.x - Real-time communication

**Testing:**
- None detected (no test scripts in package.json)

**Build/Dev:**
- Vite 7.x - Client bundling and dev server
- TypeScript Compiler (tsc) - Service compilation

## Key Dependencies

**Critical:**
- `mongoose` ^8.x/9.x - MongoDB ODM for all services
- `amqplib` ^0.10.x - RabbitMQ client for service messaging
- `socket.io-client` ^4.x - Real-time client for React
- `axios` ^1.x - HTTP client for client and inter-service calls
- `jsonwebtoken` ^9.x - JWT authentication
- `react-router-dom` ^7.x - Client-side routing

**Infrastructure:**
- `dotenv` - Environment variable management
- `cors` - Cross-Origin Resource Sharing
- `bcryptjs` - Password hashing

## Configuration

**Environment:**
- `.env` files in each service and client directory
- Key configs: `MONGO_URI`, `RABITMQ_URL`, `JWT_SECRET`, `ALLOWED_ORIGINS`

**Build:**
- `vite.config.ts` - Client build config
- `tsconfig.json` - TypeScript configuration (NodeNext module resolution in services)
- `eslint.config.js` - Linting configuration

## Platform Requirements

**Development:**
- Windows (detected from workspace info)
- Node.js and npm installed

**Production:**
- Dockerized (detected `Dockerfile` and `.dockerignore` in services)
- Likely deployed as a microservices cluster (Kubernetes/ECS)

---

*Stack analysis: 2026-04-30*
*Update after major dependency changes*
