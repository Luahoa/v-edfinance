#!/bin/bash
# beads-apply-recommendations.sh
# Automated fixes based on bv --robot-suggest and --robot-priority

set -e

PROJECT_ROOT="${PROJECT_ROOT:-$(pwd)}"
DRY_RUN="${DRY_RUN:-false}"  # Set to "true" to preview changes

echo "🔧 Applying automated recommendations..."
echo ""

if [ "$DRY_RUN" = "true" ]; then
  echo "🔍 DRY RUN MODE (no changes will be made)"
  echo ""
fi

cd "$PROJECT_ROOT"

if ! command -v bv &> /dev/null; then
  echo "❌ beads_viewer not installed. Cannot apply recommendations."
  exit 1
fi

# ─────────────────────────────────────────────────────────────
# STEP 1: Get Suggestions
# ─────────────────────────────────────────────────────────────

echo "[1/3] Fetching suggestions..."

SUGGESTIONS=$(bv --robot-suggest --json 2>/dev/null)
PRIORITY_RECS=$(bv --robot-priority --json 2>/dev/null)

if [ -z "$SUGGESTIONS" ]; then
  echo "⚠️ No suggestions available"
  SUGGESTIONS='{}'
fi

if [ -z "$PRIORITY_RECS" ]; then
  echo "⚠️ No priority recommendations available"
  PRIORITY_RECS='{}'
fi

# ─────────────────────────────────────────────────────────────
# STEP 2: Apply Dependency Fixes
# ─────────────────────────────────────────────────────────────

echo "[2/3] Applying dependency fixes..."
echo ""

# Add missing dependencies
MISSING_DEPS=$(echo "$SUGGESTIONS" | jq -r '
  (.suggestions.suggestions // []) 
  | map(select(.type == "missing_dependency"))
  | .[]
  | "\(.from_id) \(.to_id)"
' 2>/dev/null)

if [ -n "$MISSING_DEPS" ]; then
  echo "🔗 Adding missing dependencies:"
  
  while IFS=' ' read -r FROM_ID TO_ID; do
    if [ -z "$FROM_ID" ] || [ -z "$TO_ID" ]; then continue; fi
    
    echo "  → $FROM_ID blocks $TO_ID"
    
    if [ "$DRY_RUN" = "false" ]; then
      beads.exe dep add "$FROM_ID" "$TO_ID" 2>/dev/null || echo "    ⚠️ Failed to add dependency"
    fi
  done <<< "$MISSING_DEPS"
  echo ""
fi

# Break cycles
CYCLES=$(echo "$SUGGESTIONS" | jq -r '
  (.suggestions.suggestions // []) 
  | map(select(.type == "cycle"))
  | .[]
  | "\(.from_id) \(.to_id)"
' 2>/dev/null)

if [ -n "$CYCLES" ]; then
  echo "🔄 Breaking cycles:"
  
  while IFS=' ' read -r FROM_ID TO_ID; do
    if [ -z "$FROM_ID" ] || [ -z "$TO_ID" ]; then continue; fi
    
    echo "  → Remove: $FROM_ID blocks $TO_ID"
    
    if [ "$DRY_RUN" = "false" ]; then
      beads.exe dep remove "$FROM_ID" "$TO_ID" 2>/dev/null || echo "    ⚠️ Failed to remove dependency"
    fi
  done <<< "$CYCLES"
  echo ""
fi

# ─────────────────────────────────────────────────────────────
# STEP 3: Apply Priority Adjustments
# ─────────────────────────────────────────────────────────────

echo "[3/3] Applying priority adjustments..."
echo ""

# Only apply high-confidence recommendations (>0.7)
PRIORITY_UPDATES=$(echo "$PRIORITY_RECS" | jq -r '
  (.recommendations // []) 
  | map(select(.confidence > 0.7))
  | .[]
  | "\(.issue_id) \(.suggested_priority)"
' 2>/dev/null)

if [ -n "$PRIORITY_UPDATES" ]; then
  echo "⚖️ Updating priorities (high-confidence only):"
  
  COUNT=0
  while IFS=' ' read -r ISSUE_ID NEW_PRIORITY; do
    if [ -z "$ISSUE_ID" ] || [ -z "$NEW_PRIORITY" ]; then continue; fi
    
    echo "  → $ISSUE_ID: priority=$NEW_PRIORITY"
    
    if [ "$DRY_RUN" = "false" ]; then
      beads.exe update "$ISSUE_ID" --priority "$NEW_PRIORITY" 2>/dev/null || echo "    ⚠️ Failed to update priority"
    fi
    
    COUNT=$((COUNT + 1))
  done <<< "$PRIORITY_UPDATES"
  
  echo ""
  echo "Updated $COUNT task priorities"
else
  echo "✅ No priority adjustments needed (or all low-confidence)"
fi
echo ""

# ─────────────────────────────────────────────────────────────
# STEP 4: Summary
# ─────────────────────────────────────────────────────────────

echo "════════════════════════════════════════════════════════════════"
echo "RECOMMENDATIONS APPLIED"
echo "════════════════════════════════════════════════════════════════"

if [ "$DRY_RUN" = "true" ]; then
  echo "🔍 DRY RUN COMPLETE (no actual changes made)"
  echo ""
  echo "To apply changes, run:"
  echo "  DRY_RUN=false ./scripts/beads-apply-recommendations.sh"
else
  echo "✅ Changes applied successfully"
  echo ""
  echo "Run 'bd sync' to commit changes to git"
  echo "Run './scripts/beads-graph-audit.sh' to verify"
fi

echo "════════════════════════════════════════════════════════════════"

exit 0
