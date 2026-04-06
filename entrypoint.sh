#!/bin/sh
set -e

echo "Running database migrations..."
cd /app/apps/web
npx prisma migrate deploy

echo "Starting ShinobiOps..."
cd /app
exec node apps/web/server.js
