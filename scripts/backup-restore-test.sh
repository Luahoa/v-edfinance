#!/bin/bash
# Automated Backup Restore Testing
# Runs: Weekly (Sundays 4AM - after AI scan)
# Integrates with: Uptime Kuma for health monitoring

set -euo pipefail

UPTIME_KUMA_PUSH_URL="${UPTIME_KUMA_PUSH_URL:-http://localhost:3002/api/push/YOUR_PUSH_KEY}"
R2_BUCKET="v-edfinance-backup"
R2_PATH="postgres"
TEST_DB="vedfinance_restore_test"
LOG_FILE="/var/log/backup-test.log"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

notify_uptime_kuma() {
    local status=$1  # "up" or "down"
    local msg=$2
    local ping=$3  # Response time in ms
    
    curl "$UPTIME_KUMA_PUSH_URL?status=$status&msg=$(echo $msg | jq -sRr @uri)&ping=$ping" \
        --silent --fail || log "⚠️  Uptime Kuma notification failed"
}

START_TIME=$(date +%s%3N)

log "🔄 Starting automated backup restore test..."
notify_uptime_kuma "up" "Backup restore test started" "0"

# Step 1: Get latest backup from R2
log "📥 Downloading latest backup from R2..."
LATEST_BACKUP=$(rclone ls r2:$R2_BUCKET/$R2_PATH/ | tail -n 1 | awk '{print $2}')

if [ -z "$LATEST_BACKUP" ]; then
    log "❌ No backups found in R2"
    notify_uptime_kuma "down" "No backups found in R2" "0"
    exit 1
fi

log "📦 Latest backup: $LATEST_BACKUP"

# Download
rclone copy "r2:$R2_BUCKET/$R2_PATH/$LATEST_BACKUP" /tmp/ --progress

if [ ! -f "/tmp/$LATEST_BACKUP" ]; then
    log "❌ Backup download failed"
    notify_uptime_kuma "down" "Backup download failed" "0"
    exit 1
fi

BACKUP_SIZE=$(du -h "/tmp/$LATEST_BACKUP" | cut -f1)
log "✅ Downloaded backup: $BACKUP_SIZE"

# Step 2: Create test database
log "🗄️  Creating test database..."
docker exec vedfinance-postgres psql -U postgres -c "DROP DATABASE IF EXISTS $TEST_DB;" || true
docker exec vedfinance-postgres psql -U postgres -c "CREATE DATABASE $TEST_DB;"

# Step 3: Restore backup to test database
log "⚡ Restoring backup to test database..."
RESTORE_START=$(date +%s)

gunzip -c "/tmp/$LATEST_BACKUP" | \
  docker exec -i vedfinance-postgres psql -U postgres -d $TEST_DB 2>&1 | tee -a "$LOG_FILE"

RESTORE_END=$(date +%s)
RESTORE_DURATION=$((RESTORE_END - RESTORE_START))

log "✅ Restore completed in ${RESTORE_DURATION}s"

# Step 4: Verify data integrity
log "🔍 Verifying data integrity..."

# Check table counts
USER_COUNT=$(docker exec vedfinance-postgres psql -U postgres -d $TEST_DB -t -c 'SELECT COUNT(*) FROM "User";' | xargs)
BEHAVIOR_LOG_COUNT=$(docker exec vedfinance-postgres psql -U postgres -d $TEST_DB -t -c 'SELECT COUNT(*) FROM "BehaviorLog";' | xargs)
SOCIAL_POST_COUNT=$(docker exec vedfinance-postgres psql -U postgres -d $TEST_DB -t -c 'SELECT COUNT(*) FROM "SocialPost";' | xargs)

log "📊 Data integrity check:"
log "   Users: $USER_COUNT"
log "   BehaviorLogs: $BEHAVIOR_LOG_COUNT"
log "   SocialPosts: $SOCIAL_POST_COUNT"

# Verify minimum data exists
if [ "$USER_COUNT" -lt 1 ]; then
    log "⚠️  WARNING: No users found in restore"
    notify_uptime_kuma "down" "Backup restore failed - no data" "$RESTORE_DURATION"
    exit 1
fi

# Step 5: Check schema integrity
log "🔍 Verifying schema integrity..."
TABLES=$(docker exec vedfinance-postgres psql -U postgres -d $TEST_DB -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
INDEXES=$(docker exec vedfinance-postgres psql -U postgres -d $TEST_DB -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';" | xargs)

log "📐 Schema check:"
log "   Tables: $TABLES"
log "   Indexes: $INDEXES"

if [ "$TABLES" -lt 10 ]; then
    log "⚠️  WARNING: Too few tables ($TABLES) - expected 15+"
    notify_uptime_kuma "down" "Schema incomplete" "$RESTORE_DURATION"
    exit 1
fi

# Step 6: Cleanup
log "🧹 Cleaning up..."
docker exec vedfinance-postgres psql -U postgres -c "DROP DATABASE $TEST_DB;"
rm "/tmp/$LATEST_BACKUP"

# Step 7: Calculate total duration
END_TIME=$(date +%s%3N)
TOTAL_DURATION=$(((END_TIME - START_TIME) / 1000))

# Step 8: Success notification
log "✅ Backup restore test PASSED"
log "📈 Stats:"
log "   Backup: $LATEST_BACKUP ($BACKUP_SIZE)"
log "   Restore time: ${RESTORE_DURATION}s"
log "   Total duration: ${TOTAL_DURATION}s"
log "   Users: $USER_COUNT, BehaviorLogs: $BEHAVIOR_LOG_COUNT"

notify_uptime_kuma "up" "Backup restore test PASSED - ${RESTORE_DURATION}s restore time" "$TOTAL_DURATION"

# Step 9: Log summary
cat << EOF >> /var/log/backup-test-summary.log
$(date +%Y-%m-%d),PASS,$BACKUP_SIZE,${RESTORE_DURATION}s,$USER_COUNT,$BEHAVIOR_LOG_COUNT,$SOCIAL_POST_COUNT
EOF

log "🏁 Automated backup test complete"

exit 0
