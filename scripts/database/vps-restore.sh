#!/bin/bash
# ====================================================================
# V-EdFinance VPS Database Restore Script
# ====================================================================
# Run this script ON THE VPS (103.54.153.248)
# ====================================================================

set -e  # Exit on error

echo "🔄 V-EdFinance VPS Database Restore"
echo "===================================="
echo ""

# Configuration
BACKUP_DIR="/root/backups"
BACKUP_FILE="${1:-$BACKUP_DIR/latest.sql.gz}"

# Validate backup file
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    echo ""
    echo "Available backups:"
    ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "No backups found"
    echo ""
    echo "Usage: $0 [backup_file.sql.gz]"
    exit 1
fi

echo "📁 Backup File: $BACKUP_FILE"
echo "📊 Size: $(du -h "$BACKUP_FILE" | cut -f1)"
echo ""

# Find PostgreSQL container
echo "[1/5] Finding PostgreSQL container..."
POSTGRES_CONTAINER=$(docker ps --filter "ancestor=postgres:15-alpine" --format "{{.Names}}" | head -n 1)

if [ -z "$POSTGRES_CONTAINER" ]; then
    echo "❌ PostgreSQL container not found!"
    exit 1
fi

echo "✅ Found PostgreSQL container: $POSTGRES_CONTAINER"

# Extract backup if compressed
echo ""
echo "[2/5] Extracting backup..."
if [[ "$BACKUP_FILE" == *.gz ]]; then
    EXTRACTED_FILE="${BACKUP_FILE%.gz}"
    gunzip -c "$BACKUP_FILE" > "$EXTRACTED_FILE"
    echo "✅ Backup extracted: $EXTRACTED_FILE"
else
    EXTRACTED_FILE="$BACKUP_FILE"
    echo "✅ Backup already extracted"
fi

# Backup current database (safety)
echo ""
echo "[3/5] Creating safety backup of current database..."
SAFETY_BACKUP="$BACKUP_DIR/pre_restore_$(date +%Y%m%d_%H%M%S).sql"
docker exec "$POSTGRES_CONTAINER" pg_dump -U postgres -d vedfinance_staging > "$SAFETY_BACKUP"
echo "✅ Safety backup created: $SAFETY_BACKUP"

# Drop and recreate database
echo ""
echo "[4/5] Dropping and recreating database..."
echo "⚠️  WARNING: This will DELETE all data in vedfinance_staging!"
read -p "Continue? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "❌ Restore cancelled"
    rm -f "$EXTRACTED_FILE"
    exit 1
fi

docker exec "$POSTGRES_CONTAINER" psql -U postgres -c "DROP DATABASE IF EXISTS vedfinance_staging;"
docker exec "$POSTGRES_CONTAINER" psql -U postgres -c "CREATE DATABASE vedfinance_staging;"
echo "✅ Database recreated"

# Restore from backup
echo ""
echo "[5/5] Restoring database..."
cat "$EXTRACTED_FILE" | docker exec -i "$POSTGRES_CONTAINER" psql -U postgres -d vedfinance_staging

if [ $? -eq 0 ]; then
    echo "✅ Database restored successfully"
else
    echo "❌ Restore failed! Rolling back from safety backup..."
    cat "$SAFETY_BACKUP" | docker exec -i "$POSTGRES_CONTAINER" psql -U postgres -d vedfinance_staging
    exit 1
fi

# Cleanup temporary files
if [[ "$BACKUP_FILE" == *.gz ]]; then
    rm -f "$EXTRACTED_FILE"
fi

# Verify restore
echo ""
echo "🔍 Verifying restored database..."
TABLE_COUNT=$(docker exec "$POSTGRES_CONTAINER" psql -U postgres -d vedfinance_staging -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo "✅ Tables found: $TABLE_COUNT"

echo ""
echo "===================================="
echo "✅ Restore Complete!"
echo "===================================="
echo "📁 Restored from: $BACKUP_FILE"
echo "🛡️  Safety backup: $SAFETY_BACKUP"
echo "📊 Tables: $TABLE_COUNT"
echo ""
