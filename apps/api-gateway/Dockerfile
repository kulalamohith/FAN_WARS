# ─── Stage 1: Build ───────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files for the monorepo root and api-gateway
COPY package.json package-lock.json ./
COPY apps/api-gateway/package.json ./apps/api-gateway/

# Install ALL dependencies (including devDependencies for build)
RUN npm install --workspace=@warzone/api-gateway

# Copy source
COPY apps/api-gateway ./apps/api-gateway

# Generate Prisma client
RUN npx --prefix apps/api-gateway prisma generate

# Compile TypeScript
RUN npm run build --workspace=@warzone/api-gateway

# ─── Stage 2: Production Runtime ──────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Only copy what's needed to run
COPY --from=builder /app/apps/api-gateway/dist ./dist
COPY --from=builder /app/apps/api-gateway/package.json ./package.json
COPY --from=builder /app/apps/api-gateway/node_modules ./node_modules
COPY --from=builder /app/apps/api-gateway/prisma ./prisma

# Non-root user for security
RUN addgroup -S warzone && adduser -S warzone -G warzone
USER warzone

EXPOSE 3000

# Run database push to ensure schema is up-to-date, then start the cluster
CMD npx prisma db push --accept-data-loss && node dist/cluster.js
