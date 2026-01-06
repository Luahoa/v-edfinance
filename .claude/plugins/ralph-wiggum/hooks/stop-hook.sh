#!/bin/bash

# Ralph Wiggum Stop Hook
# Prevents session exit when a ralph-loop is active
# Feeds Claude's output back as input to continue the loop

set -euo pipefail

# Read hook input from stdin (advanced stop hook API)
HOOK_INPUT=$(cat)

# Check if ralph-loop is active
RALPH_STATE_FILE=".claude/ralph-loop.local.md"

if [[ ! -f "$RALPH_STATE_FILE" ]]; then
  # No active loop - allow exit
  exit 0
fi

# Parse markdown frontmatter (YAML between ---) and extract values
FRONTMATTER=$(sed -n '/^---$/,/^---$/{ /^---$/d; p; }' "$RALPH_STATE_FILE")
ITERATION=$(echo "$FRONTMATTER" | grep '^iteration:' | sed 's/iteration: *//')
MAX_ITERATIONS=$(echo "$FRONTMATTER" | grep '^max_iterations:' | sed 's/max_iterations: *//')
# Extract completion_promise and strip surrounding quotes if present
COMPLETION_PROMISE=$(echo "$FRONTMATTER" | grep '^completion_promise:' | sed 's/completion_promise: *//' | sed 's/^"\(.*\)"$/\1/')

# Validate numeric fields before arithmetic operations
if [[ ! "$ITERATION" =~ ^[0-9]+$ ]]; then
  echo "⚠️  Ralph loop: State file corrupted" >&2
  echo "   File: $RALPH_STATE_FILE" >&2
  echo "   Problem: 'iteration' field is not a valid number (got: '$ITERATION')" >&2
  echo "" >&2
  echo "   This usually means the state file was manually edited or corrupted." >&2
  echo "   Ralph loop is stopping. Run /ralph-loop again to start fresh." >&2
  rm "$RALPH_STATE_FILE"
  exit 0
fi

if [[ ! "$MAX_ITERATIONS" =~ ^[0-9]+$ ]]; then
  echo "⚠️  Ralph loop: State file corrupted" >&2
  echo "   File: $RALPH_STATE_FILE" >&2
  echo "   Problem: 'max_iterations' field is not a valid number (got: '$MAX_ITERATIONS')" >&2
  echo "" >&2
  echo "   This usually means the state file was manually edited or corrupted." >&2
  echo "   Ralph loop is stopping. Run /ralph-loop again to start fresh." >&2
  rm "$RALPH_STATE_FILE"
  exit 0
fi

# Check if max iterations reached
if [[ $MAX_ITERATIONS -gt 0 ]] && [[ $ITERATION -ge $MAX_ITERATIONS ]]; then
  echo "🛑 Ralph loop: Max iterations ($MAX_ITERATIONS) reached."
  rm "$RALPH_STATE_FILE"
  exit 0
fi

# Get transcript path from hook input
TRANSCRIPT_PATH=$(echo "$HOOK_INPUT" | jq -r '.transcript_path')

if [[ ! -f "$TRANSCRIPT_PATH" ]]; then
  echo "⚠️  Ralph loop: Transcript file not found" >&2
  echo "   Expected: $TRANSCRIPT_PATH" >&2
  echo "   This is unusual and may indicate a Claude Code internal issue." >&2
  echo "   Ralph loop is stopping." >&2
  rm "$RALPH_STATE_FILE"
  exit 0
fi

# Read last assistant message from transcript (JSONL format - one JSON per line)
# First check if there are any assistant messages
if ! grep -q '"role":"assistant"' "$TRANSCRIPT_PATH"; then
  echo "⚠️  Ralph loop: No assistant messages found in transcript" >&2
  echo "   Transcript: $TRANSCRIPT_PATH" >&2
  echo "   This is unusual and may indicate a transcript format issue" >&2
  echo "   Ralph loop is stopping." >&2
  rm "$RALPH_STATE_FILE"
  exit 0
fi

# Extract last assistant message with explicit error handling
LAST_LINE=$(grep '"role":"assistant"' "$TRANSCRIPT_PATH" | tail -1)
if [[ -z "$LAST_LINE" ]]; then
  echo "⚠️  Ralph loop: Failed to extract last assistant message" >&2
  echo "   Ralph loop is stopping." >&2
  rm "$RALPH_STATE_FILE"
  exit 0
