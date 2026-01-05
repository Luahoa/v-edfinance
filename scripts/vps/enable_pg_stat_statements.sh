#!/bin/bash
# ================================================================
# VPS Script: Enable pg_stat_statements Extension
# Task: ved-y1u
# Author: AI Agent
# Date: 2026-01-05
# ================================================================

set -e  # Exit on error

echo "════════════════════════════════════════════════════════════"
echo "🔧 VED-Y1U: Enable pg_stat_statements on PostgreSQL"
echo "════════════════════════════════════════════════════════════"
echo ""

# ----------------------------------------------------------------
# Step 1: Find PostgreSQL Container
# ----------------------------------------------------------------
echo "[1/5] 🔍 Finding PostgreSQL container..."
POSTGRES_CONTAINER=$(docker ps --filter "ancestor=postgres" --format "{{.ID}}" | head -n 1)

if [ -z "$POSTGRES_CONTAINER" ]; then
    echo "❌ No PostgreSQL container found!"
    echo "Trying alternative search..."
    POSTGRES_CONTAINER=$(docker ps --format "{{.ID}} {{.Image}}" | grep postgres | awk '{print $1}' | head -n 1)
fi

if [ -z "$POSTGRES_CONTAINER" ]; then
    echo "❌ ERROR: No PostgreSQL container running!"
    exit 1
fi

echo "✅ Found PostgreSQL container: $POSTGRES_CONTAINER"
echo ""

# ----------------------------------------------------------------
# Step 2: Check Current Configuration
# ----------------------------------------------------------------
echo "[2/5] 📋 Checking current postgresql.conf..."
docker exec $POSTGRES_CONTAINER psql -U postgres -c "SHOW shared_preload_libraries;" || echo "⚠️  shared_preload_libraries not set"
echo ""

# ----------------------------------------------------------------
# Step 3: Enable pg_stat_statements Extension
# ----------------------------------------------------------------
echo "[3/5] 🔧 Enabling pg_stat_statements extension..."

# Create extension in default 'postgres' database
docker exec $POSTGRES_CONTAINER psql -U postgres -d postgres -c "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"

# Create extension in v_edfinance database (if exists)
docker exec $POSTGRES_CONTAINER psql -U postgres -d v_edfinance -c "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;" 2>/dev/null || echo "⚠️  v_edfinance database not found, skipping"

echo "✅ Extension created in databases"
echo ""

# ----------------------------------------------------------------
# Step 4: Configure Retention Settings
# ----------------------------------------------------------------
echo "[4/5] ⚙️  Configuring extension parameters..."

# Set tracking parameters (runtime config, doesn't require restart)
docker exec $POSTGRES_CONTAINER psql -U postgres -c "ALTER SYSTEM SET pg_stat_statements.track = 'all';"
docker exec $POSTGRES_CONTAINER psql -U postgres -c "ALTER SYSTEM SET pg_stat_statements.max = 10000;"
docker exec $POSTGRES_CONTAINER psql -U postgres -c "ALTER SYSTEM SET pg_stat_statements.track_utility = 'on';"

# Reload configuration
docker exec $POSTGRES_CONTAINER psql -U postgres -c "SELECT pg_reload_conf();"

echo "✅ Configuration updated"
echo ""

# ----------------------------------------------------------------
# Step 5: Verify Extension is Working
# ----------------------------------------------------------------
echo "[5/5] ✅ Verifying pg_stat_statements..."

# Check if extension exists
docker exec $POSTGRES_CONTAINER psql -U postgres -d postgres -c "SELECT * FROM pg_extension WHERE extname = 'pg_stat_statements';"

# Check if view returns data
echo ""
echo "Sample queries from pg_stat_statements:"
docker exec $POSTGRES_CONTAINER psql -U postgres -d postgres -c "SELECT query, calls, total_exec_time FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 5;"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ SUCCESS: pg_stat_statements enabled!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📊 Extension Details:"
echo "  - Tracking: ALL queries (including utility)"
echo "  - Max Statements: 10,000"
echo "  - Databases: postgres, v_edfinance (if exists)"
echo ""
echo "📝 Next Steps:"
echo "  1. Test query tracking (run some queries)"
echo "  2. Verify data appears in pg_stat_statements view"
echo "  3. Integrate with Kysely analytics queries"
echo ""
echo "🔗 Verification Command:"
echo "  docker exec $POSTGRES_CONTAINER psql -U postgres -d postgres -c \"SELECT COUNT(*) FROM pg_stat_statements;\""
echo ""
