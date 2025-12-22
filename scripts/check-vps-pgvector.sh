#!/bin/bash
# VED-6YB: Check if pgvector extension is enabled on VPS
# This script connects to VPS and checks all databases

VPS_HOST="103.54.153.248"
VPS_USER="root"

echo "🔍 Checking pgvector extension status on VPS..."
echo "================================================"

# Check if we can connect
if ! ssh -o ConnectTimeout=5 ${VPS_USER}@${VPS_HOST} "echo 'SSH connection OK'"; then
    echo "❌ SSH connection failed!"
    echo "Please check:"
    echo "  1. VPS is accessible at ${VPS_HOST}"
    echo "  2. SSH key is configured"
    echo "  3. Firewall allows SSH (port 22)"
    exit 1
fi

echo "✅ SSH connection established"
echo ""

# Find PostgreSQL container
echo "📦 Finding PostgreSQL container..."
CONTAINER_ID=$(ssh ${VPS_USER}@${VPS_HOST} "docker ps --filter 'ancestor=postgres:15-alpine' --format '{{.ID}}' | head -1")

if [ -z "$CONTAINER_ID" ]; then
    echo "❌ PostgreSQL container not found!"
    echo "Searching for any postgres container..."
    ssh ${VPS_USER}@${VPS_HOST} "docker ps | grep postgres"
    exit 1
fi

echo "✅ Found PostgreSQL container: ${CONTAINER_ID}"
echo ""

# Check pgvector extension in all databases
DATABASES=("vedfinance_prod" "vedfinance_staging" "vedfinance_dev" "v_edfinance")

echo "🔍 Checking pgvector extension in databases..."
echo "-----------------------------------------------"

for DB in "${DATABASES[@]}"; do
    echo -n "Database: ${DB} ... "
    
    RESULT=$(ssh ${VPS_USER}@${VPS_HOST} \
        "docker exec ${CONTAINER_ID} psql -U postgres -d ${DB} -t -c \"SELECT extname FROM pg_extension WHERE extname = 'vector';\" 2>/dev/null" \
        | xargs)
    
    if [ "$RESULT" = "vector" ]; then
        echo "✅ ENABLED"
    else
        echo "❌ NOT ENABLED"
    fi
done

echo ""
echo "📋 Summary:"
echo "If any database shows '❌ NOT ENABLED', run the following script to enable it:"
echo "  bash scripts/enable-vps-pgvector.sh"
