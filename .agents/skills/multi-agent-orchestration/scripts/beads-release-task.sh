#!/bin/bash
# beads-release-task.sh
# Complete workflow: close task + release locks + notify + analyze impact

set -e

TASK_ID=$1
AGENT_NAME=$2
REASON=$3
PROJECT_ROOT="${PROJECT_ROOT:-$(pwd)}"
MCP_URL="${AGENT_MAIL_URL:-http://127.0.0.1:9000/mcp/}"

if [ -z "$TASK_ID" ] || [ -z "$AGENT_NAME" ] || [ -z "$REASON" ]; then
  echo "Usage: $0 <task_id> <agent_name> <reason>" >&2
  exit 1
fi

echo "🏁 Releasing task $TASK_ID..."

# Step 1: Close in beads
cd "$PROJECT_ROOT"
beads.exe close "$TASK_ID" --reason "$REASON" || {
  echo "❌ Failed to close task" >&2
  exit 1
}

# Step 2: Release all file reservations for this agent
echo "🔓 Releasing file reservations..."
RELEASE_RESPONSE=$(curl -s -X POST "$MCP_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "release_file_reservations",
      "arguments": {
        "project_key": "'"$PROJECT_ROOT"'",
        "agent_name": "'"$AGENT_NAME"'"
      }
    },
    "id": 1
  }' 2>/dev/null)

if echo "$RELEASE_RESPONSE" | jq -e '.result.released' > /dev/null 2>&1; then
  echo "$RELEASE_RESPONSE" | jq -r '.result.released[] // empty' 2>/dev/null | while read -r FILE; do
    [ -n "$FILE" ] && echo "  ✅ Released: $FILE"
  done
fi

# Step 3: Notify dependent tasks that are now unblocked
UNBLOCKED=$(beads.exe show "$TASK_ID" --json 2>/dev/null | jq -r '.blocks[] // empty' 2>/dev/null)
if [ -n "$UNBLOCKED" ]; then
  echo "📢 Notifying unblocked tasks: $UNBLOCKED"
  
  while IFS= read -r DEP_TASK; do
    if [ -z "$DEP_TASK" ]; then continue; fi
    
    # Get agent assigned to dependent task
    DEP_AGENT=$(beads.exe show "$DEP_TASK" --json 2>/dev/null | jq -r '.actor // empty' 2>/dev/null)
    
    if [ -n "$DEP_AGENT" ] && [ "$DEP_AGENT" != "null" ]; then
      # Send notification via mcp
      curl -s -X POST "$MCP_URL" \
        -H "Content-Type: application/json" \
        -d '{
          "jsonrpc": "2.0",
          "method": "tools/call",
          "params": {
            "name": "send_message",
            "arguments": {
              "project_key": "'"$PROJECT_ROOT"'",
              "sender_name": "'"$AGENT_NAME"'",
              "to": ["'"$DEP_AGENT"'"],
              "subject": "✅ Blocker Resolved: '"$TASK_ID"'",
              "body_md": "Task **'"$TASK_ID"'** is now complete.\n\nYour task **'"$DEP_TASK"'** is unblocked and ready to work.\n\n---\n'"$REASON"'",
              "importance": "high",
              "thread_id": "task-'"$DEP_TASK"'"
            }
          },
          "id": 1
        }' > /dev/null 2>&1 || true
      
      echo "  → Notified: $DEP_AGENT (task: $DEP_TASK)"
    fi
  done <<< "$UNBLOCKED"
fi

# Step 4: Analyze impact with bv (optional)
if command -v bv &> /dev/null; then
  echo "📊 Analyzing graph impact..."
  DIFF_OUTPUT=$(bv --robot-diff --diff-since HEAD~1 --json 2>/dev/null || echo '{}')
  
  if [ "$DIFF_OUTPUT" != "{}" ]; then
    echo "$DIFF_OUTPUT" | jq '{
      tasks_unblocked: .diff.summary.new_actionable // 0,
      health_change: .diff.summary.health_delta // 0,
      new_cycles: .diff.cycle_count_change // 0
    }' 2>/dev/null || true
  fi
fi

# Step 5: Sync beads to git
echo "🔄 Syncing to git..."
beads.exe sync 2>/dev/null || echo "⚠️ Sync failed (continue anyway)" >&2

echo "✅ Task $TASK_ID released successfully"
