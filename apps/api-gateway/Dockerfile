# ─── Stage 1: Build ───────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files for the monorepo root and ALL workspaces
COPY package.json package-lock.json ./
COPY apps/api-gateway/package.json ./apps/api-gateway/
COPY apps/web/package.json ./apps/web/

# Install ALL dependencies to ensure correct hoisting and resolution
RUN npm install

# Copy source
COPY apps/api-gateway ./apps/api-gateway

# Generate Prisma client
RUN npx prisma generate --schema apps/api-gateway/prisma/schema.prisma

# Compile TypeScript
RUN npm run build --workspace=@warzone/api-gateway

# Prune dev dependencies AFTER build to keep runner small but complete
RUN npm prune --omit=dev

# ─── Stage 2: Production Runtime ──────────────────────────
FROM node:20-alpine AS runner

# Install OpenSSL for Prisma engines
RUN apk add --no-cache openssl

# Non-root user for security
RUN addgroup -S warzone && adduser -S warzone -G warzone

WORKDIR /app

# Copy built app and production node_modules with correct ownership
COPY --from=builder --chown=warzone:warzone /app/apps/api-gateway/dist ./dist
COPY --from=builder --chown=warzone:warzone /app/apps/api-gateway/package.json ./package.json
COPY --from=builder --chown=warzone:warzone /app/apps/api-gateway/prisma ./prisma
COPY --from=builder --chown=warzone:warzone /app/node_modules ./node_modules

# Ensure directory is writable for Prisma (if needed) and owned by warzone
RUN chown -R warzone:warzone /app

USER warzone

EXPOSE 3000

# Run database push to ensure schema is up-to-date, then start the cluster
CMD npx prisma db push --accept-data-loss --schema prisma/schema.prisma && node dist/cluster.js
