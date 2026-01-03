#!/bin/bash
# ====================================================================
# Incident Tracker Script
# ====================================================================
# Purpose: Track and analyze incidents over time
# Usage: ./incident-tracker.sh [command] [options]
# ====================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Paths
INCIDENTS_FILE="docs/INCIDENTS.md"
RCA_DIR="docs/incidents"
BACKUP_DIR=".incident-backups"

# Ensure directories exist
mkdir -p "$RCA_DIR" "$BACKUP_DIR"

# ====================================================================
# Helper Functions
# ====================================================================

show_help() {
    echo -e "${BLUE}Incident Tracker - V-EdFinance${NC}"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  log          - Log a new incident"
    echo "  update       - Update existing incident status"
    echo "  stats        - Show incident statistics"
    echo "  trends       - Analyze incident trends"
    echo "  dashboard    - Show incident dashboard"
    echo "  rca          - Create RCA document"
    echo "  help         - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 log --severity P0 --title 'Database down'"
    echo "  $0 update INC-2026-01-04-001 --status Resolved"
    echo "  $0 stats --month 2026-01"
    echo "  $0 dashboard"
}

log_incident() {
    local SEVERITY=$1
    local TITLE=$2
    local DATE=$(date -u +"%Y-%m-%d")
    local TIME=$(date -u +"%H:%M")
    
    # Generate incident ID
    local COUNT=$(grep -c "^## INC-" "$INCIDENTS_FILE" 2>/dev/null || echo 0)
    local INC_ID=$(printf "INC-%s-%03d" "$DATE" $((COUNT + 1)))
    
    echo -e "${BLUE}Creating incident: $INC_ID${NC}"
    
    # Backup incidents file
    cp "$INCIDENTS_FILE" "$BACKUP_DIR/INCIDENTS_$(date +%Y%m%d_%H%M%S).md"
    
    # Create incident entry
    cat >> "$INCIDENTS_FILE" << EOF

## $INC_ID: $TITLE
**Date:** $DATE $TIME UTC  
**Severity:** $SEVERITY  
**Status:** Investigating  
**MTTR:** - (in progress)  
**Affected Users:** ~TBD users  

**Detection:**
- [How was it detected?]

**Impact:**
- [What functionality is affected?]

**Root Cause:**
- [Investigation in progress]

**Resolution:**
- [Actions being taken]

**Timeline:**
- $TIME - Incident detected
- $TIME - Investigation started

**Follow-up Beads:**
- TBD

**RCA Document:** TBD

---
EOF

    echo -e "${GREEN}✅ Incident logged: $INC_ID${NC}"
    echo -e "Edit $INCIDENTS_FILE to add details"
    echo -e "Create RCA: $0 rca $INC_ID"
}

update_incident() {
    local INC_ID=$1
    local STATUS=$2
    local RESOLUTION=$3
    
    echo -e "${BLUE}Updating incident: $INC_ID${NC}"
    
    # Check if incident exists
    if ! grep -q "## $INC_ID:" "$INCIDENTS_FILE"; then
        echo -e "${RED}❌ Incident $INC_ID not found${NC}"
        exit 1
    fi
    
    # Backup
    cp "$INCIDENTS_FILE" "$BACKUP_DIR/INCIDENTS_$(date +%Y%m%d_%H%M%S).md"
    
    # Update status
    sed -i "s/\*\*Status:\*\* Investigating/\*\*Status:\*\* $STATUS/" "$INCIDENTS_FILE"
    
    echo -e "${GREEN}✅ Incident $INC_ID updated to: $STATUS${NC}"
}

