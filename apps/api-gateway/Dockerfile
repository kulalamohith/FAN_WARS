# ─── Stage 1: Build ───────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files for the monorepo root and ALL workspaces
COPY package.json package-lock.json ./
COPY apps/api-gateway/package.json ./apps/api-gateway/
COPY apps/web/package.json ./apps/web/

# Full install for building
RUN npm install

# Copy source and build
COPY apps/api-gateway ./apps/api-gateway
RUN npx prisma generate --schema apps/api-gateway/prisma/schema.prisma
RUN npm run build --workspace=@warzone/api-gateway

# ─── Stage 2: Production Runtime ──────────────────────────
FROM node:20-alpine AS runner

# Install OpenSSL for Prisma engines
RUN apk add --no-cache openssl

# Non-root user for security
RUN addgroup -S warzone && adduser -S warzone -G warzone

WORKDIR /app

# Copy package files again to perform a fresh production install
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/apps/api-gateway/package.json ./apps/api-gateway/package.json
COPY --from=builder /app/apps/api-gateway/prisma ./prisma

# Install ONLY production dependencies for the api-gateway workspace
# This ensures a correct, stable node_modules structure in the final image.
RUN npm install --omit=dev --workspace=@warzone/api-gateway

# Copy built code
COPY --from=builder --chown=warzone:warzone /app/apps/api-gateway/dist ./dist

# Ensure directory is owned by warzone
RUN chown -R warzone:warzone /app

USER warzone

EXPOSE 3000

# Run database push then start
CMD npx prisma db push --accept-data-loss --schema prisma/schema.prisma && node dist/cluster.js
