#!/bin/bash
# Dependency Update Check - Automated Dependency Management with Beads Integration
# Epic: VED-DEPLOY
# Bead: VED-A04
# Version: 1.0
# Date: 2026-01-04

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
REPORT_DIR="${REPORT_DIR:-./dependency-reports}"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
REPORT_FILE="$REPORT_DIR/dependency-check-$TIMESTAMP.txt"
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"

# Update tracking
MAJOR_UPDATES=()
MINOR_UPDATES=()
PATCH_UPDATES=()
AUTO_UPDATED=()

# Create report directory
mkdir -p "$REPORT_DIR"

# ═══════════════════════════════════════════════════════
# Helper Functions
# ═══════════════════════════════════════════════════════

log() {
    echo -e "$1" | tee -a "$REPORT_FILE"
}

create_bead() {
    local title=$1
    local description=$2
    local priority=${3:-2}
    
    log "${CYAN}📝 Creating beads task: $title${NC}"
    
    if command -v beads.exe > /dev/null 2>&1; then
        beads.exe create "$title" --type task --priority "$priority" --reason "$description" 2>&1 | tee -a "$REPORT_FILE"
    else
        log "${YELLOW}⚠️  Beads not available (task creation skipped)${NC}"
        log "   Manual action required: $title"
        log "   Description: $description"
    fi
}

send_slack_summary() {
    local message=$1
    
    if [ -z "$SLACK_WEBHOOK_URL" ]; then
        return 0
    fi
    
    local payload=$(cat <<EOF
{
    "attachments": [{
        "color": "warning",
        "title": "📦 Weekly Dependency Update Report",
        "text": "$message",
        "footer": "Automated Dependency Check",
        "ts": $(date +%s)
    }]
}
EOF
)
    
    curl -s -X POST -H 'Content-type: application/json' \
        --data "$payload" "$SLACK_WEBHOOK_URL" > /dev/null
}

# ═══════════════════════════════════════════════════════
# Dependency Check Execution
# ═══════════════════════════════════════════════════════

log "${BLUE}════════════════════════════════════════════════════════${NC}"
log "${BLUE}         📦 V-EdFinance Dependency Update Check${NC}"
log "${BLUE}         Date: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
log "${BLUE}════════════════════════════════════════════════════════${NC}"
log ""

# ═══════════════════════════════════════════════════════
# CHECK 1: Check for Outdated Dependencies
# ═══════════════════════════════════════════════════════

log "${BLUE}╔══ 1. Checking for Outdated Dependencies ══╗${NC}"
log ""

log "Running pnpm outdated..."
pnpm outdated --long > /tmp/pnpm_outdated.log 2>&1 || true

if [ ! -s /tmp/pnpm_outdated.log ]; then
    log "${GREEN}✅ All dependencies are up to date!${NC}"
    exit 0
fi

# Parse pnpm outdated output
log "Parsing dependency updates..."

