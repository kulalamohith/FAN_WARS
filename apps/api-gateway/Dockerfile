# ─── Stage 1: Build ───────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files for the monorepo root and ALL workspaces
COPY package.json package-lock.json ./
COPY apps/api-gateway/package.json ./apps/api-gateway/
COPY apps/web/package.json ./apps/web/

# Install dependencies (npm handles the workspace graph correctly when all package.jsons are present)
RUN npm install --workspace=@warzone/api-gateway

# Copy source
COPY apps/api-gateway ./apps/api-gateway

# Generate Prisma client
RUN npx prisma generate --schema apps/api-gateway/prisma/schema.prisma

# Compile TypeScript
RUN npm run build --workspace=@warzone/api-gateway

# ─── Stage 2: Production Runtime ──────────────────────────
FROM node:20-alpine AS runner

# Non-root user for security
RUN addgroup -S warzone && adduser -S warzone -G warzone

WORKDIR /app

# Copy built app and ALL node_modules with correct ownership
COPY --from=builder --chown=warzone:warzone /app/apps/api-gateway/dist ./dist
COPY --from=builder --chown=warzone:warzone /app/apps/api-gateway/package.json ./package.json
COPY --from=builder --chown=warzone:warzone /app/apps/api-gateway/prisma ./prisma
COPY --from=builder --chown=warzone:warzone /app/node_modules ./node_modules
COPY --from=builder --chown=warzone:warzone /app/apps/api-gateway/node_modules ./apps/api-gateway/node_modules

USER warzone

EXPOSE 3000

# Run database push to ensure schema is up-to-date, then start the cluster
CMD npx prisma db push --accept-data-loss --schema prisma/schema.prisma && node dist/cluster.js
