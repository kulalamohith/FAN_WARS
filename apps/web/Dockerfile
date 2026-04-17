# ─── Stage 1: Build Vite App ──────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/

RUN npm install --workspace=@warzone/web

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