show_stats() {
    local MONTH=${1:-$(date +%Y-%m)}
    
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
    echo -e "${BLUE}   Incident Statistics - $MONTH${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
    echo ""
    
    # Count by severity
    local P0_COUNT=$(grep -c "^\*\*Severity:\*\* P0" "$INCIDENTS_FILE" 2>/dev/null || echo 0)
    local P1_COUNT=$(grep -c "^\*\*Severity:\*\* P1" "$INCIDENTS_FILE" 2>/dev/null || echo 0)
    local P2_COUNT=$(grep -c "^\*\*Severity:\*\* P2" "$INCIDENTS_FILE" 2>/dev/null || echo 0)
    local TOTAL=$((P0_COUNT + P1_COUNT + P2_COUNT))
    
    echo -e "  ${RED}P0 (Critical):${NC}     $P0_COUNT"
    echo -e "  ${YELLOW}P1 (High):${NC}        $P1_COUNT"
    echo -e "  ${GREEN}P2 (Medium):${NC}      $P2_COUNT"
    echo -e "  ${BLUE}─────────────────${NC}"
    echo -e "  ${BLUE}Total:${NC}            $TOTAL"
    echo ""
    
    # Count by status
    local INVESTIGATING=$(grep -c "^\*\*Status:\*\* Investigating" "$INCIDENTS_FILE" 2>/dev/null || echo 0)
    local MITIGATED=$(grep -c "^\*\*Status:\*\* Mitigated" "$INCIDENTS_FILE" 2>/dev/null || echo 0)
    local RESOLVED=$(grep -c "^\*\*Status:\*\* Resolved" "$INCIDENTS_FILE" 2>/dev/null || echo 0)
    
    echo -e "  ${RED}Investigating:${NC}    $INVESTIGATING"
    echo -e "  ${YELLOW}Mitigated:${NC}        $MITIGATED"
    echo -e "  ${GREEN}Resolved:${NC}         $RESOLVED"
    echo ""
    
    # MTTR calculation (if data available)
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
    echo -e "${BLUE}   MTTR (Mean Time To Recovery)${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
    echo ""
    echo -e "  P0 Target: <10 min   | Current: TBD"
    echo -e "  P1 Target: <30 min   | Current: TBD"
    echo -e "  P2 Target: <2 hours  | Current: TBD"
    echo ""
}

analyze_trends() {
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
    echo -e "${BLUE}   Incident Trend Analysis${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
    echo ""
    
    # Count incidents by month (last 6 months)
    echo -e "${BLUE}Incidents by Month (Last 6 Months):${NC}"
    for i in {5..0}; do
        MONTH=$(date -d "$i month ago" +%Y-%m 2>/dev/null || date -v-${i}m +%Y-%m)
        COUNT=$(grep "^## INC-$MONTH" "$INCIDENTS_FILE" 2>/dev/null | wc -l)
        echo -e "  $MONTH: $COUNT incidents"
    done
    echo ""
    
    # Top 3 root causes
    echo -e "${BLUE}Top 3 Root Causes:${NC}"
    echo -e "  1. [Manual analysis needed]"
    echo -e "  2. [Check RCA documents]"
    echo -e "  3. [Update after incidents]"
    echo ""
    
    # Repeat incidents
    echo -e "${BLUE}Repeat Incidents:${NC}"
    echo -e "  [Track similar incidents over time]"
    echo ""
}

show_dashboard() {
    clear
    echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║         V-EdFinance Incident Dashboard                ║${NC}"
    echo -e "${BLUE}║         $(date -u '+%Y-%m-%d %H:%M:%S UTC')                    ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Active incidents
    echo -e "${RED}🚨 Active Incidents:${NC}"
    local ACTIVE=$(grep -c "^\*\*Status:\*\* Investigating" "$INCIDENTS_FILE" 2>/dev/null || echo 0)
    if [ "$ACTIVE" -eq 0 ]; then
        echo -e "  ${GREEN}✅ None - All systems operational${NC}"
    else
        grep -A 5 "^\*\*Status:\*\* Investigating" "$INCIDENTS_FILE" | head -n 10
    fi
    echo ""
    
    # Today's metrics
    local TODAY=$(date +%Y-%m-%d)
    local TODAY_COUNT=$(grep -c "^## INC-$TODAY" "$INCIDENTS_FILE" 2>/dev/null || echo 0)
    
    echo -e "${BLUE}📊 Today's Metrics:${NC}"
    echo -e "  Incidents: $TODAY_COUNT"
    echo -e "  MTTR: TBD"
    echo -e "  Affected Users: 0"
    echo ""
    
    # This month
    local MONTH=$(date +%Y-%m)
    local MONTH_COUNT=$(grep -c "^## INC-$MONTH" "$INCIDENTS_FILE" 2>/dev/null || echo 0)
    
    echo -e "${BLUE}📅 This Month ($MONTH):${NC}"
    echo -e "  Total Incidents: $MONTH_COUNT"
    echo -e "  P0: $(grep "^## INC-$MONTH" "$INCIDENTS_FILE" 2>/dev/null | grep -c "P0" || echo 0)"
    echo -e "  P1: $(grep "^## INC-$MONTH" "$INCIDENTS_FILE" 2>/dev/null | grep -c "P1" || echo 0)"
    echo ""
    
    # SLA status
    echo -e "${BLUE}🎯 SLA Status:${NC}"
    echo -e "  Uptime Target: 99.9%"
    echo -e "  Current: TBD (measuring)"
    echo ""
    
    # Recent incidents (last 5)
    echo -e "${BLUE}📝 Recent Incidents (Last 5):${NC}"
    grep "^## INC-" "$INCIDENTS_FILE" | tail -n 5 | sed 's/^## /  - /'
    echo ""
}

