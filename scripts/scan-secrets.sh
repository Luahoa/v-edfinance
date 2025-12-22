#!/bin/bash

echo "🔍 Scanning for hardcoded secrets in codebase..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ISSUES_FOUND=0

# Function to check and report
check_pattern() {
  local description=$1
  local pattern=$2
  local files=$3
  
  echo "Checking for $description..."
  
  if grep -r "$pattern" $files --exclude-dir=node_modules --exclude-dir=.git --exclude="*.md" --exclude="*.log" -n 2>/dev/null | grep -v "EXAMPLE\|PLACEHOLDER\|YOUR_"; then
    echo -e "${RED}❌ Found hardcoded $description${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND+1))
  else
    echo -e "${GREEN}✅ No hardcoded $description${NC}"
  fi
  echo ""
}

# 1. Database URLs with passwords
check_pattern "database URLs with passwords" "postgresql://.*:.*@" "apps/"

# 2. JWT Secrets (actual values, not placeholders)
check_pattern "JWT secrets" "JWT.*SECRET.*=.*['\"][a-zA-Z0-9]{32,}" "apps/"

# 3. API Keys (20+ alphanumeric chars)
check_pattern "API keys" "(API|SECRET)_KEY.*=.*['\"][a-zA-Z0-9]{20,}" "apps/"

# 4. Cloudflare R2 credentials
check_pattern "R2 access keys" "R2_.*KEY.*=.*['\"][a-zA-Z0-9]{20,}" "apps/"

# 5. Private keys
check_pattern "private keys" "-----BEGIN.*PRIVATE KEY-----" "apps/"

# 6. Generic passwords
check_pattern "hardcoded passwords" "password.*=.*['\"][^'\"]{8,}" "apps/ scripts/"

# 7. Authentication tokens
check_pattern "auth tokens" "token.*=.*['\"][a-zA-Z0-9]{20,}" "apps/"

# Summary
echo "═══════════════════════════════════════════"
if [ $ISSUES_FOUND -eq 0 ]; then
  echo -e "${GREEN}✅ Security scan passed! No hardcoded secrets found.${NC}"
  echo "═══════════════════════════════════════════"
  exit 0
else
  echo -e "${RED}❌ Security scan failed! Found $ISSUES_FOUND types of hardcoded secrets.${NC}"
  echo ""
  echo "Please remove hardcoded secrets and use environment variables instead."
  echo "See docs/EPIC1_TASK3_SECRET_AUDIT.md for remediation steps."
  echo "═══════════════════════════════════════════"
  exit 1
fi
