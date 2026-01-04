#!/bin/bash
# Security Audit Script - Comprehensive Security Check with PDF Report
# Epic: VED-DEPLOY
# Bead: VED-A02
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
REPORT_DIR="${REPORT_DIR:-./security-reports}"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
REPORT_FILE="$REPORT_DIR/security-audit-$TIMESTAMP.txt"
PDF_REPORT="$REPORT_DIR/security-audit-$TIMESTAMP.pdf"

# Security status tracking
CRITICAL_ISSUES=0
HIGH_ISSUES=0
MEDIUM_ISSUES=0
LOW_ISSUES=0

# Create report directory
mkdir -p "$REPORT_DIR"

# ═══════════════════════════════════════════════════════
# Helper Functions
# ═══════════════════════════════════════════════════════

log() {
    echo -e "$1" | tee -a "$REPORT_FILE"
}

critical() {
    log "${RED}🔴 CRITICAL: $1${NC}"
    ((CRITICAL_ISSUES++))
}

high() {
    log "${RED}❌ HIGH: $1${NC}"
    ((HIGH_ISSUES++))
}

medium() {
    log "${YELLOW}⚠️  MEDIUM: $1${NC}"
    ((MEDIUM_ISSUES++))
}

low() {
    log "${YELLOW}ℹ️  LOW: $1${NC}"
    ((LOW_ISSUES++))
}

pass() {
    log "${GREEN}✅ PASS: $1${NC}"
}

# ═══════════════════════════════════════════════════════
# Security Audit Execution
# ═══════════════════════════════════════════════════════

log "${BLUE}════════════════════════════════════════════════════════${NC}"
log "${BLUE}         🔒 V-EdFinance Security Audit Report${NC}"
log "${BLUE}         Date: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
log "${BLUE}════════════════════════════════════════════════════════${NC}"
log ""

# ═══════════════════════════════════════════════════════
# CHECK 1: Hardcoded Secrets Scan
# ═══════════════════════════════════════════════════════

log "${BLUE}╔══ 1. Hardcoded Secrets Scan ══╗${NC}"
log ""

# Run existing scan-secrets.sh and capture results
if bash scripts/scan-secrets.sh > /tmp/secrets_scan.log 2>&1; then
    pass "No hardcoded secrets detected"
else
    SECRETS_FOUND=$(grep -c "❌" /tmp/secrets_scan.log || echo 0)
    if [ "$SECRETS_FOUND" -gt 0 ]; then
        critical "Found $SECRETS_FOUND types of hardcoded secrets (see scan-secrets.sh output)"
    fi
fi

log ""

# ═══════════════════════════════════════════════════════
# CHECK 2: Dependency Vulnerabilities (CVE Check)
# ═══════════════════════════════════════════════════════

log "${BLUE}╔══ 2. Dependency CVE Check ══╗${NC}"
log ""

log "Running pnpm audit..."
if pnpm audit --prod > /tmp/pnpm_audit.log 2>&1; then
    pass "No known vulnerabilities in production dependencies"
else
    # Extract vulnerability counts
    CRITICAL_DEPS=$(grep -c "critical" /tmp/pnpm_audit.log || echo 0)
    HIGH_DEPS=$(grep -c "high" /tmp/pnpm_audit.log || echo 0)
    MODERATE_DEPS=$(grep -c "moderate" /tmp/pnpm_audit.log || echo 0)
    LOW_DEPS=$(grep -c "low" /tmp/pnpm_audit.log || echo 0)
    
    if [ "$CRITICAL_DEPS" -gt 0 ]; then
        critical "$CRITICAL_DEPS critical vulnerabilities in dependencies"
    fi
    
    if [ "$HIGH_DEPS" -gt 0 ]; then
        high "$HIGH_DEPS high vulnerabilities in dependencies"
    fi
    
    if [ "$MODERATE_DEPS" -gt 0 ]; then
        medium "$MODERATE_DEPS moderate vulnerabilities in dependencies"
    fi
    
    if [ "$LOW_DEPS" -gt 0 ]; then
        low "$LOW_DEPS low vulnerabilities in dependencies"
    fi
    
    log ""
    log "Run 'pnpm audit --fix' to auto-fix compatible issues"
    log "Full report: /tmp/pnpm_audit.log"
fi

log ""

# ═══════════════════════════════════════════════════════
# CHECK 3: Authentication Log Review (401/403 Errors)
# ═══════════════════════════════════════════════════════

log "${BLUE}╔══ 3. Authentication Log Review ══╗${NC}"
log ""

