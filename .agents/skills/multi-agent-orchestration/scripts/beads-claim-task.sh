#!/bin/bash
# beads-claim-task.sh
# Atomic operation: bd update + mcp file reservation + inbox notification

set -e

TASK_ID=$1
AGENT_NAME=$2
PROJECT_ROOT="${PROJECT_ROOT:-$(pwd)}"
MCP_URL="${AGENT_MAIL_URL:-http://127.0.0.1:9000/mcp/}"

if [ -z "$TASK_ID" ] || [ -z "$AGENT_NAME" ]; then
  echo "Usage: $0 <task_id> <agent_name>" >&2
  exit 1
fi

echo "🔒 Claiming task $TASK_ID for $AGENT_NAME..."

# Step 1: Claim in beads
cd "$PROJECT_ROOT"
beads.exe update "$TASK_ID" --status in_progress --actor "$AGENT_NAME" || {
  echo "❌ Failed to claim task" >&2
  exit 1
}

# Step 2: Extract affected files from task description
FILES=$(beads.exe show "$TASK_ID" --json 2>/dev/null | jq -r '
  .body // "" 
  | scan("File: `([^`]+)`") 
  | .[0]
' 2>/dev/null)

if [ -n "$FILES" ]; then
  echo "📁 Reserving files..."
  
  # Step 3: Reserve files in mcp_agent_mail
  while IFS= read -r FILE; do
    if [ -z "$FILE" ]; then continue; fi
    
    echo "  → Reserving: $FILE"
    
    RESPONSE=$(curl -s -X POST "$MCP_URL" \
      -H "Content-Type: application/json" \
      -d '{
        "jsonrpc": "2.0",
        "method": "tools/call",
        "params": {
          "name": "file_reservation_paths",
          "arguments": {
            "project_key": "'"$PROJECT_ROOT"'",
            "agent_name": "'"$AGENT_NAME"'",
            "paths": ["'"$FILE"'"],
            "ttl_seconds": 3600,
            "exclusive": true,
            "reason": "Working on '"$TASK_ID"'"
          }
        },
        "id": 1
      }' 2>/dev/null)
    
    if echo "$RESPONSE" | jq -e '.result.granted[]' > /dev/null 2>&1; then
      echo "  ✅ Reserved: $FILE"
    else
      echo "  ⚠️ Conflict: $FILE (already reserved)" >&2
    fi
  done <<< "$FILES"
fi

# Step 4: Update beads with mcp metadata
beads.exe update "$TASK_ID" \
  --custom-field "mcp_agent=$AGENT_NAME" \
  --custom-field "mcp_reserved_at=$(date -Iseconds 2>/dev/null || date)" \
  2>/dev/null || true

echo "✅ Task $TASK_ID claimed successfully"
