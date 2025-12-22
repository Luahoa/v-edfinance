#!/bin/bash
# V-EdFinance PostgreSQL Backup to Cloudflare R2
# Runs daily at 3AM (configured in cron/dokploy)

set -euo pipefail

# Configuration
BACKUP_DIR="/backups/postgres"
R2_BUCKET="v-edfinance-backup"
R2_PATH="postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Check if rclone is installed
if ! command -v rclone &> /dev/null; then
    error "rclone not found. Install: curl https://rclone.org/install.sh | sudo bash"
    exit 1
fi

# Check if R2 remote is configured
if ! rclone listremotes | grep -q "^r2:"; then
    error "R2 remote not configured. Run: rclone config"
    exit 1
fi

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

# Get PostgreSQL container name
POSTGRES_CONTAINER=$(docker ps --filter "name=postgres" --format "{{.Names}}" | head -n 1)

if [ -z "$POSTGRES_CONTAINER" ]; then
    error "PostgreSQL container not found"
    exit 1
fi

log "Starting backup from container: $POSTGRES_CONTAINER"

# Backup all databases
BACKUP_FILE="$BACKUP_DIR/vedfinance_all_${TIMESTAMP}.sql.gz"

log "Creating backup: $BACKUP_FILE"
docker exec -t "$POSTGRES_CONTAINER" pg_dumpall -U postgres | gzip > "$BACKUP_FILE"

if [ ! -f "$BACKUP_FILE" ]; then
    error "Backup file not created"
    exit 1
fi

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
log "Backup created successfully (Size: $BACKUP_SIZE)"

# Upload to R2
log "Uploading to R2: r2:$R2_BUCKET/$R2_PATH/"
rclone copy "$BACKUP_FILE" "r2:$R2_BUCKET/$R2_PATH/" \
    --progress \
    --transfers 4 \
    --checkers 8 \
    --s3-chunk-size 8M

if [ $? -eq 0 ]; then
    log "Upload to R2 successful"
else
    error "Upload to R2 failed"
    exit 1
fi

# Verify upload
log "Verifying upload..."
R2_FILE="r2:$R2_BUCKET/$R2_PATH/$(basename $BACKUP_FILE)"
if rclone ls "$R2_FILE" &> /dev/null; then
    log "✓ Backup verified on R2"
else
    error "Backup verification failed"
    exit 1
fi

# Clean up old local backups (keep last 7 days)
log "Cleaning up local backups older than 7 days..."
find "$BACKUP_DIR" -name "vedfinance_all_*.sql.gz" -type f -mtime +7 -delete

# Clean up old R2 backups (keep last 30 days)
log "Cleaning up R2 backups older than $RETENTION_DAYS days..."
rclone delete "r2:$R2_BUCKET/$R2_PATH/" \
    --min-age ${RETENTION_DAYS}d \
    --include "vedfinance_all_*.sql.gz"

# Generate backup report
cat << EOF > "$BACKUP_DIR/last_backup.log"
Timestamp: $(date)
Backup File: $(basename $BACKUP_FILE)
Size: $BACKUP_SIZE
R2 Location: r2:$R2_BUCKET/$R2_PATH/$(basename $BACKUP_FILE)
Status: SUCCESS
EOF

log "Backup process completed successfully"
log "Report saved to: $BACKUP_DIR/last_backup.log"

# Send notification (optional - configure webhook)
# curl -X POST "$WEBHOOK_URL" -H "Content-Type: application/json" \
#   -d "{\"text\":\"✅ PostgreSQL backup completed: $BACKUP_SIZE\"}"

exit 0
