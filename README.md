# WARZONE Backend

This is the central API microservice hub for the WARZONE Live Fan War platform.

## Architecture (Phase 1)
- Fastify + TypeScript
- Prisma ORM (SQLite for local dev -> migrating to Aurora PostgreSQL)
- JWT Authentication

## Local Development Setup

**1. Install Dependencies**
```bash
npm install
```

**2. Setup Environment Variables**
Copy `.env.example` to `.env` inside `apps/api-gateway/`:
```bash
cp apps/api-gateway/.env.example apps/api-gateway/.env
```
*(The defaults are ready for local use out of the box).*

**3. Database Setup**
We are currently using SQLite locally (`dev.db`). No Docker Postgres required yet.
```bash
cd apps/api-gateway
npx prisma db push
npx tsx prisma/seed.ts # Seeds the 10 IPL armies
```

**4. Start Infrastructure Services (Optional if not using real Redis yet)**
```bash
docker-compose up -d
```

**5. Start the Server (Hot Reloading via Turborepo)**
From the **root folder** of the monorepo:
```bash
npm run dev
```
*Or directly from the gateway app:*
```bash
cd apps/api-gateway
npx tsx watch src/server.ts
```

Server should be available at `http://localhost:3000`.

## Testing Output
You can verify the system via health check:
```bash
curl http://localhost:3000/health
```

Run test suite:
```bash
cd apps/api-gateway
npx vitest run
npx tsx scripts/test-auth.ts
```
