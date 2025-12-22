#!/bin/bash
# VED-Y1U: Enable pg_stat_statements extension on VPS PostgreSQL
# ⚠️ WARNING: This requires PostgreSQL container restart!

VPS_HOST="103.54.153.248"
VPS_USER="root"

echo "🚀 Enabling pg_stat_statements on VPS PostgreSQL..."
echo "===================================================="
echo ""
echo "⚠️  WARNING: This operation will:"
echo "   1. Modify postgresql.conf"
echo "   2. RESTART PostgreSQL container"
echo "   3. Cause ~10 seconds downtime"
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Aborted by user"
    exit 1
fi

# Find PostgreSQL container
echo "📦 Finding PostgreSQL container..."
CONTAINER_ID=$(ssh ${VPS_USER}@${VPS_HOST} "docker ps --filter 'ancestor=postgres:15-alpine' --format '{{.ID}}' | head -1")

if [ -z "$CONTAINER_ID" ]; then
    echo "❌ PostgreSQL container not found!"
    exit 1
fi

echo "✅ Found container: ${CONTAINER_ID}"
CONTAINER_NAME=$(ssh ${VPS_USER}@${VPS_HOST} "docker ps --format '{{.Names}}' --filter id=${CONTAINER_ID}")
echo "   Name: ${CONTAINER_NAME}"
echo ""

# Step 1: Check current configuration
echo "📋 Step 1: Checking current configuration..."
CURRENT_PRELOAD=$(ssh ${VPS_USER}@${VPS_HOST} \
    "docker exec ${CONTAINER_ID} psql -U postgres -t -c \"SHOW shared_preload_libraries;\"" \
    2>/dev/null | xargs)

echo "   Current: shared_preload_libraries = ${CURRENT_PRELOAD}"

if echo "$CURRENT_PRELOAD" | grep -q "pg_stat_statements"; then
    echo "   ✅ Already configured in shared_preload_libraries"
    NEEDS_RESTART=false
else
    echo "   ⚠️  Not in shared_preload_libraries, will add and restart"
    NEEDS_RESTART=true
fi

echo ""

# Step 2: Add to shared_preload_libraries if needed
if [ "$NEEDS_RESTART" = true ]; then
    echo "📝 Step 2: Adding pg_stat_statements to postgresql.conf..."
    
    ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
docker exec ${CONTAINER_ID} sh -c "
    # Backup postgresql.conf
    cp /var/lib/postgresql/data/postgresql.conf /var/lib/postgresql/data/postgresql.conf.bak
    
    # Add pg_stat_statements to shared_preload_libraries
    grep -q 'shared_preload_libraries' /var/lib/postgresql/data/postgresql.conf || \
        echo \"shared_preload_libraries = 'pg_stat_statements'\" >> /var/lib/postgresql/data/postgresql.conf
    
    # Ensure it's set correctly (replace if exists)
    sed -i \"s/^shared_preload_libraries.*/shared_preload_libraries = 'pg_stat_statements'/\" \
        /var/lib/postgresql/data/postgresql.conf
"
ENDSSH
    
    echo "   ✅ Configuration updated"
    echo ""
    
    # Step 3: Restart container
    echo "🔄 Step 3: Restarting PostgreSQL container..."
    ssh ${VPS_USER}@${VPS_HOST} "docker restart ${CONTAINER_ID}"
    
    echo "   ⏳ Waiting 15 seconds for PostgreSQL to start..."
    sleep 15
    
    # Verify restart
    if ssh ${VPS_USER}@${VPS_HOST} "docker ps | grep -q ${CONTAINER_ID}"; then
        echo "   ✅ PostgreSQL restarted successfully"
    else
        echo "   ❌ PostgreSQL failed to restart!"
        echo "   Please check manually: docker logs ${CONTAINER_ID}"
        exit 1
    fi
    
    echo ""
fi

# Step 4: Create extension in all databases
echo "📝 Step 4: Creating pg_stat_statements extension in databases..."
DATABASES=("vedfinance_prod" "vedfinance_staging" "vedfinance_dev" "v_edfinance")

for DB in "${DATABASES[@]}"; do
    echo "   Processing ${DB}..."
    
    ssh ${VPS_USER}@${VPS_HOST} \
        "docker exec ${CONTAINER_ID} psql -U postgres -d ${DB} -c \"CREATE EXTENSION IF NOT EXISTS pg_stat_statements;\"" \
        2>&1 | grep -v "already exists" || true
    
    # Verify
    RESULT=$(ssh ${VPS_USER}@${VPS_HOST} \
        "docker exec ${CONTAINER_ID} psql -U postgres -d ${DB} -t -c \"SELECT extname, extversion FROM pg_extension WHERE extname = 'pg_stat_statements';\"" \
        2>/dev/null | xargs)
    
    if [ -n "$RESULT" ]; then
        echo "   ✅ ${DB}: Enabled (${RESULT})"
    else
        echo "   ❌ ${DB}: Failed to enable"
    fi
done

echo ""
echo "✅ pg_stat_statements enablement complete!"
echo ""

# Step 5: Verify stats collection
echo "📊 Step 5: Verifying query stats collection..."
QUERY_COUNT=$(ssh ${VPS_USER}@${VPS_HOST} \
    "docker exec ${CONTAINER_ID} psql -U postgres -d vedfinance_prod -t -c \"SELECT COUNT(*) FROM pg_stat_statements;\"" \
    2>/dev/null | xargs)

echo "   Currently tracking: ${QUERY_COUNT} queries"

if [ "$QUERY_COUNT" -gt 0 ]; then
    echo "   ✅ Stats collection is working!"
else
    echo "   ⚠️  No queries tracked yet (this is normal for fresh install)"
fi

echo ""
echo "📋 Next steps:"
echo "  1. Run verification: bash scripts/check-vps-pg-stat-statements.sh"
echo "  2. Wait 5-10 minutes for queries to accumulate"
echo "  3. Close beads task: ./beads.exe close ved-y1u --reason \"Enabled pg_stat_statements on VPS PostgreSQL\""
