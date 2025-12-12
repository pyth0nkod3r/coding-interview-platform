# Build Stage 1: Frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY frontend/ .

# Build the frontend
RUN npm run build

# Build Stage 2: Backend
FROM node:20-alpine AS backend-builder

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app/backend

# Copy package files and prisma schema
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma client (use installed version, not latest)
RUN npm exec -- prisma generate

# Copy source code
COPY backend/ .

# Build TypeScript
RUN npm run build

# Production Stage
FROM node:20-alpine AS production

# Install OpenSSL for Prisma and nginx
RUN apk add --no-cache openssl nginx

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Install production dependencies only
RUN npm ci --omit=dev

# Generate Prisma client for production (use installed version)
RUN npm exec -- prisma generate

# Copy backend build from builder stage
COPY --from=backend-builder /app/backend/dist ./dist

# Copy frontend build to nginx html directory
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.unified.conf /etc/nginx/http.d/default.conf

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port 80 (nginx)
EXPOSE 80

# Start both services
ENTRYPOINT ["/docker-entrypoint.sh"]
