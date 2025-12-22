#!/bin/bash
# VED-Y1U: Check if pg_stat_statements extension is enabled on VPS

VPS_HOST="103.54.153.248"
VPS_USER="root"

echo "🔍 Checking pg_stat_statements extension status..."
echo "=================================================="

# Find PostgreSQL container
CONTAINER_ID=$(ssh ${VPS_USER}@${VPS_HOST} "docker ps --filter 'ancestor=postgres:15-alpine' --format '{{.ID}}' | head -1")

if [ -z "$CONTAINER_ID" ]; then
    echo "❌ PostgreSQL container not found!"
    exit 1
fi

echo "✅ Found PostgreSQL container: ${CONTAINER_ID}"
echo ""

# Check if extension is loaded in shared_preload_libraries
echo "📋 Checking postgresql.conf configuration..."
PRELOAD_LIBS=$(ssh ${VPS_USER}@${VPS_HOST} \
    "docker exec ${CONTAINER_ID} psql -U postgres -t -c \"SHOW shared_preload_libraries;\"" \
    2>/dev/null | xargs)

echo "   shared_preload_libraries = ${PRELOAD_LIBS}"

if echo "$PRELOAD_LIBS" | grep -q "pg_stat_statements"; then
    echo "   ✅ pg_stat_statements is preloaded"
else
    echo "   ❌ pg_stat_statements NOT in shared_preload_libraries"
    echo "   ⚠️  Requires PostgreSQL restart to enable!"
fi

echo ""

# Check if extension is created in databases
DATABASES=("vedfinance_prod" "vedfinance_staging" "vedfinance_dev" "v_edfinance")

echo "🔍 Checking extension status in databases..."
echo "--------------------------------------------"

for DB in "${DATABASES[@]}"; do
    echo -n "Database: ${DB} ... "
    
    RESULT=$(ssh ${VPS_USER}@${VPS_HOST} \
        "docker exec ${CONTAINER_ID} psql -U postgres -d ${DB} -t -c \"SELECT extname FROM pg_extension WHERE extname = 'pg_stat_statements';\" 2>/dev/null" \
        | xargs)
    
    if [ "$RESULT" = "pg_stat_statements" ]; then
        echo "✅ ENABLED"
        
        # Check if stats are being collected
        QUERY_COUNT=$(ssh ${VPS_USER}@${VPS_HOST} \
            "docker exec ${CONTAINER_ID} psql -U postgres -d ${DB} -t -c \"SELECT COUNT(*) FROM pg_stat_statements;\" 2>/dev/null" \
            | xargs)
        
        echo "   └─ Tracking ${QUERY_COUNT} queries"
    else
        echo "❌ NOT ENABLED"
    fi
done

echo ""
echo "📋 Summary:"
echo "If any database shows '❌ NOT ENABLED', run:"
echo "  bash scripts/enable-vps-pg-stat-statements.sh"
