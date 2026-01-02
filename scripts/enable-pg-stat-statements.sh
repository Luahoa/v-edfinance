#!/bin/bash
# Enable pg_stat_statements extension for Query Optimizer AI
# Requires: SSH access to VPS (103.54.153.248)

set -e

echo "🔍 Enabling pg_stat_statements extension..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Database connection details
DB_HOST="${DB_HOST:-103.54.153.248}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-vedfinance}"
DB_USER="${DB_USER:-postgres}"
CONTAINER_NAME="${CONTAINER_NAME:-vedfinance-postgres}"

echo "📋 Configuration:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo "   Container: $CONTAINER_NAME"
echo ""

# Step 1: Check if extension already exists
echo "1️⃣ Checking current extension status..."
EXTENSION_EXISTS=$(docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM pg_extension WHERE extname='pg_stat_statements';" 2>/dev/null || echo "0")

if [ "$EXTENSION_EXISTS" == "1" ]; then
  echo -e "${GREEN}✅ pg_stat_statements already enabled!${NC}"
  echo ""
  
  # Show current stats
  echo "📊 Current statistics:"
  docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "
    SELECT 
      COUNT(*) as tracked_queries,
      SUM(calls) as total_calls
    FROM pg_stat_statements;
  "
  exit 0
fi

# Step 2: Check if extension is available
echo "2️⃣ Checking if pg_stat_statements is available..."
EXTENSION_AVAILABLE=$(docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM pg_available_extensions WHERE name='pg_stat_statements';" 2>/dev/null || echo "0")

if [ "$EXTENSION_AVAILABLE" == "0" ]; then
  echo -e "${RED}❌ pg_stat_statements not available in this PostgreSQL installation${NC}"
  echo "   This should not happen on PostgreSQL 17+"
  exit 1
fi

# Step 3: Create extension
echo "3️⃣ Creating pg_stat_statements extension..."
docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME <<-EOSQL
  CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
EOSQL

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Extension created successfully!${NC}"
else
  echo -e "${RED}❌ Failed to create extension${NC}"
  exit 1
fi

# Step 4: Verify configuration
echo ""
echo "4️⃣ Verifying configuration..."
docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "
  SELECT 
    name,
    setting,
    unit,
    context
  FROM pg_settings 
  WHERE name LIKE 'pg_stat_statements%';
"

# Step 5: Test query tracking
echo ""
echo "5️⃣ Testing query tracking..."
docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME <<-EOSQL
  -- Reset stats
  SELECT pg_stat_statements_reset();
  
  -- Run test query
  SELECT COUNT(*) FROM "User";
  
  -- Check if it was tracked
  SELECT 
    query,
    calls,
    total_exec_time,
    mean_exec_time
  FROM pg_stat_statements
  WHERE query LIKE '%COUNT%User%'
  LIMIT 1;
EOSQL

echo ""
echo -e "${GREEN}✅ pg_stat_statements is now active!${NC}"
echo ""
echo "📚 Next steps:"
echo "   1. Query Optimizer AI can now analyze slow queries"
echo "   2. AI Database Architect weekly scans will work"
echo "   3. Run: pnpm test:db-optimizer (when implemented)"
echo ""
echo "🔍 View current statistics:"
echo "   docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c 'SELECT * FROM pg_stat_statements LIMIT 10;'"