fi

# Parse JSON with error handling
LAST_OUTPUT=$(echo "$LAST_LINE" | jq -r '
  .message.content |
  map(select(.type == "text")) |
  map(.text) |
  join("\n")
' 2>&1)

# Check if jq succeeded
if [[ $? -ne 0 ]]; then
  echo "⚠️  Ralph loop: Failed to parse assistant message JSON" >&2
  echo "   Error: $LAST_OUTPUT" >&2
  echo "   This may indicate a transcript format issue" >&2
  echo "   Ralph loop is stopping." >&2
  rm "$RALPH_STATE_FILE"
  exit 0
fi

if [[ -z "$LAST_OUTPUT" ]]; then
  echo "⚠️  Ralph loop: Assistant message contained no text content" >&2
  echo "   Ralph loop is stopping." >&2
  rm "$RALPH_STATE_FILE"
  exit 0
fi

# Check for completion promise (only if set)
if [[ "$COMPLETION_PROMISE" != "null" ]] && [[ -n "$COMPLETION_PROMISE" ]]; then
  # Extract text from <promise> tags using Perl for multiline support
  # -0777 slurps entire input, s flag makes . match newlines
  # .*? is non-greedy (takes FIRST tag), whitespace normalized
  PROMISE_TEXT=$(echo "$LAST_OUTPUT" | perl -0777 -pe 's/.*?<promise>(.*?)<\/promise>.*/$1/s; s/^\s+|\s+$//g; s/\s+/ /g' 2>/dev/null || echo "")

  # Use = for literal string comparison (not pattern matching)
  # == in [[ ]] does glob pattern matching which breaks with *, ?, [ characters
  if [[ -n "$PROMISE_TEXT" ]] && [[ "$PROMISE_TEXT" = "$COMPLETION_PROMISE" ]]; then
    echo "✅ Ralph loop: Detected <promise>$COMPLETION_PROMISE</promise>"
    rm "$RALPH_STATE_FILE"
    exit 0
  fi
fi

# ═══════════════════════════════════════════════════════
# QUALITY GATE INTEGRATION (V-EdFinance)
# ═══════════════════════════════════════════════════════
# Run quality gate verification before continuing loop
# This ensures Claude receives feedback about code quality

QUALITY_GATE_FEEDBACK=""
FAILURE_COUNT_FILE=".ralph-failure-count"
FAILURE_COUNT=0

# Load previous failure count
if [[ -f "$FAILURE_COUNT_FILE" ]]; then
  FAILURE_COUNT=$(cat "$FAILURE_COUNT_FILE")
  if [[ ! "$FAILURE_COUNT" =~ ^[0-9]+$ ]]; then
    FAILURE_COUNT=0
  fi
fi

# Check if quality-gate.sh exists and is executable
if [[ -x "./scripts/quality-gate.sh" ]]; then
  echo "🔍 Running quality gate verification..." >&2
  
  # Run quality gate and capture JSON output
  if ./scripts/quality-gate.sh > /dev/null 2>&1; then
    # Quality gates passed
    echo "✅ All quality gates passed" >&2
    FAILURE_COUNT=0
    echo "$FAILURE_COUNT" > "$FAILURE_COUNT_FILE"
    
    QUALITY_GATE_FEEDBACK="

## ✅ Quality Gate Results (Auto-Generated)
All quality gates PASSED. If your task is complete, you may now output <promise>QUALITY_GATE_PASSED</promise>."
  else
    # Quality gates failed
    echo "❌ Quality gates failed - extracting failure details..." >&2
    
    # Increment failure count
    FAILURE_COUNT=$((FAILURE_COUNT + 1))
    echo "$FAILURE_COUNT" > "$FAILURE_COUNT_FILE"
    
    # Circuit breaker: 3 consecutive failures
    if [[ "$FAILURE_COUNT" -ge 3 ]]; then
      echo "🚨 Circuit breaker triggered: 3 consecutive quality gate failures" >&2
      echo "   Manual intervention required. Ralph loop stopping." >&2
      rm "$RALPH_STATE_FILE"
      rm "$FAILURE_COUNT_FILE"
      exit 0
    fi
    
    # Extract failure details from JSON if available
    if [[ -f ".quality-gate-result.json" ]]; then
      FAILED_GATES=$(jq -r '.gates[] | select(.status == "failed") | "- \(.gate): \(.message)"' .quality-gate-result.json 2>/dev/null || echo "- Could not parse quality gate results")
      
      QUALITY_GATE_FEEDBACK="

## ❌ Quality Gate FAILURES (Auto-Generated - Iteration $NEXT_ITERATION)
**Circuit breaker**: $FAILURE_COUNT/3 consecutive failures

Fix these issues before completion:
$FAILED_GATES

**Next steps**:
1. Read the error messages above
2. Fix the failing quality gates
3. Re-run verification: \`bash scripts/quality-gate.sh\`
4. Continue to next iteration"
    else
      # Fallback if JSON not available - run quality-gate.sh again to capture output
      GATE_OUTPUT=$(./scripts/quality-gate.sh 2>&1 | grep -E "FAIL:|ERROR:" | head -10 || echo "Quality gate failed - run 'bash scripts/quality-gate.sh' for details")
      
      QUALITY_GATE_FEEDBACK="

## ❌ Quality Gate FAILURES (Auto-Generated - Iteration $NEXT_ITERATION)
**Circuit breaker**: $FAILURE_COUNT/3 consecutive failures

Quality gate failed. Recent errors:
\`\`\`
$GATE_OUTPUT
\`\`\`

Run \`bash scripts/quality-gate.sh\` for full details."
    fi
  fi
elif [[ -f "./scripts/quality-gate.sh" ]]; then
  # Script exists but not executable - make it executable
  chmod +x ./scripts/quality-gate.sh
  echo "⚠️  Made quality-gate.sh executable - will run on next iteration" >&2
else
  # No quality gate script - skip verification
  echo "ℹ️  No quality-gate.sh found - skipping quality verification" >&2
fi

# Not complete - continue loop with SAME PROMPT
NEXT_ITERATION=$((ITERATION + 1))

# Extract prompt (everything after the closing ---)
# Skip first --- line, skip until second --- line, then print everything after
# Use i>=2 instead of i==2 to handle --- in prompt content
PROMPT_TEXT=$(awk '/^---$/{i++; next} i>=2' "$RALPH_STATE_FILE")

if [[ -z "$PROMPT_TEXT" ]]; then
  echo "⚠️  Ralph loop: State file corrupted or incomplete" >&2
  echo "   File: $RALPH_STATE_FILE" >&2
  echo "   Problem: No prompt text found" >&2
  echo "" >&2
  echo "   This usually means:" >&2
  echo "     • State file was manually edited" >&2
  echo "     • File was corrupted during writing" >&2
  echo "" >&2
  echo "   Ralph loop is stopping. Run /ralph-loop again to start fresh." >&2
  rm "$RALPH_STATE_FILE"
  exit 0
fi

# Update iteration in frontmatter (portable across macOS and Linux)
# Create temp file, then atomically replace
TEMP_FILE="${RALPH_STATE_FILE}.tmp.$$"
sed "s/^iteration: .*/iteration: $NEXT_ITERATION/" "$RALPH_STATE_FILE" > "$TEMP_FILE"
mv "$TEMP_FILE" "$RALPH_STATE_FILE"

# Append quality gate feedback to prompt
PROMPT_WITH_FEEDBACK="${PROMPT_TEXT}${QUALITY_GATE_FEEDBACK}"

# Build system message with iteration count and completion promise info
if [[ "$COMPLETION_PROMISE" != "null" ]] && [[ -n "$COMPLETION_PROMISE" ]]; then
  SYSTEM_MSG="🔄 Ralph iteration $NEXT_ITERATION | To stop: output <promise>$COMPLETION_PROMISE</promise> (ONLY when statement is TRUE - do not lie to exit!)"
else
  SYSTEM_MSG="🔄 Ralph iteration $NEXT_ITERATION | No completion promise set - loop runs infinitely"
fi

# Output JSON to block the stop and feed prompt back
# The "reason" field contains the prompt that will be sent back to Claude
jq -n \
  --arg prompt "$PROMPT_WITH_FEEDBACK" \
  --arg msg "$SYSTEM_MSG" \
  '{
    "decision": "block",
    "reason": $prompt,
    "systemMessage": $msg
  }'

# Exit 0 for successful hook execution
exit 0
