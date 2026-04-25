#!/bin/sh
set -e

echo "Running database migrations..."
cd /app/apps/web
mkdir -p prisma/data
NODE_PATH=/prisma-cli/node_modules node /prisma-cli/node_modules/prisma/build/index.js migrate deploy

if [ -n "$SEED_ADMIN_EMAIL" ]; then
  echo "Running production seed..."
  node /app/apps/web/prisma/seed.prod.mjs
fi

echo "Starting VectorOps..."
exec node /app/apps/web/server.js
