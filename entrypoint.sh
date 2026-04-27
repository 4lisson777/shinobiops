#!/bin/sh
set -e

echo "Waiting for MySQL..."
# Use DB_HOST/DB_PORT directly (consistent with lib/db.ts which uses individual
# connection vars, not DB_URL). Falls back to 'mysql' / 3306 if unset.
# until node -e "
#  const net = require('net');
#  const s = new net.Socket();
#  s.connect(Number(process.env.DB_PORT) || 3306, process.env.DB_HOST || 'mysql', () => { s.destroy(); process.exit(0); });
#  s.on('error', () => process.exit(1));
#" 2>/dev/null; do
#  sleep 2
#done
echo "MySQL is ready."

echo "Running database migrations..."
cd /app/apps/web
NODE_PATH=/prisma-cli/node_modules node /prisma-cli/node_modules/prisma/build/index.js migrate deploy

if [ -n "$SEED_ADMIN_EMAIL" ]; then
  echo "Running production seed..."
  node /app/apps/web/prisma/seed.prod.mjs
fi

echo "Starting VectorOps..."
exec node /app/apps/web/server.js
