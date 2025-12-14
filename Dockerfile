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

# Install ALL dependencies (including devDeps for prisma CLI)
RUN npm ci

# Generate Prisma client using direct binary path (ensures we use installed version)
RUN ./node_modules/.bin/prisma generate

# Copy source code
COPY backend/ .

# Build TypeScript
RUN npm run build

# Production Stage
FROM node:20-alpine AS production

# Install OpenSSL for Prisma, nginx, and supervisor
RUN apk add --no-cache openssl nginx supervisor

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Install production dependencies (now includes prisma CLI)
RUN npm ci --omit=dev

# Generate Prisma client using direct binary path
RUN ./node_modules/.bin/prisma generate

# Copy backend build from builder stage
COPY --from=backend-builder /app/backend/dist ./dist

# Copy frontend build to nginx html directory
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.unified.conf /etc/nginx/http.d/default.conf

# Copy supervisor configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create log directory for supervisor
RUN mkdir -p /var/log

# Expose port 80 (nginx)
EXPOSE 80

# Start services via supervisor
ENTRYPOINT ["/docker-entrypoint.sh"]