# Check for authentication failures in last 24 hours
# Note: This assumes logs are accessible (Docker logs or /var/log)

if command -v docker > /dev/null && docker ps -q --filter "name=api" > /dev/null 2>&1; then
    log "Analyzing API container logs for auth failures (last 24h)..."
    
    AUTH_FAILURES=$(docker logs $(docker ps -q --filter "name=api") --since 24h 2>&1 | grep -E "401|403|Unauthorized|Forbidden" | wc -l || echo 0)
    
    if [ "$AUTH_FAILURES" -eq 0 ]; then
        pass "No authentication failures detected"
    elif [ "$AUTH_FAILURES" -lt 10 ]; then
        low "$AUTH_FAILURES authentication failures (normal threshold)"
    elif [ "$AUTH_FAILURES" -lt 100 ]; then
        medium "$AUTH_FAILURES authentication failures (investigate potential attacks)"
    else
        high "$AUTH_FAILURES authentication failures (potential brute force attack)"
    fi
else
    log "${YELLOW}ℹ️  Docker not available or API container not running (skipping log review)${NC}"
fi

log ""

# ═══════════════════════════════════════════════════════
# CHECK 4: JWT Rotation Check
# ═══════════════════════════════════════════════════════

log "${BLUE}╔══ 4. JWT Secret Rotation Check ══╗${NC}"
log ""

# Check when .env was last modified (as proxy for JWT secret age)
if [ -f "apps/api/.env" ]; then
    ENV_MOD_TIME=$(stat -c %Y apps/api/.env 2>/dev/null || stat -f %m apps/api/.env 2>/dev/null || echo 0)
    CURRENT_TIME=$(date +%s)
    DAYS_OLD=$(( ($CURRENT_TIME - $ENV_MOD_TIME) / 86400 ))
    
    if [ "$DAYS_OLD" -lt 30 ]; then
        pass "JWT secrets rotated within 30 days (age: $DAYS_OLD days)"
    elif [ "$DAYS_OLD" -lt 90 ]; then
        low "JWT secrets are $DAYS_OLD days old (consider rotation at 90 days)"
    else
        medium "JWT secrets are $DAYS_OLD days old (ROTATE NOW - target: 90 days)"
    fi
else
    log "${YELLOW}ℹ️  .env file not found (production deployment)${NC}"
fi

log ""

# ═══════════════════════════════════════════════════════
# CHECK 5: SSL/TLS Certificate Validation
# ═══════════════════════════════════════════════════════

log "${BLUE}╔══ 5. SSL/TLS Certificate Check ══╗${NC}"
log ""

# Check production domain SSL (if configured)
PROD_DOMAIN="${PROD_DOMAIN:-}"

