#!/bin/sh
set -e

echo "=== Interview Platform Startup ==="

echo "Running database migrations..."
./node_modules/.bin/prisma migrate deploy

echo "Starting services with supervisor..."
exec supervisord -c /etc/supervisor/conf.d/supervisord.conf