# Extract packages with updates (skip header lines)
tail -n +2 /tmp/pnpm_outdated.log | while IFS= read -r line; do
    # Skip empty lines
    [ -z "$line" ] && continue
    
    # Parse: Package | Current | Latest | Type
    PACKAGE=$(echo "$line" | awk '{print $1}')
    CURRENT=$(echo "$line" | awk '{print $2}')
    LATEST=$(echo "$line" | awk '{print $3}')
    
    # Skip if parsing failed
    [ -z "$PACKAGE" ] || [ -z "$CURRENT" ] || [ -z "$LATEST" ] && continue
    
    # Determine update type (major.minor.patch)
    CURRENT_MAJOR=$(echo "$CURRENT" | cut -d. -f1 | sed 's/[^0-9]//g')
    CURRENT_MINOR=$(echo "$CURRENT" | cut -d. -f2 | sed 's/[^0-9]//g')
    
    LATEST_MAJOR=$(echo "$LATEST" | cut -d. -f1 | sed 's/[^0-9]//g')
    LATEST_MINOR=$(echo "$LATEST" | cut -d. -f2 | sed 's/[^0-9]//g')
    
    # Categorize update
    if [ "$CURRENT_MAJOR" != "$LATEST_MAJOR" ]; then
        # Major version update
        log "${RED}🔴 MAJOR: $PACKAGE ($CURRENT → $LATEST)${NC}"
        echo "$PACKAGE|$CURRENT|$LATEST" >> /tmp/major_updates.txt
    elif [ "$CURRENT_MINOR" != "$LATEST_MINOR" ]; then
        # Minor version update
        log "${YELLOW}🟡 MINOR: $PACKAGE ($CURRENT → $LATEST)${NC}"
        echo "$PACKAGE|$CURRENT|$LATEST" >> /tmp/minor_updates.txt
    else
        # Patch version update
        log "${GREEN}🟢 PATCH: $PACKAGE ($CURRENT → $LATEST)${NC}"
        echo "$PACKAGE|$CURRENT|$LATEST" >> /tmp/patch_updates.txt
    fi
done

log ""

# ═══════════════════════════════════════════════════════
# CHECK 2: Auto-Update Patch Versions
# ═══════════════════════════════════════════════════════

log "${BLUE}╔══ 2. Auto-Updating Patch Versions ══╗${NC}"
log ""

if [ -f /tmp/patch_updates.txt ]; then
    PATCH_COUNT=$(wc -l < /tmp/patch_updates.txt)
    
    if [ "$PATCH_COUNT" -gt 0 ]; then
        log "Found $PATCH_COUNT patch updates. Auto-updating..."
        
        while IFS='|' read -r package current latest; do
            log "  Updating $package: $current → $latest"
            
            # Update the specific package
            pnpm update "$package@$latest" >> "$REPORT_FILE" 2>&1 && {
                AUTO_UPDATED+=("$package ($current → $latest)")
                log "  ${GREEN}✅ Updated successfully${NC}"
            } || {
                log "  ${YELLOW}⚠️  Update failed (review manually)${NC}"
            }
        done < /tmp/patch_updates.txt
        
        log ""
        log "${GREEN}✅ Auto-updated $PATCH_COUNT patch versions${NC}"
    else
        log "${GREEN}✅ No patch updates needed${NC}"
    fi
else
    log "${GREEN}✅ No patch updates needed${NC}"
fi

log ""

# ═══════════════════════════════════════════════════════
# CHECK 3: Create Beads for Major/Minor Updates
# ═══════════════════════════════════════════════════════

log "${BLUE}╔══ 3. Creating Beads Tasks for Major/Minor Updates ══╗${NC}"
log ""

# Handle Major Updates
if [ -f /tmp/major_updates.txt ]; then
    MAJOR_COUNT=$(wc -l < /tmp/major_updates.txt)
    
    if [ "$MAJOR_COUNT" -gt 0 ]; then
        log "${RED}Found $MAJOR_COUNT major updates (breaking changes expected)${NC}"
        
        while IFS='|' read -r package current latest; do
            BEAD_TITLE="Update $package to v$latest (MAJOR)"
            BEAD_DESC="Major version update: $current → $latest. Review changelog for breaking changes. Test thoroughly before merging."
            
            create_bead "$BEAD_TITLE" "$BEAD_DESC" 1  # P1 priority
            
            MAJOR_UPDATES+=("$package ($current → $latest)")
        done < /tmp/major_updates.txt
    fi
fi

# Handle Minor Updates
if [ -f /tmp/minor_updates.txt ]; then
    MINOR_COUNT=$(wc -l < /tmp/minor_updates.txt)
    
    if [ "$MINOR_COUNT" -gt 0 ]; then
        log "${YELLOW}Found $MINOR_COUNT minor updates (new features, backwards compatible)${NC}"
        
        while IFS='|' read -r package current latest; do
            BEAD_TITLE="Update $package to v$latest (MINOR)"
            BEAD_DESC="Minor version update: $current → $latest. Review changelog for new features. Test core functionality."
            
            create_bead "$BEAD_TITLE" "$BEAD_DESC" 2  # P2 priority
            
            MINOR_UPDATES+=("$package ($current → $latest)")
        done < /tmp/minor_updates.txt
    fi
