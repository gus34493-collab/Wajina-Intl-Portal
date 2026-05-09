#!/bin/sh
set -e

# Wait for database connection if needed (optional for Neon as it's always up)
echo "[entrypoint] Running Prisma migrations..."
node ./node_modules/prisma/build/index.js migrate deploy

echo "[entrypoint] Starting Next.js server..."
exec node server.js
