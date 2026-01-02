#!/bin/bash
# beads-unified-dashboard.sh
# Combined dashboard showing beads + bv + mcp status

PROJECT_ROOT="${PROJECT_ROOT:-$(pwd)}"
MCP_URL="${AGENT_MAIL_URL:-http://127.0.0.1:9000/mcp/}"

while true; do
  clear
  echo "════════════════════════════════════════════════════════════════"
  echo "         BEADS UNIFIED DASHBOARD"
  echo "════════════════════════════════════════════════════════════════"
  echo ""
  
  # ─────────────────────────────────────────────────────────────
  # SECTION 1: Beads Task Status
  # ─────────────────────────────────────────────────────────────
  
  echo "📋 TASK STATUS (beads)"
  echo "────────────────────────────────────────────────────────────────"
  cd "$PROJECT_ROOT" 2>/dev/null || exit 1
  
  TOTAL=$(beads.exe list --json 2>/dev/null | jq 'length' 2>/dev/null || echo "0")
  OPEN=$(beads.exe list --status open --json 2>/dev/null | jq 'length' 2>/dev/null || echo "0")
  IN_PROGRESS=$(beads.exe list --status in_progress --json 2>/dev/null | jq 'length' 2>/dev/null || echo "0")
  COMPLETED=$(beads.exe list --status completed --json 2>/dev/null | jq 'length' 2>/dev/null || echo "0")
  READY=$(beads.exe ready --json 2>/dev/null | jq 'length' 2>/dev/null || echo "0")
  
  echo "Total:        $TOTAL tasks"
  echo "Open:         $OPEN tasks"
  echo "In Progress:  $IN_PROGRESS tasks"
  echo "Completed:    $COMPLETED tasks"
  echo "Ready:        $READY tasks (no blockers)"
  echo ""
  
  # ─────────────────────────────────────────────────────────────
  # SECTION 2: Graph Analytics (beads_viewer)
  # ─────────────────────────────────────────────────────────────
  
  echo "📊 GRAPH ANALYTICS (beads_viewer)"
  echo "────────────────────────────────────────────────────────────────"
  
  if command -v bv &> /dev/null; then
    BV_INSIGHTS=$(bv --robot-insights --json 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$BV_INSIGHTS" ]; then
      echo "$BV_INSIGHTS" | jq -r '
        "Health Score:     \(.full_stats.health_score // "N/A")",
        "Avg Degree:       \(.full_stats.avg_degree // "N/A")",
        "Blocking Tasks:   \((.Bottlenecks // []) | length)",
        "Critical Path:    \((.CriticalPath // []) | length) tasks",
        "Cycles Detected:  \((.Cycles // []) | length)"
      ' 2>/dev/null
    else
      echo "⚠️ beads_viewer analysis unavailable"
    fi
  else
    echo "⚠️ beads_viewer not installed"
    echo "   Install: curl -fsSL ... | bash"
  fi
  echo ""
  
  # ─────────────────────────────────────────────────────────────
  # SECTION 3: Agent Activity (mcp_agent_mail)
  # ─────────────────────────────────────────────────────────────
  
  echo "🤖 AGENT ACTIVITY (mcp_agent_mail)"
  echo "────────────────────────────────────────────────────────────────"
  
  HEALTH_CHECK=$(curl -s -X POST "$MCP_URL" \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"health_check"},"id":1}' 2>/dev/null)
  
  if echo "$HEALTH_CHECK" | jq -e '.result.status' > /dev/null 2>&1; then
    echo "MCP Server:        Online"
    
    # Active file reservations
    RESERVATIONS=$(curl -s -X POST "$MCP_URL" \
      -H "Content-Type: application/json" \
      -d '{
        "jsonrpc": "2.0",
        "method": "resources/read",
        "params": {
          "uri": "resource://file_reservations/'"$PROJECT_ROOT"'?active_only=true"
        },
        "id": 1
      }' 2>/dev/null | jq '.result | length' 2>/dev/null || echo "0")
    
    echo "Active Locks:      $RESERVATIONS files"
  else
    echo "MCP Server:        ⚠️ Offline"
    echo "   Start: uv run python -m mcp_agent_mail.cli serve-http"
  fi
  echo ""
  
  # ─────────────────────────────────────────────────────────────
  # SECTION 4: Recent Activity
  # ─────────────────────────────────────────────────────────────
  
  echo "📝 RECENT ACTIVITY (last 5 updates)"
  echo "────────────────────────────────────────────────────────────────"
  
  beads.exe list --json 2>/dev/null | jq -r '
    sort_by(.updated_at) | reverse | .[0:5][] 
    | "\(.id): \(.title) (\(.status)) - \(.updated_at)"
  ' 2>/dev/null || echo "No recent activity"
  echo ""
  
  # ─────────────────────────────────────────────────────────────
  # SECTION 5: Next Actions
  # ─────────────────────────────────────────────────────────────
  
  echo "🎯 NEXT ACTIONS (top 3 recommendations)"
  echo "────────────────────────────────────────────────────────────────"
  
  if command -v bv &> /dev/null; then
    BV_TRIAGE=$(bv --robot-triage --json 2>/dev/null)
    if [ $? -eq 0 ] && [ -n "$BV_TRIAGE" ]; then
      echo "$BV_TRIAGE" | jq -r '
        .recommendations[0:3][] 
        | "\(.issue_id): \(.reasoning) (confidence: \(.confidence))"
      ' 2>/dev/null || beads.exe ready --json 2>/dev/null | jq -r '.[0:3][] | "\(.id): \(.title)"' 2>/dev/null
    else
      beads.exe ready --json 2>/dev/null | jq -r '.[0:3][] | "\(.id): \(.title)"' 2>/dev/null
    fi
  else
    beads.exe ready --json 2>/dev/null | jq -r '.[0:3][] | "\(.id): \(.title)"' 2>/dev/null
  fi
  echo ""
  
  echo "════════════════════════════════════════════════════════════════"
  echo "Auto-refresh in 10s... (Ctrl+C to exit)"
  sleep 10
done
