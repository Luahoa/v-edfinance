#!/bin/bash
# Health Check Report - Automated System Status with Slack Integration
# Epic: VED-DEPLOY
# Bead: VED-A01
# Version: 1.0
# Date: 2026-01-04

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LOG_FILE="${LOG_FILE:-/var/log/health.log}"
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# VPS Staging URLs
API_URL="${API_URL:-http://103.54.153.248:3001}"
WEB_URL="${WEB_URL:-http://103.54.153.248:3002}"
DOKPLOY_URL="${DOKPLOY_URL:-http://103.54.153.248:3000}"

# Health status tracking
OVERALL_STATUS="HEALTHY"
ISSUES=()

# ═══════════════════════════════════════════════════════
# Helper Functions
# ═══════════════════════════════════════════════════════

log() {
    local message="[$TIMESTAMP] $1"
    echo -e "$message" | tee -a "$LOG_FILE"
}

check_service() {
    local service_name=$1
    local url=$2
    local expected_code=${3:-200}
    
    log "Checking $service_name at $url..."
    
    local response_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 10 || echo "TIMEOUT")
    
    if [ "$response_code" = "$expected_code" ]; then
        log "${GREEN}✅ $service_name: OK (HTTP $response_code)${NC}"
        return 0
    else
        log "${RED}❌ $service_name: FAIL (HTTP $response_code)${NC}"
        OVERALL_STATUS="DEGRADED"
        ISSUES+=("$service_name returned HTTP $response_code (expected $expected_code)")
        return 1
    fi
}

send_slack_notification() {
    local status=$1
    local message=$2
    
    if [ -z "$SLACK_WEBHOOK_URL" ]; then
        log "${YELLOW}⚠️  Slack webhook not configured (set SLACK_WEBHOOK_URL)${NC}"
        return 0
    fi
    
    local color="good"
    local emoji="✅"
    
    if [ "$status" = "DEGRADED" ]; then
        color="warning"
        emoji="⚠️"
    elif [ "$status" = "DOWN" ]; then
        color="danger"
        emoji="❌"
    fi
    
    local payload=$(cat <<EOF
{
    "attachments": [{
        "color": "$color",
        "title": "$emoji V-EdFinance Health Check",
        "text": "$message",
        "footer": "Automated Health Check",
        "ts": $(date +%s)
    }]
}
EOF
)
    
    curl -s -X POST -H 'Content-type: application/json' \
        --data "$payload" "$SLACK_WEBHOOK_URL" > /dev/null
    
    log "${GREEN}✅ Slack notification sent${NC}"
}

# ═══════════════════════════════════════════════════════
# Health Check Execution
# ═══════════════════════════════════════════════════════

log "${BLUE}════════════════════════════════════════════════════════${NC}"
log "${BLUE}         🔍 V-EdFinance Health Check Report${NC}"
log "${BLUE}════════════════════════════════════════════════════════${NC}"

# 1. Frontend Health
check_service "Web Frontend" "$WEB_URL" 200

# 2. API Health
check_service "API Backend" "$API_URL/health" 200

# 3. Database Connectivity (via API health endpoint)
log "Checking database connectivity..."
DB_STATUS=$(curl -s "$API_URL/health" | grep -o '"database":"[^"]*"' | cut -d'"' -f4 || echo "unknown")

if [ "$DB_STATUS" = "healthy" ]; then
    log "${GREEN}✅ Database: CONNECTED${NC}"
else
    log "${RED}❌ Database: DISCONNECTED${NC}"
    OVERALL_STATUS="DOWN"
    ISSUES+=("Database connection failed")
fi

# 4. Redis Connectivity (via API health endpoint)
log "Checking Redis connectivity..."
REDIS_STATUS=$(curl -s "$API_URL/health" | grep -o '"redis":"[^"]*"' | cut -d'"' -f4 || echo "unknown")

if [ "$REDIS_STATUS" = "healthy" ]; then
    log "${GREEN}✅ Redis: CONNECTED${NC}"
else
    log "${YELLOW}⚠️  Redis: DISCONNECTED${NC}"
    OVERALL_STATUS="DEGRADED"
    ISSUES+=("Redis connection failed")
fi

# 5. Disk Space Check (if running on VPS)
if [ -d "/var/lib/docker" ]; then
    log "Checking disk space..."
    DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [ "$DISK_USAGE" -lt 80 ]; then
        log "${GREEN}✅ Disk space: ${DISK_USAGE}% used${NC}"
    elif [ "$DISK_USAGE" -lt 90 ]; then
        log "${YELLOW}⚠️  Disk space: ${DISK_USAGE}% used (warning)${NC}"
        OVERALL_STATUS="DEGRADED"
        ISSUES+=("Disk space ${DISK_USAGE}% (>80%)")
    else
        log "${RED}❌ Disk space: ${DISK_USAGE}% used (critical)${NC}"
        OVERALL_STATUS="DEGRADED"
        ISSUES+=("Disk space ${DISK_USAGE}% (CRITICAL)")
    fi
fi

# 6. Memory Usage Check (if running on VPS)
if command -v free > /dev/null; then
    log "Checking memory usage..."
    MEM_USAGE=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100)}')
    
    if [ "$MEM_USAGE" -lt 80 ]; then
        log "${GREEN}✅ Memory: ${MEM_USAGE}% used${NC}"
    elif [ "$MEM_USAGE" -lt 90 ]; then
        log "${YELLOW}⚠️  Memory: ${MEM_USAGE}% used (warning)${NC}"
        OVERALL_STATUS="DEGRADED"
        ISSUES+=("Memory ${MEM_USAGE}% (>80%)")
    else
        log "${RED}❌ Memory: ${MEM_USAGE}% used (critical)${NC}"
        OVERALL_STATUS="DEGRADED"
        ISSUES+=("Memory ${MEM_USAGE}% (CRITICAL)")
    fi
fi

# ═══════════════════════════════════════════════════════
# Summary Report
# ═══════════════════════════════════════════════════════

log "${BLUE}════════════════════════════════════════════════════════${NC}"
log "${BLUE}                  📊 Health Check Summary${NC}"
log "${BLUE}════════════════════════════════════════════════════════${NC}"

if [ "$OVERALL_STATUS" = "HEALTHY" ]; then
    log "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
    log "${GREEN}║   ✅ ALL SYSTEMS OPERATIONAL ✅              ║${NC}"
    log "${GREEN}╚═══════════════════════════════════════════════╝${NC}"
    
    send_slack_notification "HEALTHY" "All systems operational ✅\n• Web: OK\n• API: OK\n• Database: Connected\n• Redis: Connected"
    
    exit 0
else
    log "${YELLOW}╔═══════════════════════════════════════════════╗${NC}"
    log "${YELLOW}║   ⚠️  SYSTEM STATUS: $OVERALL_STATUS              ║${NC}"
    log "${YELLOW}╚═══════════════════════════════════════════════╝${NC}"
    
    log ""
    log "${RED}Issues detected:${NC}"
    for issue in "${ISSUES[@]}"; do
        log "  • $issue"
    done
    
    SLACK_MESSAGE="Status: $OVERALL_STATUS ⚠️\n\nIssues:\n$(printf '• %s\n' "${ISSUES[@]}")"
    send_slack_notification "$OVERALL_STATUS" "$SLACK_MESSAGE"
    
    exit 1
fi
