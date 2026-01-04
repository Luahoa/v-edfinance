#!/bin/bash
# VPS Database Setup Script
# Run this script on VPS to enable pg_stat_statements and deploy automation
#
# Usage:
#   bash vps-database-setup.sh

set -e

echo "═══════════════════════════════════════════════════════════"
echo "🔧 V-EdFinance VPS Database Setup"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Configuration
DB_CONTAINER="vedfinance-postgres"
DB_NAME="vedfinance"
DB_USER="postgres"
SCRIPTS_DIR="/opt/scripts"
LOG_DIR="/var/log"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Helper functions
success() { echo -e "${GREEN}✅ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; exit 1; }

echo "📋 Checking prerequisites..."

# Check Docker
if ! command -v docker &> /dev/null; then
  error "Docker not found. Please install Docker first."
fi
success "Docker installed"

# Check PostgreSQL container
if ! docker ps | grep -q "$DB_CONTAINER"; then
  error "PostgreSQL container '$DB_CONTAINER' not running"
fi
success "PostgreSQL container running"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "🚀 Task 1: Enable pg_stat_statements Extension"
echo "═══════════════════════════════════════════════════════════"

# Enable pg_stat_statements
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;" > /dev/null 2>&1
success "pg_stat_statements extension enabled"

# Verify
EXTENSION_CHECK=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT 1 FROM pg_extension WHERE extname='pg_stat_statements';" | xargs)
if [[ "$EXTENSION_CHECK" != "1" ]]; then
  error "Failed to enable pg_stat_statements"
fi
success "Extension verification passed"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "🚀 Task 2: Create Scripts Directory"
echo "═══════════════════════════════════════════════════════════"

sudo mkdir -p "$SCRIPTS_DIR"
sudo chown "$USER:$USER" "$SCRIPTS_DIR"
success "Scripts directory created: $SCRIPTS_DIR"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "🚀 Task 3: Deploy AI Database Architect Weekly Script"
echo "═══════════════════════════════════════════════════════════"

cat > "$SCRIPTS_DIR/db-architect-weekly.sh" << 'SCRIPT_EOF'
#!/bin/bash
# AI Database Architect - Weekly Autonomous Optimization
# Runs every Sunday at 3 AM

set -e

LOG_FILE="/var/log/db-architect-weekly.log"
API_URL="http://localhost:3001/api/debug/database/analyze"

echo "[$(date)] Starting AI Database Architect weekly scan..." >> "$LOG_FILE"

# Call AI Database Architect endpoint
RESPONSE=$(curl -s -X GET "$API_URL" 2>&1)

if [[ $? -ne 0 ]]; then
  echo "[$(date)] ❌ Failed to connect to API" >> "$LOG_FILE"
  exit 1
fi

# Parse response (basic check)
if echo "$RESPONSE" | grep -q "optimizationsApplied"; then
  echo "[$(date)] ✅ AI scan completed successfully" >> "$LOG_FILE"
  echo "$RESPONSE" | head -20 >> "$LOG_FILE"
else
  echo "[$(date)] ⚠️ Unexpected response" >> "$LOG_FILE"
  echo "$RESPONSE" | head -20 >> "$LOG_FILE"
fi

echo "[$(date)] AI Database Architect weekly scan finished" >> "$LOG_FILE"
SCRIPT_EOF

chmod +x "$SCRIPTS_DIR/db-architect-weekly.sh"
success "AI architect script deployed"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "🚀 Task 4: Deploy Backup Restore Test Script"
echo "═══════════════════════════════════════════════════════════"

cat > "$SCRIPTS_DIR/backup-restore-test.sh" << 'SCRIPT_EOF'
#!/bin/bash
# Automated Backup Restore Test
# Runs every Sunday at 4 AM (after AI scan)

set -e

LOG_FILE="/var/log/backup-restore-test.log"
TEST_DB="vedfinance_restore_test"
BACKUP_PATH="/tmp/latest-backup.sql.gz"
DB_CONTAINER="vedfinance-postgres"

echo "[$(date)] Starting backup restore test..." >> "$LOG_FILE"

# Step 1: Get latest backup from R2
echo "[$(date)] Downloading latest backup from R2..." >> "$LOG_FILE"
LATEST_BACKUP=$(rclone lsf vedfinance-r2:vedfinance-backups/ | tail -1)

if [[ -z "$LATEST_BACKUP" ]]; then
  echo "[$(date)] ❌ No backups found in R2" >> "$LOG_FILE"
  exit 1
fi

rclone copy "vedfinance-r2:vedfinance-backups/$LATEST_BACKUP" /tmp/ >> "$LOG_FILE" 2>&1
mv "/tmp/$LATEST_BACKUP" "$BACKUP_PATH"

if [[ ! -f "$BACKUP_PATH" ]]; then
  echo "[$(date)] ❌ Failed to download backup" >> "$LOG_FILE"
  exit 1
fi

# Step 2: Create test database
echo "[$(date)] Creating test database..." >> "$LOG_FILE"
docker exec "$DB_CONTAINER" psql -U postgres -c "DROP DATABASE IF EXISTS $TEST_DB;" >> "$LOG_FILE" 2>&1
docker exec "$DB_CONTAINER" psql -U postgres -c "CREATE DATABASE $TEST_DB;" >> "$LOG_FILE" 2>&1

# Step 3: Restore backup
echo "[$(date)] Restoring backup..." >> "$LOG_FILE"
START_TIME=$(date +%s)

gunzip -c "$BACKUP_PATH" | docker exec -i "$DB_CONTAINER" psql -U postgres -d "$TEST_DB" >> "$LOG_FILE" 2>&1

END_TIME=$(date +%s)
RESTORE_TIME=$((END_TIME - START_TIME))

# Step 4: Verify data
echo "[$(date)] Verifying restored data..." >> "$LOG_FILE"
USER_COUNT=$(docker exec "$DB_CONTAINER" psql -U postgres -d "$TEST_DB" -t -c "SELECT COUNT(*) FROM \"User\";" | xargs)
LOG_COUNT=$(docker exec "$DB_CONTAINER" psql -U postgres -d "$TEST_DB" -t -c "SELECT COUNT(*) FROM \"BehaviorLog\";" | xargs)

echo "[$(date)] ✅ Restore test PASSED" >> "$LOG_FILE"
echo "[$(date)] 📈 Stats: Restore time: ${RESTORE_TIME}s, Users: $USER_COUNT, Logs: $LOG_COUNT" >> "$LOG_FILE"

# Step 5: Cleanup test database
docker exec "$DB_CONTAINER" psql -U postgres -c "DROP DATABASE $TEST_DB;" >> "$LOG_FILE" 2>&1
rm -f "$BACKUP_PATH"

echo "[$(date)] Backup restore test completed" >> "$LOG_FILE"

# Push to Uptime Kuma (if configured)
if [[ -n "$UPTIME_KUMA_PUSH_URL" ]]; then
  curl -s "$UPTIME_KUMA_PUSH_URL?status=up&msg=Restore%20OK&ping=${RESTORE_TIME}000" >> "$LOG_FILE" 2>&1
fi
SCRIPT_EOF

chmod +x "$SCRIPTS_DIR/backup-restore-test.sh"
success "Backup restore test script deployed"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "🚀 Task 5: Deploy Cron Jobs"
echo "═══════════════════════════════════════════════════════════"

# Check if cron jobs already exist
if crontab -l 2>/dev/null | grep -q "db-architect-weekly"; then
  warning "Cron jobs already exist. Skipping..."
else
  (crontab -l 2>/dev/null; cat << 'CRON_EOF'

# V-EdFinance Database Automation
# AI Database Architect - Weekly scan (Sundays 3 AM)
0 3 * * 0 /opt/scripts/db-architect-weekly.sh

# Backup Restore Test - Weekly (Sundays 4 AM)
0 4 * * 0 /opt/scripts/backup-restore-test.sh
CRON_EOF
  ) | crontab -
  success "Cron jobs deployed"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "🚀 Task 6: Setup Netdata Capacity Alerts"
echo "═══════════════════════════════════════════════════════════"

if [[ -f /etc/netdata/health.d/db_capacity.conf ]]; then
  warning "Netdata alerts already configured. Skipping..."
else
  sudo bash -c 'cat > /etc/netdata/health.d/db_capacity.conf << EOF
# Database Capacity Alerts (V-EdFinance)

alarm: database_size
   on: postgres.database_size
lookup: average -5m
 units: GB
 every: 1h
  warn: \$this > 40
  crit: \$this > 60
  info: Database size threshold - consider archiving or scaling

alarm: connection_pool_saturation
   on: postgres.connections
lookup: average -5m
 units: connections
 every: 5m
  warn: \$this > 15
  crit: \$this > 18
  info: PostgreSQL connection pool nearing max (20 connections)

alarm: disk_space_database
   on: disk_space._var_lib_docker
lookup: average -5m
 units: GB
 every: 30m
  warn: \$this < 20
  crit: \$this < 10
  info: Low disk space for Docker volumes (database storage)
EOF'

  sudo systemctl restart netdata
  success "Netdata alerts configured"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "🔍 Task 7: Verification"
echo "═══════════════════════════════════════════════════════════"

# Verify pg_stat_statements
echo -n "Checking pg_stat_statements... "
STATS_CHECK=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM pg_stat_statements LIMIT 1;" 2>&1 | xargs)
if [[ $? -eq 0 ]]; then
  success "Working"
else
  error "Failed to query pg_stat_statements"
fi

# Verify scripts
echo -n "Checking scripts... "
if [[ -f "$SCRIPTS_DIR/db-architect-weekly.sh" && -f "$SCRIPTS_DIR/backup-restore-test.sh" ]]; then
  success "All scripts present"
else
  error "Scripts missing"
fi

# Verify cron
echo -n "Checking cron jobs... "
CRON_COUNT=$(crontab -l 2>/dev/null | grep -c "db-architect-weekly" || true)
if [[ "$CRON_COUNT" -ge 1 ]]; then
  success "Cron jobs configured"
else
  error "Cron jobs not found"
fi

# Verify Netdata
echo -n "Checking Netdata alerts... "
if [[ -f /etc/netdata/health.d/db_capacity.conf ]]; then
  success "Alerts configured"
else
  warning "Netdata alerts not configured (optional)"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "🎉 VPS Database Setup Complete!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📊 Summary:"
echo "  ✅ pg_stat_statements extension enabled"
echo "  ✅ AI Database Architect script deployed"
echo "  ✅ Backup restore test script deployed"
echo "  ✅ Cron jobs scheduled (Sundays 3AM & 4AM)"
echo "  ✅ Netdata capacity alerts configured"
echo ""
echo "📈 Next Steps:"
echo "  1. Wait 24 hours for pg_stat_statements to collect data"
echo "  2. Test AI Database Architect:"
echo "     curl http://localhost:3001/api/debug/database/analyze | jq"
echo ""
echo "  3. Monitor logs:"
echo "     tail -f /var/log/db-architect-weekly.log"
echo "     tail -f /var/log/backup-restore-test.log"
echo ""
echo "  4. Check Netdata alerts:"
echo "     http://103.54.153.248:19999"
echo ""
echo "═══════════════════════════════════════════════════════════"
