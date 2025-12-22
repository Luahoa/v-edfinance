#!/bin/bash
# VED-6YB: Enable pgvector extension on VPS PostgreSQL
# This script automatically enables pgvector on all databases

VPS_HOST="103.54.153.248"
VPS_USER="root"

echo "🚀 Enabling pgvector extension on VPS PostgreSQL..."
echo "==================================================="

# Find PostgreSQL container
echo "📦 Finding PostgreSQL container..."
CONTAINER_ID=$(ssh ${VPS_USER}@${VPS_HOST} "docker ps --filter 'ancestor=postgres:15-alpine' --format '{{.ID}}' | head -1")

if [ -z "$CONTAINER_ID" ]; then
    echo "❌ PostgreSQL container not found!"
    echo ""
    echo "Manual steps:"
    echo "1. SSH to VPS: ssh root@${VPS_HOST}"
    echo "2. Find container: docker ps | grep postgres"
    echo "3. Enable extension manually"
    exit 1
fi

echo "✅ Found container: ${CONTAINER_ID}"
echo ""

# Enable pgvector on all databases
DATABASES=("vedfinance_prod" "vedfinance_staging" "vedfinance_dev" "v_edfinance")

for DB in "${DATABASES[@]}"; do
    echo "📝 Enabling pgvector on ${DB}..."
    
    ssh ${VPS_USER}@${VPS_HOST} \
        "docker exec ${CONTAINER_ID} psql -U postgres -d ${DB} -c \"CREATE EXTENSION IF NOT EXISTS vector;\"" \
        2>&1 | grep -v "already exists" || true
    
    # Verify
    RESULT=$(ssh ${VPS_USER}@${VPS_HOST} \
        "docker exec ${CONTAINER_ID} psql -U postgres -d ${DB} -t -c \"SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';\"" \
        2>/dev/null | xargs)
    
    if [ -n "$RESULT" ]; then
        echo "   ✅ ${DB}: pgvector enabled (${RESULT})"
    else
        echo "   ❌ ${DB}: Failed to enable pgvector"
    fi
done

echo ""
echo "✅ Pgvector enablement complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Run verification: bash scripts/check-vps-pgvector.sh"
echo "  2. Close beads task: ./beads.exe close ved-6yb --reason \"Enabled pgvector on VPS databases\""