if [ -n "$PROD_DOMAIN" ]; then
    log "Checking SSL certificate for $PROD_DOMAIN..."
    
    CERT_EXPIRY=$(echo | openssl s_client -servername "$PROD_DOMAIN" -connect "$PROD_DOMAIN:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null | grep notAfter | cut -d= -f2)
    
    if [ -n "$CERT_EXPIRY" ]; then
        EXPIRY_TIMESTAMP=$(date -d "$CERT_EXPIRY" +%s 2>/dev/null || date -j -f "%b %d %H:%M:%S %Y %Z" "$CERT_EXPIRY" +%s 2>/dev/null)
        DAYS_UNTIL_EXPIRY=$(( ($EXPIRY_TIMESTAMP - $(date +%s)) / 86400 ))
        
        if [ "$DAYS_UNTIL_EXPIRY" -gt 30 ]; then
            pass "SSL certificate valid (expires in $DAYS_UNTIL_EXPIRY days)"
        elif [ "$DAYS_UNTIL_EXPIRY" -gt 7 ]; then
            medium "SSL certificate expires in $DAYS_UNTIL_EXPIRY days (renew soon)"
        else
            critical "SSL certificate expires in $DAYS_UNTIL_EXPIRY days (URGENT RENEWAL)"
        fi
    else
        low "Unable to verify SSL certificate (check manually)"
    fi
else
    log "${YELLOW}ℹ️  PROD_DOMAIN not set (set environment variable for SSL check)${NC}"
fi

log ""

# ═══════════════════════════════════════════════════════
# CHECK 6: Database Security Configuration
# ═══════════════════════════════════════════════════════

log "${BLUE}╔══ 6. Database Security Configuration ══╗${NC}"
log ""

# Check for database URL in .env (should use secrets manager in production)
if grep -q "DATABASE_URL=" apps/api/.env 2>/dev/null; then
    DB_URL=$(grep "DATABASE_URL=" apps/api/.env | cut -d= -f2)
    
    if [[ "$DB_URL" == *"password"* ]] || [[ "$DB_URL" == *":"*"@"* ]]; then
        medium "Database credentials in .env file (use secrets manager in production)"
    fi
    
    # Check if SSL mode is enabled
    if [[ "$DB_URL" == *"sslmode=require"* ]] || [[ "$DB_URL" == *"sslmode=verify-full"* ]]; then
        pass "Database SSL mode enabled"
    else
        medium "Database SSL mode not enforced (add ?sslmode=require)"
    fi
fi

log ""

# ═══════════════════════════════════════════════════════
# CHECK 7: CORS Configuration Review
# ═══════════════════════════════════════════════════════

log "${BLUE}╔══ 7. CORS Configuration Review ══╗${NC}"
log ""

# Check for overly permissive CORS settings
if grep -r "cors.*origin.*\*" apps/api/src > /dev/null 2>&1; then
    high "CORS allows all origins (*) - restrict to specific domains in production"
else
    pass "CORS configuration appears restrictive"
fi

log ""

# ═══════════════════════════════════════════════════════
# Summary Report
# ═══════════════════════════════════════════════════════

log "${BLUE}════════════════════════════════════════════════════════${NC}"
log "${BLUE}                  📊 Security Audit Summary${NC}"
log "${BLUE}════════════════════════════════════════════════════════${NC}"
log ""

TOTAL_ISSUES=$((CRITICAL_ISSUES + HIGH_ISSUES + MEDIUM_ISSUES + LOW_ISSUES))

log "  ${RED}🔴 Critical:${NC}  $CRITICAL_ISSUES"
log "  ${RED}❌ High:${NC}      $HIGH_ISSUES"
log "  ${YELLOW}⚠️  Medium:${NC}   $MEDIUM_ISSUES"
log "  ${YELLOW}ℹ️  Low:${NC}      $LOW_ISSUES"
log ""
log "  Total Issues: $TOTAL_ISSUES"
log ""

# Generate recommendation
if [ "$CRITICAL_ISSUES" -gt 0 ]; then
    log "${RED}╔═══════════════════════════════════════════════╗${NC}"
    log "${RED}║   🔴 CRITICAL ISSUES FOUND - FIX IMMEDIATELY  ║${NC}"
    log "${RED}╚═══════════════════════════════════════════════╝${NC}"
    EXIT_CODE=2
elif [ "$HIGH_ISSUES" -gt 0 ]; then
    log "${YELLOW}╔═══════════════════════════════════════════════╗${NC}"
    log "${YELLOW}║   ❌ HIGH PRIORITY ISSUES - FIX THIS WEEK     ║${NC}"
    log "${YELLOW}╚═══════════════════════════════════════════════╝${NC}"
    EXIT_CODE=1
elif [ "$TOTAL_ISSUES" -gt 0 ]; then
    log "${YELLOW}╔═══════════════════════════════════════════════╗${NC}"
    log "${YELLOW}║   ⚠️  SECURITY IMPROVEMENTS RECOMMENDED       ║${NC}"
    log "${YELLOW}╚═══════════════════════════════════════════════╝${NC}"
    EXIT_CODE=0
else
    log "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
    log "${GREEN}║   ✅ SECURITY AUDIT PASSED ✅                ║${NC}"
    log "${GREEN}╚═══════════════════════════════════════════════╝${NC}"
    EXIT_CODE=0
fi

log ""
log "Full report: $REPORT_FILE"

# ═══════════════════════════════════════════════════════
# Generate PDF Report (if enscript + ps2pdf available)
# ═══════════════════════════════════════════════════════

if command -v enscript > /dev/null && command -v ps2pdf > /dev/null; then
    log "Generating PDF report..."
    enscript -B -f Courier8 -o - "$REPORT_FILE" 2>/dev/null | ps2pdf - "$PDF_REPORT" 2>/dev/null
    log "${GREEN}PDF report: $PDF_REPORT${NC}"
elif command -v pandoc > /dev/null; then
    log "Generating PDF report with pandoc..."
    pandoc "$REPORT_FILE" -o "$PDF_REPORT" 2>/dev/null
    log "${GREEN}PDF report: $PDF_REPORT${NC}"
else
    log "${YELLOW}ℹ️  Install enscript+ps2pdf or pandoc for PDF report generation${NC}"
fi

exit $EXIT_CODE
