# ─── Stage 1: Build Vite App ──────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files for the monorepo root and ALL workspaces
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/api-gateway/package.json ./apps/api-gateway/

# Build arguments for Vite injection
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Install dependencies
RUN npm install --workspace=@warzone/web

# Copy source
COPY apps/web ./apps/web

# Build the production Vite bundle
RUN npm run build --workspace=@warzone/web

# ─── Stage 2: Serve with Nginx ────────────────────────────
FROM nginx:alpine AS runner

# Copy the built frontend
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copy Nginx SPA config (handles React Router client-side routing)
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
