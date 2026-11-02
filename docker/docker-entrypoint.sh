#!/bin/sh
set -e

# Ensure data and public/uploads directories exist
mkdir -p /app/data /app/public/uploads

# Ensure full read/write permissions for both nextjs user and container
chown -R nextjs:nodejs /app/data /app/public/uploads 2>/dev/null || true
chmod -R 777 /app/data /app/public/uploads 2>/dev/null || true

# Run Prisma schema push on startup
if [ -n "$DATABASE_URL" ]; then
  echo "=> Syncing database schema with Prisma..."
  su-exec nextjs npx prisma db push --skip-generate || echo "Prisma db push failed, continuing startup..."
fi

echo "=> Starting CRIC E-Service Portal as nextjs user..."
exec su-exec nextjs "$@"
