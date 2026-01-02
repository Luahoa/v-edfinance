#!/bin/bash
# beads-plan-sprint.sh
# Create Epic + Tasks with dependencies, validate with bv

set -e

PROJECT_ROOT="${PROJECT_ROOT:-$(pwd)}"
EPIC_TITLE=$1
EPIC_DESCRIPTION=$2

if [ -z "$EPIC_TITLE" ]; then
  echo "Usage: $0 <epic_title> [description]" >&2
  echo "" >&2
  echo "Example:" >&2
  echo "  $0 \"Implement JWT Authentication\" \"Add refresh token support\"" >&2
  exit 1
fi

echo "📋 Planning sprint: $EPIC_TITLE"
echo ""

cd "$PROJECT_ROOT"

# ─────────────────────────────────────────────────────────────
# STEP 1: Create Epic
# ─────────────────────────────────────────────────────────────

echo "[1/4] Creating epic..."

EPIC_ID=$(beads.exe create "$EPIC_TITLE" --type epic --priority 0 --json 2>/dev/null | jq -r '.id' 2>/dev/null)

if [ -z "$EPIC_ID" ] || [ "$EPIC_ID" = "null" ]; then
  echo "❌ Failed to create epic" >&2
  exit 1
fi

echo "✅ Created epic: $EPIC_ID"

# Add description if provided
if [ -n "$EPIC_DESCRIPTION" ]; then
  beads.exe update "$EPIC_ID" --body "$EPIC_DESCRIPTION" 2>/dev/null || true
fi

echo ""

# ─────────────────────────────────────────────────────────────
# STEP 2: Prompt for Tasks
# ─────────────────────────────────────────────────────────────

echo "[2/4] Creating tasks..."
echo ""
echo "Enter tasks (one per line, empty line to finish):"
echo "Format: <title> [--blocks <task_id>] [--priority <0-3>]"
echo ""

TASK_IDS=()

while IFS= read -r LINE; do
  # Empty line = done
  if [ -z "$LINE" ]; then
    break
  fi
  
  # Parse task line
  TASK_TITLE=$(echo "$LINE" | sed 's/ --blocks.*//' | sed 's/ --priority.*//')
  BLOCKS=$(echo "$LINE" | grep -oP '(?<=--blocks )\S+' || echo "")
  PRIORITY=$(echo "$LINE" | grep -oP '(?<=--priority )\d+' || echo "2")
  
  # Create task
  TASK_CMD="beads.exe create \"$TASK_TITLE\" --type task --priority $PRIORITY"
  
  if [ -n "$BLOCKS" ]; then
    TASK_CMD="$TASK_CMD --blocks $BLOCKS"
  fi
  
  # Link to epic
  TASK_CMD="$TASK_CMD --blocks $EPIC_ID"
  
  TASK_ID=$(eval "$TASK_CMD --json 2>/dev/null" | jq -r '.id' 2>/dev/null)
  
  if [ -n "$TASK_ID" ] && [ "$TASK_ID" != "null" ]; then
    echo "  ✅ Created: $TASK_ID - $TASK_TITLE"
    TASK_IDS+=("$TASK_ID")
  else
    echo "  ❌ Failed: $TASK_TITLE" >&2
  fi
done

echo ""
echo "Created ${#TASK_IDS[@]} tasks"
echo ""

# ─────────────────────────────────────────────────────────────
# STEP 3: Validate Graph
# ─────────────────────────────────────────────────────────────

echo "[3/4] Validating task graph..."
echo ""

if ! command -v bv &> /dev/null; then
  echo "⚠️ beads_viewer not installed. Skipping validation."
else
  # Run insights
  INSIGHTS=$(bv --robot-insights --json 2>/dev/null)
  
  if [ $? -eq 0 ] && [ -n "$INSIGHTS" ]; then
    HEALTH=$(echo "$INSIGHTS" | jq -r '.full_stats.health_score // "N/A"')
    CYCLES=$(echo "$INSIGHTS" | jq -r '(.Cycles // []) | length')
    
    echo "Health Score: $HEALTH"
    echo "Cycles:       $CYCLES"
    
    if [ "$CYCLES" -gt 0 ]; then
      echo ""
      echo "⚠️ WARNING: Circular dependencies detected!"
      echo "Run './scripts/beads-apply-recommendations.sh' to fix"
    fi
  fi
fi

echo ""

# ─────────────────────────────────────────────────────────────
# STEP 4: Export Markdown
# ─────────────────────────────────────────────────────────────

echo "[4/4] Exporting sprint plan..."

PLAN_FILE="$PROJECT_ROOT/sprints/$EPIC_ID-plan.md"
mkdir -p "$PROJECT_ROOT/sprints"

cat > "$PLAN_FILE" <<EOF
# Sprint Plan: $EPIC_TITLE

**Epic ID:** $EPIC_ID  
**Created:** $(date -Iseconds 2>/dev/null || date)  
**Status:** Planning

## Description

$EPIC_DESCRIPTION

## Tasks

EOF

# Add task list
for TASK_ID in "${TASK_IDS[@]}"; do
  TASK_DATA=$(beads.exe show "$TASK_ID" --json 2>/dev/null)
  TASK_TITLE=$(echo "$TASK_DATA" | jq -r '.title')
  TASK_PRIORITY=$(echo "$TASK_DATA" | jq -r '.priority')
  TASK_BLOCKS=$(echo "$TASK_DATA" | jq -r '.blocks[] // empty' | tr '\n' ',')
  
  echo "- [ ] **$TASK_ID**: $TASK_TITLE (P$TASK_PRIORITY)" >> "$PLAN_FILE"
  
  if [ -n "$TASK_BLOCKS" ]; then
    echo "  - Blocks: $TASK_BLOCKS" >> "$PLAN_FILE"
  fi
done

echo "" >> "$PLAN_FILE"
echo "## Next Steps" >> "$PLAN_FILE"
echo "" >> "$PLAN_FILE"
echo "1. Review dependencies with \`bv\`" >> "$PLAN_FILE"
echo "2. Run \`./scripts/beads-graph-audit.sh\` to validate" >> "$PLAN_FILE"
echo "3. Execute with \`./scripts/execute-wave.sh\`" >> "$PLAN_FILE"

echo "✅ Plan exported to: $PLAN_FILE"
echo ""

# ─────────────────────────────────────────────────────────────
# STEP 5: Summary
# ─────────────────────────────────────────────────────────────

echo "════════════════════════════════════════════════════════════════"
echo "SPRINT PLANNING COMPLETE"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Epic ID:       $EPIC_ID"
echo "Tasks Created: ${#TASK_IDS[@]}"
echo "Plan File:     $PLAN_FILE"
echo ""
echo "Next actions:"
echo "  1. Review plan: cat $PLAN_FILE"
echo "  2. Validate:    ./scripts/beads-graph-audit.sh"
echo "  3. Refine:      ./scripts/beads-apply-recommendations.sh"
echo "  4. Execute:     ./scripts/execute-wave.sh"
echo ""
echo "════════════════════════════════════════════════════════════════"

exit 0
