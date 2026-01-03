#!/bin/bash
# Auto-Rollback Script for V-EdFinance
# Epic: VED-DEPLOY
# Task: VED-D03 - Rollback Automation
# Version: 1.0
# Date: 2026-01-04

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DOKPLOY_URL="${DOKPLOY_URL:-https://dokploy.v-edfinance.com}"
ENVIRONMENT="${1:-staging}"
HEALTH_CHECK_RETRIES="${HEALTH_CHECK_RETRIES:-10}"
HEALTH_CHECK_INTERVAL="${HEALTH_CHECK_INTERVAL:-10}"

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}         🔄 V-EdFinance Auto-Rollback${NC}"
echo -e "${BLUE}         Environment: $ENVIRONMENT${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""

# Validate environment
case "$ENVIRONMENT" in
    development|dev)
        ENVIRONMENT="development"
        API_DOMAIN="api-dev.v-edfinance.com"
        WEB_DOMAIN="dev.v-edfinance.com"
        ;;
    staging)
        API_DOMAIN="api-staging.v-edfinance.com"
        WEB_DOMAIN="staging.v-edfinance.com"
        ;;
    production|prod)
        ENVIRONMENT="production"
        API_DOMAIN="api.v-edfinance.com"
        WEB_DOMAIN="v-edfinance.com"
        echo -e "${RED}⚠️  PRODUCTION ROLLBACK - Manual approval required${NC}"
        if [ -z "$FORCE_ROLLBACK" ]; then
            read -p "Are you sure? (yes/no): " CONFIRM
            if [ "$CONFIRM" != "yes" ]; then
                echo "Rollback cancelled"
                exit 1
            fi
        fi
        ;;
    *)
        echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
        echo "Usage: $0 <development|staging|production>"
        exit 1
        ;;
esac

echo -e "${YELLOW}🔍 Checking current deployment health...${NC}"

# Health check function
check_health() {
    local url="$1"
    local retries="$2"
    local interval="$3"
    
    for i in $(seq 1 "$retries"); do
        if curl -f -s -o /dev/null "$url"; then
            return 0
        fi
        echo -e "${YELLOW}  Attempt $i/$retries failed, waiting ${interval}s...${NC}"
        sleep "$interval"
    done
    return 1
}

# Check if services are unhealthy
API_HEALTHY=false
WEB_HEALTHY=false

if check_health "https://$API_DOMAIN/api/health" 3 5; then
    echo -e "${GREEN}✅ API is currently healthy${NC}"
    API_HEALTHY=true
else
    echo -e "${RED}❌ API is unhealthy - rollback needed${NC}"
fi

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://$WEB_DOMAIN")
if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Web is currently healthy${NC}"
    WEB_HEALTHY=true
else
    echo -e "${RED}❌ Web is unhealthy (HTTP $HTTP_CODE) - rollback needed${NC}"
fi

if [ "$API_HEALTHY" = true ] && [ "$WEB_HEALTHY" = true ]; then
    echo -e "${GREEN}✅ All services healthy - no rollback needed${NC}"
    if [ -z "$FORCE_ROLLBACK" ]; then
        exit 0
    fi
    echo -e "${YELLOW}⚠️  FORCE_ROLLBACK set - proceeding anyway${NC}"
fi

echo ""
echo -e "${BLUE}🔄 Initiating rollback to previous deployment...${NC}"

# Get previous deployment
echo -e "${YELLOW}📋 Fetching deployment history...${NC}"

if [ -z "$DOKPLOY_API_TOKEN" ]; then
    echo -e "${RED}❌ DOKPLOY_API_TOKEN not set${NC}"
    exit 1
fi

DEPLOYMENTS=$(curl -s -X GET "$DOKPLOY_URL/api/projects/v-edfinance/deployments" \
    -H "Authorization: Bearer $DOKPLOY_API_TOKEN" \
    -H "Content-Type: application/json")

PREVIOUS_DEPLOYMENT=$(echo "$DEPLOYMENTS" | jq -r \
    --arg env "$ENVIRONMENT" \
    '[.[] | select(.environment == $env and .status == "success")] | sort_by(.timestamp) | .[-2] // empty')

if [ -z "$PREVIOUS_DEPLOYMENT" ] || [ "$PREVIOUS_DEPLOYMENT" = "null" ]; then
    echo -e "${RED}❌ No previous successful deployment found${NC}"
    exit 1
fi

PREVIOUS_COMMIT=$(echo "$PREVIOUS_DEPLOYMENT" | jq -r '.commit')
PREVIOUS_TIMESTAMP=$(echo "$PREVIOUS_DEPLOYMENT" | jq -r '.timestamp')

echo -e "${GREEN}✅ Found previous deployment:${NC}"
echo -e "   Commit: $PREVIOUS_COMMIT"
echo -e "   Timestamp: $PREVIOUS_TIMESTAMP"
echo ""

# Trigger rollback deployment
echo -e "${YELLOW}🚀 Triggering rollback deployment...${NC}"

ROLLBACK_RESPONSE=$(curl -s -X POST "$DOKPLOY_URL/api/deploy" \
    -H "Authorization: Bearer $DOKPLOY_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"project\": \"v-edfinance\",
        \"environment\": \"$ENVIRONMENT\",
        \"commit\": \"$PREVIOUS_COMMIT\",
        \"rollback\": true
    }")

DEPLOY_ID=$(echo "$ROLLBACK_RESPONSE" | jq -r '.deploymentId // empty')

if [ -z "$DEPLOY_ID" ]; then
    echo -e "${RED}❌ Rollback deployment failed${NC}"
    echo "$ROLLBACK_RESPONSE" | jq .
    exit 1
fi

echo -e "${GREEN}✅ Rollback deployment triggered: $DEPLOY_ID${NC}"
echo ""

# Wait for deployment
WAIT_TIME=60
if [ "$ENVIRONMENT" = "production" ]; then
    WAIT_TIME=90
fi

echo -e "${YELLOW}⏳ Waiting ${WAIT_TIME}s for deployment...${NC}"
sleep "$WAIT_TIME"

# Verify rollback health
echo -e "${BLUE}🏥 Verifying rollback health...${NC}"
echo ""

echo -e "${YELLOW}Checking API...${NC}"
if check_health "https://$API_DOMAIN/api/health" "$HEALTH_CHECK_RETRIES" "$HEALTH_CHECK_INTERVAL"; then
    echo -e "${GREEN}✅ API healthy after rollback${NC}"
else
    echo -e "${RED}❌ API still unhealthy after rollback${NC}"
    exit 1
fi

echo -e "${YELLOW}Checking Web...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://$WEB_DOMAIN")
if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Web healthy after rollback (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ Web unhealthy after rollback (HTTP $HTTP_CODE)${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ ROLLBACK SUCCESSFUL ✅                  ║${NC}"
echo -e "${GREEN}║   All services restored to previous state    ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════╝${NC}"
echo ""

# Generate rollback report
REPORT_FILE="rollback-report-$(date +%Y%m%d-%H%M%S).json"
cat > "$REPORT_FILE" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": "$ENVIRONMENT",
  "rollback": {
    "from": {
      "commit": "$(git rev-parse HEAD)",
      "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    },
    "to": {
      "commit": "$PREVIOUS_COMMIT",
      "timestamp": "$PREVIOUS_TIMESTAMP"
    },
    "deploymentId": "$DEPLOY_ID"
  },
  "health_checks": {
    "api": "healthy",
    "web": "healthy"
  },
  "status": "success"
}
EOF

echo -e "${BLUE}📄 Rollback report saved to $REPORT_FILE${NC}"

exit 0
