#!/bin/bash
# VED-6YB: Enable Pgvector Extension on VPS PostgreSQL
# Run this script on VPS: bash enable-pgvector.sh

set -e

echo "🔍 Finding PostgreSQL container..."
POSTGRES_CONTAINER=$(docker ps --filter "ancestor=postgres:15-alpine" --format "{{.ID}}" | head -n 1)

if [ -z "$POSTGRES_CONTAINER" ]; then
    echo "❌ PostgreSQL container not found!"
    echo "Available containers:"
    docker ps
    exit 1
fi

echo "✅ Found PostgreSQL container: $POSTGRES_CONTAINER"
echo ""

# Database names to enable pgvector
DATABASES=("vedfinance_prod" "vedfinance_staging" "vedfinance_dev" "v_edfinance")

echo "🔧 Enabling pgvector extension on all databases..."
for DB in "${DATABASES[@]}"; do
    echo "  → Processing $DB..."
    
    # Check if database exists
    DB_EXISTS=$(docker exec $POSTGRES_CONTAINER psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB'" 2>/dev/null || echo "")
    
    if [ "$DB_EXISTS" = "1" ]; then
        # Enable vector extension
        docker exec $POSTGRES_CONTAINER psql -U postgres -d $DB -c "CREATE EXTENSION IF NOT EXISTS vector;" 2>&1
        echo "    ✅ Enabled on $DB"
    else
        echo "    ⚠️  Database $DB does not exist, skipping..."
    fi
done

echo ""
echo "🧪 Verifying installations..."
for DB in "${DATABASES[@]}"; do
    DB_EXISTS=$(docker exec $POSTGRES_CONTAINER psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB'" 2>/dev/null || echo "")
    
    if [ "$DB_EXISTS" = "1" ]; then
        RESULT=$(docker exec $POSTGRES_CONTAINER psql -U postgres -d $DB -tAc "SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';" 2>/dev/null || echo "")
        if [ -n "$RESULT" ]; then
            echo "  ✅ $DB: $RESULT"
        else
            echo "  ❌ $DB: pgvector NOT installed!"
        fi
    fi
done

echo ""
echo "✅ pgvector extension enabled successfully!"
echo ""
echo "📝 Next steps:"
echo "   1. Test vector(384) column creation"
echo "   2. Close VED-6YB in beads"
echo "   3. Continue with VED-7P4 (VannaService)"
