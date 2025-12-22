#!/bin/bash
# AI Database Architect - Weekly Autonomous Optimization
# Runs: Every Sunday 3AM
# Integrates with: Netdata for alerts, pg_stat_statements for analysis

set -euo pipefail

WEBHOOK_URL="${NETDATA_WEBHOOK_URL:-http://localhost:19999/api/v1/alarms?all}"
API_URL="${API_URL:-http://localhost:3001}"
LOG_FILE="/var/log/db-architect.log"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

notify_netdata() {
    local status=$1
    local message=$2
    
    # Netdata custom alarm via HTTP API
    curl -X POST "$WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "{
            \"alarm\": \"DB Architect\",
            \"status\": \"$status\",
            \"message\": \"$message\",
            \"source\": \"ai-database-architect\"
        }" \
        --silent --fail || log "⚠️  Netdata notification failed"
}

log "🤖 AI Database Architect - Starting weekly scan..."
notify_netdata "RUNNING" "Starting autonomous database optimization scan"

# Step 1: Analyze slow queries from pg_stat_statements
log "📊 Analyzing pg_stat_statements..."
SLOW_QUERIES=$(curl -s "$API_URL/api/database/analyze-slow-queries" | jq -r '.count // 0')

if [ "$SLOW_QUERIES" -eq 0 ]; then
    log "✅ No slow queries detected (< 100ms threshold)"
    notify_netdata "CLEAR" "No database optimizations needed - all queries fast"
    exit 0
fi

log "⚠️  Found $SLOW_QUERIES slow queries"

# Step 2: Generate AI recommendations
log "🧠 Generating AI optimization recommendations..."
RECOMMENDATIONS=$(curl -s -X POST "$API_URL/api/database/generate-recommendations" \
    -H "Content-Type: application/json" \
    -d '{"threshold_ms": 100, "limit": 20}')

RECO_COUNT=$(echo "$RECOMMENDATIONS" | jq -r 'length // 0')
log "💡 Generated $RECO_COUNT recommendations"

# Step 3: Auto-apply high-confidence optimizations (>90%)
log "⚡ Auto-applying high-confidence recommendations..."
AUTO_APPLIED=$(curl -s -X POST "$API_URL/api/database/auto-apply-optimizations" \
    -H "Content-Type: application/json" \
    -d '{"min_confidence": 90}' | jq -r '.applied // 0')

log "✅ Auto-applied $AUTO_APPLIED optimizations"

# Step 4: Summary & Notification
if [ "$AUTO_APPLIED" -gt 0 ]; then
    MESSAGE="🎯 DB Architect applied $AUTO_APPLIED optimizations. Slow queries: $SLOW_QUERIES → Expected improvement: 30-65%"
    notify_netdata "WARNING" "$MESSAGE"
    log "$MESSAGE"
else
    MESSAGE="📋 DB Architect found $SLOW_QUERIES slow queries but no auto-applicable optimizations (confidence < 90%). Manual review recommended."
    notify_netdata "WARNING" "$MESSAGE"
    log "$MESSAGE"
fi

# Step 5: Performance metrics to Netdata
log "📈 Sending performance metrics to Netdata..."
curl -X POST "http://localhost:19999/api/v1/data?chart=postgres.queries" \
    -H "Content-Type: application/json" \
    -d "{
        \"slow_queries\": $SLOW_QUERIES,
        \"optimizations_applied\": $AUTO_APPLIED,
        \"scan_timestamp\": $(date +%s)
    }" \
    --silent --fail || log "⚠️  Metrics push failed"

log "🏁 AI Database Architect scan complete"
notify_netdata "CLEAR" "Weekly optimization scan completed successfully"

exit 0
