#!/bin/bash
# Deploy Netdata DB Capacity Alerts to VPS
# Skill: Database Reliability Engineering (DBRE)

set -e

echo "📊 Deploying Netdata capacity alerts to VPS..."
echo ""

VPS_HOST="${VPS_HOST:-103.54.153.248}"
VPS_USER="${VPS_USER:-deployer}"
NETDATA_HEALTH_DIR="/etc/netdata/health.d"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Step 1: Backup existing config (if any)
echo "1️⃣ Backing up existing Netdata config..."
ssh $VPS_USER@$VPS_HOST "sudo cp $NETDATA_HEALTH_DIR/db_capacity.conf $NETDATA_HEALTH_DIR/db_capacity.conf.bak 2>/dev/null || true"

# Step 2: Upload new config
echo "2️⃣ Uploading db_capacity.conf..."
scp config/netdata/db_capacity.conf $VPS_USER@$VPS_HOST:/tmp/db_capacity.conf

# Step 3: Move to Netdata health.d directory
echo "3️⃣ Installing config..."
ssh $VPS_USER@$VPS_HOST "sudo mv /tmp/db_capacity.conf $NETDATA_HEALTH_DIR/db_capacity.conf && sudo chown netdata:netdata $NETDATA_HEALTH_DIR/db_capacity.conf"

# Step 4: Reload Netdata
echo "4️⃣ Reloading Netdata..."
ssh $VPS_USER@$VPS_HOST "sudo systemctl reload netdata"

# Step 5: Verify alarms are loaded
echo "5️⃣ Verifying alarms..."
ssh $VPS_USER@$VPS_HOST "sudo systemctl status netdata | grep active"

echo ""
echo -e "${GREEN}✅ Netdata capacity alerts deployed!${NC}"
echo ""
echo "📚 Access Netdata dashboard:"
echo "   http://$VPS_HOST:19999"
echo ""
echo "📋 Configured alerts:"
echo "   - vedfinance_db_size_warn: >40GB"
echo "   - vedfinance_db_size_critical: >60GB"
echo "   - behaviorlog_growth_rate: >500MB/h"
echo "   - pg_connection_usage_high: >80%"
echo "   - pg_slow_queries: >1s avg"
echo "   - pg_cache_hit_ratio_low: <90%"
echo "   - vps_disk_usage_warn: >70%"
