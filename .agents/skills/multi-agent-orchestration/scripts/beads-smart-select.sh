#!/bin/bash
# beads-smart-select.sh
# Combines bd ready with bv --robot-triage for intelligent task selection

set -e

AGENT_NAME=$1
PROJECT_ROOT="${PROJECT_ROOT:-$(pwd)}"

if [ -z "$AGENT_NAME" ]; then
  echo "Usage: $0 <agent_name>" >&2
  exit 1
fi

echo "🔍 Analyzing tasks for $AGENT_NAME..." >&2

# Step 1: Get beads-ready tasks (no blockers)
READY_TASKS=$(cd "$PROJECT_ROOT" && beads.exe ready --json 2>/dev/null | jq -r '.[].id' 2>/dev/null)

if [ -z "$READY_TASKS" ]; then
  echo "⚠️ No ready tasks. Checking for blockers..." >&2
  cd "$PROJECT_ROOT" && beads.exe doctor >&2
  exit 1
fi

# Step 2: Get bv recommendations (PageRank + Betweenness)
BV_RECOMMENDATIONS=$(cd "$PROJECT_ROOT" && bv --robot-triage --json 2>/dev/null)

if [ $? -ne 0 ] || [ -z "$BV_RECOMMENDATIONS" ]; then
  # Fallback: bv not available, just use first ready task
  BEST_TASK=$(echo "$READY_TASKS" | head -1)
  echo "📋 Selected: $BEST_TASK (first ready task, bv unavailable)" >&2
  echo "$BEST_TASK"
  exit 0
fi

# Step 3: Find intersection (ready + high-impact)
BEST_TASK=$(echo "$BV_RECOMMENDATIONS" | jq -r --arg tasks "$READY_TASKS" '
  .recommendations[] 
  | select(.issue_id as $id | ($tasks | split("\n") | index($id)) != null)
  | select(.confidence > 0.7)
  | .issue_id
' | head -1)

if [ -z "$BEST_TASK" ] || [ "$BEST_TASK" = "null" ]; then
  # Fallback: Just pick first ready task
  BEST_TASK=$(echo "$READY_TASKS" | head -1)
  echo "📋 Selected: $BEST_TASK (first ready task)" >&2
else
  echo "🎯 Selected: $BEST_TASK (high-impact + ready)" >&2
fi

# Step 4: Show task context from bv
if command -v bv &> /dev/null; then
  bv --robot-insights --json 2>/dev/null | jq --arg id "$BEST_TASK" '
    .issues[] | select(.id == $id) | {
      id,
      title,
      pagerank,
      betweenness,
      unblocks: (.blocks | length),
      blockers: (.blocked_by | length)
    }
  ' 2>/dev/null >&2 || true
fi

# Step 5: Export for agent
echo "$BEST_TASK" > "$PROJECT_ROOT/.agent-task-selection"
echo "✅ Task exported to .agent-task-selection" >&2

# Output task ID (for script consumption)
echo "$BEST_TASK"
