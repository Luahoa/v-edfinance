#!/bin/bash
# Kamal Pre-Deploy Hook
# Runs database migrations before deploying new version

set -e

echo "🔄 Running pre-deployment checks..."

# Check database connectivity
echo "📊 Checking database connection..."
if ! docker exec v-edfinance-postgres pg_isready -U postgres > /dev/null 2>&1; then
  echo "❌ Database is not ready!"
  exit 1
fi

echo "✅ Database is ready"

# Run Prisma migrations
echo "🗄️ Running database migrations..."
docker run --rm \
  --network private \
  -e DATABASE_URL="${DATABASE_URL}" \
  ghcr.io/luaho/v-edfinance:latest \
  npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma

echo "✅ Migrations completed"

# Optional: Seed data for production (if needed)
# docker run --rm \
#   --network private \
#   -e DATABASE_URL="${DATABASE_URL}" \
#   ghcr.io/luaho/v-edfinance:latest \
#   npx prisma db seed

echo "✅ Pre-deployment checks passed!"
