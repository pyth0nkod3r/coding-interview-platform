#!/bin/sh
set -e

echo "=== Interview Platform Startup ==="

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting backend server..."
node dist/server.js &

# Wait a moment for backend to start
sleep 2

echo "Starting nginx..."
nginx -g "daemon off;"