create_rca() {
    local INC_ID=$1
    
    if [ -z "$INC_ID" ]; then
        echo -e "${RED}❌ Usage: $0 rca INC-YYYY-MM-DD-NNN${NC}"
        exit 1
    fi
    
    # Extract date from INC_ID (format: INC-YYYY-MM-DD-NNN)
    local DATE=$(echo "$INC_ID" | cut -d'-' -f2-4)
    local RCA_FILE="$RCA_DIR/$DATE-${INC_ID##*-}-rca.md"
    
    echo -e "${BLUE}Creating RCA document: $RCA_FILE${NC}"
    
    # Create RCA template
    cat > "$RCA_FILE" << EOF
# Root Cause Analysis: $INC_ID

**Date:** $(date -u +"%Y-%m-%d %H:%M UTC")  
**Author:** [Your Name]  
**Severity:** [P0/P1/P2]  
**Duration:** [X minutes/hours]

---

## Executive Summary

[Brief 2-3 sentence summary of the incident, impact, and resolution]

---

## Timeline

| Time (UTC) | Event |
|------------|-------|
| HH:MM | Incident detected via [monitoring/user report] |
| HH:MM | Investigation started |
| HH:MM | Root cause identified |
| HH:MM | Mitigation applied |
| HH:MM | Service restored |
| HH:MM | Incident resolved |

**Total Duration:** [X minutes]

---

## Impact

### User Impact
- **Affected Users:** ~X users
- **Functionality Affected:** [What features were unavailable?]
- **User-Facing Symptoms:** [What did users experience?]

### Business Impact
- **Revenue Impact:** \$X (if applicable)
- **SLA Impact:** [Did we breach SLA?]
- **Reputation:** [Customer complaints, support tickets, etc.]

---

## Root Cause (5 Whys Analysis)

1. **What happened?**
   - [Describe the symptom]

2. **Why did it happen?**
   - [Immediate cause]

3. **Why did that happen?**
   - [Underlying cause]

4. **Why did that happen?**
   - [Deeper cause]

5. **Why did that happen?**
   - [Root cause]

**Root Cause:** [Final answer - what fundamentally caused this?]

---

## Contributing Factors

- [Factor 1: e.g., insufficient monitoring]
- [Factor 2: e.g., manual deployment process]
- [Factor 3: e.g., lack of load testing]

---

## Resolution

### Immediate Fix (What stopped the bleeding?)
[Describe the immediate action taken to restore service]

### Long-Term Fix (How to prevent recurrence?)
[Describe the permanent fix being implemented]

---

## Action Items

| ID | Description | Owner | Due Date | Status |
|----|-------------|-------|----------|--------|
| ved-xxx | [Preventive measure 1] | [Team/Person] | YYYY-MM-DD | Todo |
| ved-xxx | [Preventive measure 2] | [Team/Person] | YYYY-MM-DD | Todo |
| ved-xxx | [Improve monitoring] | [Team/Person] | YYYY-MM-DD | Todo |

---

## Lessons Learned

### What Went Well
- [Thing 1]
- [Thing 2]

### What Didn't Go Well
- [Thing 1]
- [Thing 2]

### What We'll Do Differently
- [Change 1]
- [Change 2]

---

## Preventive Measures

1. **Technical:**
   - [Add monitoring for X]
   - [Implement circuit breaker]
   - [Add automated tests]

2. **Process:**
   - [Update runbook]
   - [Add deployment checklist]
   - [Improve alerting]

3. **Training:**
   - [Team training on X]
   - [Update documentation]

---

## Appendix

### Relevant Logs
\`\`\`
[Paste relevant log excerpts]
\`\`\`

### Monitoring Graphs
[Link to Grafana dashboards]

### Related Incidents
- [Link to similar past incidents]

---

**Status:** Draft | Under Review | Approved  
**Reviewed By:** [Names]  
**Approved By:** [Name]  
**Date:** YYYY-MM-DD
EOF

    echo -e "${GREEN}✅ RCA template created: $RCA_FILE${NC}"
    echo -e "Edit the file to complete the RCA"
}

# ====================================================================
# Main Script
# ====================================================================

case "${1:-help}" in
    log)
        shift
        SEVERITY=${1:-P2}
        TITLE=${2:-"Untitled Incident"}
        log_incident "$SEVERITY" "$TITLE"
        ;;
    update)
        shift
        INC_ID=$1
        STATUS=${2:-Resolved}
        update_incident "$INC_ID" "$STATUS"
        ;;
    stats)
        shift
        MONTH=${1:-$(date +%Y-%m)}
        show_stats "$MONTH"
        ;;
    trends)
        analyze_trends
        ;;
    dashboard)
        show_dashboard
        ;;
    rca)
        shift
        create_rca "$1"
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
