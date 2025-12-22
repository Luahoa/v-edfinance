#!/bin/bash
# ====================================================================
# V-EdFinance VPS Database Backup Script
# ====================================================================
# Run this script ON THE VPS (103.54.153.248)
# ====================================================================

set -e  # Exit on error

echo "🚀 V-EdFinance VPS Database Backup"
echo "===================================="
echo ""

# Configuration
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/vedfinance_staging_$DATE.sql"
RETENTION_DAYS=7

# Step 1: Create backup directory
echo "[1/6] Creating backup directory..."
mkdir -p "$BACKUP_DIR"
echo "✅ Backup directory ready: $BACKUP_DIR"

# Step 2: Find PostgreSQL container
echo ""
echo "[2/6] Finding PostgreSQL container..."
POSTGRES_CONTAINER=$(docker ps --filter "ancestor=postgres:15-alpine" --format "{{.Names}}" | head -n 1)

if [ -z "$POSTGRES_CONTAINER" ]; then
    echo "❌ PostgreSQL container not found!"
    echo "Available containers:"
    docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
    exit 1
fi

echo "✅ Found PostgreSQL container: $POSTGRES_CONTAINER"

# Step 3: Verify database exists
echo ""
echo "[3/6] Verifying vedfinance_staging database..."
DB_EXISTS=$(docker exec "$POSTGRES_CONTAINER" psql -U postgres -lqt | cut -d \| -f 1 | grep -w vedfinance_staging | wc -l)

if [ "$DB_EXISTS" -eq 0 ]; then
    echo "❌ Database vedfinance_staging not found!"
    echo "Available databases:"
    docker exec "$POSTGRES_CONTAINER" psql -U postgres -l
    exit 1
fi

echo "✅ Database vedfinance_staging exists"

# Step 4: Create backup
echo ""
echo "[4/6] Creating database backup..."
docker exec "$POSTGRES_CONTAINER" pg_dump -U postgres -d vedfinance_staging > "$BACKUP_FILE"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not created!"
    exit 1
fi

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "✅ Backup created: $BACKUP_FILE ($BACKUP_SIZE)"

# Step 5: Compress backup
echo ""
echo "[5/6] Compressing backup..."
gzip "$BACKUP_FILE"
COMPRESSED_FILE="${BACKUP_FILE}.gz"
COMPRESSED_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
echo "✅ Backup compressed: $COMPRESSED_FILE ($COMPRESSED_SIZE)"

# Step 6: Create 'latest' symlink
echo ""
echo "[6/6] Creating latest backup symlink..."
ln -sf "$COMPRESSED_FILE" "$BACKUP_DIR/latest.sql.gz"
echo "✅ Symlink created: $BACKUP_DIR/latest.sql.gz -> $COMPRESSED_FILE"

# Cleanup old backups
echo ""
echo "🧹 Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "vedfinance_staging_*.sql.gz" -mtime +$RETENTION_DAYS -delete
REMAINING_BACKUPS=$(ls -1 "$BACKUP_DIR"/vedfinance_staging_*.sql.gz 2>/dev/null | wc -l)
echo "✅ Cleanup complete. Remaining backups: $REMAINING_BACKUPS"

# Summary
echo ""
echo "===================================="
echo "✅ Backup Complete!"
echo "===================================="
echo "📁 Backup File: $COMPRESSED_FILE"
echo "📊 Size: $COMPRESSED_SIZE"
echo "🔗 Latest Link: $BACKUP_DIR/latest.sql.gz"
echo "📅 Retention: $RETENTION_DAYS days"
echo "📦 Total Backups: $REMAINING_BACKUPS"
echo ""
echo "Download to local machine:"
echo "scp root@103.54.153.248:$COMPRESSED_FILE ./backups/database/"
echo ""
