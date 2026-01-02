#!/bin/bash
# beads-graph-audit.sh
# Pre-flight check: Run bv analysis before wave execution

set -e

PROJECT_ROOT="${PROJECT_ROOT:-$(pwd)}"
SEVERITY="${1:-warning}"  # critical, warning, or info

echo "🔍 Running graph health audit..."
echo ""

# ─────────────────────────────────────────────────────────────
# STEP 1: Graph Insights
# ─────────────────────────────────────────────────────────────

echo "📊 GRAPH INSIGHTS"
echo "────────────────────────────────────────────────────────────────"

cd "$PROJECT_ROOT"

if ! command -v bv &> /dev/null; then
  echo "⚠️ beads_viewer not installed. Skipping automated analysis."
  exit 0
fi

INSIGHTS=$(bv --robot-insights --json 2>/dev/null)

if [ $? -ne 0 ] || [ -z "$INSIGHTS" ]; then
  echo "⚠️ Failed to get insights. Check .beads/issues.jsonl"
  exit 1
fi

# Extract key metrics
HEALTH=$(echo "$INSIGHTS" | jq -r '.full_stats.health_score // "N/A"')
CYCLES=$(echo "$INSIGHTS" | jq -r '(.Cycles // []) | length')
BOTTLENECKS=$(echo "$INSIGHTS" | jq -r '(.Bottlenecks // []) | length')
CRITICAL_PATH=$(echo "$INSIGHTS" | jq -r '(.CriticalPath // []) | length')

echo "Health Score:       $HEALTH"
echo "Cycles Detected:    $CYCLES"
echo "Bottleneck Tasks:   $BOTTLENECKS"
echo "Critical Path:      $CRITICAL_PATH tasks"
echo ""

# ─────────────────────────────────────────────────────────────
# STEP 2: Alerts
# ─────────────────────────────────────────────────────────────

echo "🚨 ALERTS (severity: $SEVERITY)"
echo "────────────────────────────────────────────────────────────────"

ALERTS=$(bv --robot-alerts --severity="$SEVERITY" --json 2>/dev/null)

if [ $? -eq 0 ] && [ -n "$ALERTS" ]; then
  ALERT_COUNT=$(echo "$ALERTS" | jq -r '.summary.total // 0')
  
  if [ "$ALERT_COUNT" -gt 0 ]; then
    echo "Found $ALERT_COUNT alerts:"
    echo "$ALERTS" | jq -r '.alerts[] | "  • [\(.severity | ascii_upcase)] \(.message)"'
    echo ""
    
    # Exit with error if critical alerts
    CRITICAL_COUNT=$(echo "$ALERTS" | jq -r '.summary.critical // 0')
    if [ "$CRITICAL_COUNT" -gt 0 ]; then
      echo "❌ CRITICAL ALERTS DETECTED. Fix before proceeding."
      exit 1
    fi
  else
    echo "✅ No alerts at $SEVERITY level"
  fi
else
  echo "⚠️ Failed to get alerts"
fi
echo ""

# ─────────────────────────────────────────────────────────────
# STEP 3: Suggestions
# ─────────────────────────────────────────────────────────────

echo "💡 AUTOMATED SUGGESTIONS"
echo "────────────────────────────────────────────────────────────────"

SUGGESTIONS=$(bv --robot-suggest --json 2>/dev/null)

if [ $? -eq 0 ] && [ -n "$SUGGESTIONS" ]; then
  # Missing dependencies
  MISSING_DEPS=$(echo "$SUGGESTIONS" | jq -r '(.suggestions.suggestions // []) | map(select(.type == "missing_dependency")) | length')
  if [ "$MISSING_DEPS" -gt 0 ]; then
    echo "🔗 Missing Dependencies: $MISSING_DEPS"
    echo "$SUGGESTIONS" | jq -r '
      (.suggestions.suggestions // []) 
      | map(select(.type == "missing_dependency"))
      | .[] 
      | "  • \(.from_id) → \(.to_id): \(.reason)"
    ' 2>/dev/null
  fi
  
  # Cycles
  CYCLE_SUGGESTIONS=$(echo "$SUGGESTIONS" | jq -r '(.suggestions.suggestions // []) | map(select(.type == "cycle")) | length')
  if [ "$CYCLE_SUGGESTIONS" -gt 0 ]; then
    echo "🔄 Cycles to Break: $CYCLE_SUGGESTIONS"
    echo "$SUGGESTIONS" | jq -r '
      (.suggestions.suggestions // []) 
      | map(select(.type == "cycle"))
      | .[] 
      | "  • Remove: \(.from_id) → \(.to_id)"
    ' 2>/dev/null
  fi
  
  # Priority mismatches
  PRIORITY_ISSUES=$(echo "$SUGGESTIONS" | jq -r '(.suggestions.suggestions // []) | map(select(.type == "priority_mismatch")) | length')
  if [ "$PRIORITY_ISSUES" -gt 0 ]; then
    echo "⚖️ Priority Mismatches: $PRIORITY_ISSUES"
    echo "$SUGGESTIONS" | jq -r '
      (.suggestions.suggestions // []) 
      | map(select(.type == "priority_mismatch"))
      | .[] 
      | "  • \(.issue_id): current=\(.current_priority), suggested=\(.suggested_priority)"
    ' 2>/dev/null
  fi
  
  if [ "$MISSING_DEPS" -eq 0 ] && [ "$CYCLE_SUGGESTIONS" -eq 0 ] && [ "$PRIORITY_ISSUES" -eq 0 ]; then
    echo "✅ No structural issues detected"
  fi
else
  echo "⚠️ Failed to get suggestions"
fi
echo ""

# ─────────────────────────────────────────────────────────────
# STEP 4: Summary
# ─────────────────────────────────────────────────────────────

echo "════════════════════════════════════════════════════════════════"
echo "AUDIT SUMMARY"
echo "════════════════════════════════════════════════════════════════"

if [ "$CYCLES" -gt 0 ]; then
  echo "⚠️ WARNING: $CYCLES circular dependencies detected"
fi

if [ "$BOTTLENECKS" -gt 3 ]; then
  echo "⚠️ WARNING: $BOTTLENECKS bottleneck tasks (>3 is high)"
fi

if [ "$HEALTH" != "N/A" ]; then
  HEALTH_FLOAT=$(echo "$HEALTH" | awk '{print $1}')
  if (( $(echo "$HEALTH_FLOAT < 0.7" | bc -l 2>/dev/null || echo 0) )); then
    echo "⚠️ WARNING: Health score $HEALTH < 0.7 (unhealthy)"
  else
    echo "✅ Health score: $HEALTH (healthy)"
  fi
fi

echo ""
echo "Run './scripts/beads-apply-recommendations.sh' to auto-fix issues"
echo "════════════════════════════════════════════════════════════════"

exit 0