fi

log ""

# ═══════════════════════════════════════════════════════
# Summary Report
# ═══════════════════════════════════════════════════════

log "${BLUE}════════════════════════════════════════════════════════${NC}"
log "${BLUE}                  📊 Dependency Check Summary${NC}"
log "${BLUE}════════════════════════════════════════════════════════${NC}"
log ""

MAJOR_COUNT=${#MAJOR_UPDATES[@]}
MINOR_COUNT=${#MINOR_UPDATES[@]}
PATCH_COUNT=${#AUTO_UPDATED[@]}

log "  ${RED}🔴 Major Updates:${NC}  $MAJOR_COUNT (manual beads created)"
log "  ${YELLOW}🟡 Minor Updates:${NC}  $MINOR_COUNT (manual beads created)"
log "  ${GREEN}🟢 Patch Updates:${NC}  $PATCH_COUNT (auto-updated)"
log ""

if [ $MAJOR_COUNT -gt 0 ]; then
    log "${RED}Major Updates (Breaking Changes Expected):${NC}"
    for update in "${MAJOR_UPDATES[@]}"; do
        log "  • $update"
    done
    log ""
fi

if [ $MINOR_COUNT -gt 0 ]; then
    log "${YELLOW}Minor Updates (New Features):${NC}"
    for update in "${MINOR_UPDATES[@]}"; do
        log "  • $update"
    done
    log ""
fi

if [ $PATCH_COUNT -gt 0 ]; then
    log "${GREEN}Auto-Updated Patches:${NC}"
    for update in "${AUTO_UPDATED[@]}"; do
        log "  • $update"
    done
    log ""
fi

# Generate Slack summary
TOTAL_UPDATES=$((MAJOR_COUNT + MINOR_COUNT + PATCH_COUNT))

if [ $TOTAL_UPDATES -gt 0 ]; then
    SLACK_MSG="Weekly Dependency Report:\n\n"
    SLACK_MSG+="🔴 Major: $MAJOR_COUNT\n"
    SLACK_MSG+="🟡 Minor: $MINOR_COUNT\n"
    SLACK_MSG+="🟢 Patch (auto-updated): $PATCH_COUNT\n\n"
    
    if [ $MAJOR_COUNT -gt 0 ]; then
        SLACK_MSG+="Major updates require manual review. Check beads for tasks."
    elif [ $MINOR_COUNT -gt 0 ]; then
        SLACK_MSG+="Minor updates available. Check beads for tasks."
    else
        SLACK_MSG+="All patch updates completed automatically."
    fi
    
    send_slack_summary "$SLACK_MSG"
fi

log "Full report: $REPORT_FILE"
log ""

if [ $TOTAL_UPDATES -eq 0 ]; then
    log "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
    log "${GREEN}║   ✅ ALL DEPENDENCIES UP TO DATE ✅          ║${NC}"
    log "${GREEN}╚═══════════════════════════════════════════════╝${NC}"
else
    log "${YELLOW}╔═══════════════════════════════════════════════╗${NC}"
    log "${YELLOW}║   📦 $TOTAL_UPDATES DEPENDENCY UPDATES FOUND            ║${NC}"
    log "${YELLOW}║   Review beads tasks for manual updates      ║${NC}"
    log "${YELLOW}╚═══════════════════════════════════════════════╝${NC}"
fi

# Cleanup temp files
rm -f /tmp/pnpm_outdated.log /tmp/major_updates.txt /tmp/minor_updates.txt /tmp/patch_updates.txt

exit 0
