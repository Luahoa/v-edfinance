# 🤖 Multi-Agent Coordination Integration Plan

**Project:** V-EdFinance  
**Date:** 2026-01-03  
**Objective:** Integrate beads_viewer + mcp_agent_mail for 100-agent orchestration  
**Status:** 🟡 In Progress

---

## 🎯 Integration Strategy

### Problem Statement
Current 100-agent orchestration plan lacks:
1. **Visual task dependency tracking** (beads tasks are scattered)
2. **Agent-to-agent communication** (agents work in isolation)
3. **File conflict prevention** (multiple agents editing same files)
4. **Real-time progress monitoring** (no central dashboard)

### Solution Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ORCHESTRATION LAYER                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐         ┌──────────────────┐        │
│  │  beads_viewer    │         │  mcp_agent_mail  │        │
│  │  (bv)            │◄────────┤  (Message Bus)   │        │
│  │                  │  Sync   │                  │        │
│  │  • Task Graph    │         │  • Inbox/Outbox  │        │
│  │  • Dependencies  │         │  • File Locks    │        │
│  │  • PageRank      │         │  • ACK Tracking  │        │
│  │  • Robot API     │         │  • Contact Policy│        │
│  └──────────────────┘         └──────────────────┘        │
│           │                            │                   │
│           └────────────┬───────────────┘                   │
│                        ▼                                   │
│              ┌──────────────────┐                         │
│              │  Beads (.beads/) │                         │
│              │  beads.jsonl     │                         │
│              └──────────────────┘                         │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   100 AI AGENTS                             │
│  Wave 1 (5)  →  Wave 2 (20)  →  Wave 3 (40)  →  ...       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Component 1: beads_viewer (bv)

### Purpose
**Visual task tracking + AI-driven recommendations**

### Installation

```bash
# Install Go binary
curl -fsSL "https://raw.githubusercontent.com/Dicklesworthstone/beads_viewer/main/install.sh?$(date +%s)" | bash

# Verify installation
bv --version
```

### Integration Points

#### 1. Robot API for Agents

**Critical commands for 100-agent orchestration:**

```bash
# ═══════════════════════════════════════════════════════════
# AGENT WORKFLOW: Task Selection
# ═══════════════════════════════════════════════════════════

# Step 1: Get THE MEGA-COMMAND (all analysis in one call)
bv --robot-triage > triage.json

# Step 2: Extract highest-impact actionable task
TASK=$(jq -r '.plan.summary.highest_impact' triage.json)

# Step 3: Get full graph insights
bv --robot-insights > insights.json

# Step 4: Check for blocking dependencies
bv --robot-plan | jq '.plan.tracks[].items[] | select(.id == "'"$TASK"'") | .unblocks'

# ═══════════════════════════════════════════════════════════
# MONITORING: Real-time Progress
# ═══════════════════════════════════════════════════════════

# Check project health (before starting wave)
bv --robot-insights | jq '.full_stats.health_score'

# Detect blocking cascades
bv --robot-alerts --severity=critical

# Track cycle introductions (avoid circular dependencies)
bv --robot-insights | jq '.Cycles'

# ═══════════════════════════════════════════════════════════
# REPORTING: Wave Completion
# ═══════════════════════════════════════════════════════════

# Export wave summary
bv --export-md wave_1_report.md

# Generate static dashboard for stakeholders
bv --export-pages ./bv-pages --pages-title "100-Agent Progress"

# Compare state before/after wave
bv --diff-since HEAD~5 --robot-diff > wave_diff.json
```

#### 2. Automation Scripts

```bash
# scripts/agent_select_task.sh
#!/bin/bash
# Auto-assign tasks to agents based on PageRank

AGENT_NAME=$1
PROJECT_KEY="c:/Users/luaho/Demo project/v-edfinance"

# Get top recommendation
TASK=$(bv --robot-next | jq -r '.recommendation.issue_id')

# Claim in beads
beads.exe update $TASK --status in_progress

# Export context for agent
bv --robot-insights --label $(echo $TASK | cut -d'-' -f1) > ${AGENT_NAME}_context.json

echo "Agent $AGENT_NAME assigned: $TASK"
```

#### 3. Static Dashboard Export

```bash
# After each wave completes
bv --export-pages ./monitoring/wave_${WAVE_NUM} \
  --pages-title "Wave ${WAVE_NUM} Progress" \
  --pages-exclude-closed

# Deploy to GitHub Pages (optional)
cd monitoring/wave_${WAVE_NUM}
# Upload to gh-pages branch or static host
```

### Key Features for 100-Agent Use

| Feature | Use Case | Command |
|---------|----------|---------|
| **PageRank** | Identify foundational tasks (high impact) | `bv --robot-insights \| jq '.pagerank'` |
| **Betweenness** | Find bottleneck tasks (blocking multiple) | `bv --robot-insights \| jq '.betweenness'` |
| **Critical Path** | Determine longest dependency chains | `bv --robot-insights \| jq '.CriticalPath'` |
| **Actionable Plan** | Get work-ready tasks (no blockers) | `bv --robot-plan \| jq '.plan.tracks'` |
| **Alerts** | Detect stale tasks, blocking cascades | `bv --robot-alerts --severity=warning` |
| **Diff Tracking** | Compare before/after each wave | `bv --diff-since HEAD~10 --robot-diff` |

---

## 📦 Component 2: mcp_agent_mail

### Purpose
**Multi-agent messaging + file conflict prevention**

### Installation

```bash
# Install with custom port (avoid conflict with Cursor)
curl -fsSL "https://raw.githubusercontent.com/Dicklesworthstone/mcp_agent_mail/main/scripts/install.sh?$(date +%s)" | bash -s -- --port 9000 --yes

# Verify installation
uv run python -m mcp_agent_mail.cli config show-port
```

### Configuration

```bash
# .env (project root)
STORAGE_ROOT=c:/Users/luaho/Demo project/v-edfinance/.agent-mail
HTTP_HOST=127.0.0.1
HTTP_PORT=9000
HTTP_PATH=/mcp/

# Agent naming strategy
AGENT_NAME_ENFORCEMENT_MODE=coerce  # Auto-generate adjective+noun names

# File reservation settings
FILE_RESERVATIONS_ENFORCEMENT_ENABLED=true
FILE_RESERVATION_INACTIVITY_SECONDS=1800  # 30 min
FILE_RESERVATION_ACTIVITY_GRACE_SECONDS=900  # 15 min

# Contact policy (auto-approve for same project)
CONTACT_ENFORCEMENT_ENABLED=true
CONTACT_AUTO_TTL_SECONDS=86400  # 1 day
MESSAGING_AUTO_HANDSHAKE_ON_BLOCK=true
```

### Integration Points

#### 1. Agent Registration

```bash
# scripts/register_agent.sh
#!/bin/bash
AGENT_NAME=$1
TASK_DESC=$2
PROJECT_KEY="c:/Users/luaho/Demo project/v-edfinance"

# Register agent with mcp_agent_mail
curl -X POST http://127.0.0.1:9000/mcp/ \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "register_agent",
      "arguments": {
        "project_key": "'"$PROJECT_KEY"'",
        "program": "Amp Agent",
        "model": "claude-3.5-sonnet",
        "name": "'"$AGENT_NAME"'",
        "task_description": "'"$TASK_DESC"'"
      }
    },
    "id": 1
  }'
```

#### 2. File Reservation Protocol

```bash
# Before editing files
curl -X POST http://127.0.0.1:9000/mcp/ \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "file_reservation_paths",
      "arguments": {
        "project_key": "'"$PROJECT_KEY"'",
        "agent_name": "'"$AGENT_NAME"'",
        "paths": ["apps/api/src/modules/auth/auth.service.ts"],
        "ttl_seconds": 3600,
        "exclusive": true,
        "reason": "Implementing JWT refresh token logic"
      }
    },
    "id": 2
  }'

# After completing work
curl -X POST http://127.0.0.1:9000/mcp/ \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "release_file_reservations",
      "arguments": {
        "project_key": "'"$PROJECT_KEY"'",
        "agent_name": "'"$AGENT_NAME"'",
        "paths": ["apps/api/src/modules/auth/auth.service.ts"]
      }
    },
    "id": 3
  }'
```

#### 3. Message Bus for Coordination

```bash
# Agent A notifies about API breaking change
curl -X POST http://127.0.0.1:9000/mcp/ \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "send_message",
      "arguments": {
        "project_key": "'"$PROJECT_KEY"'",
        "sender_name": "AgentA",
        "to": ["AgentB", "AgentC"],
        "subject": "⚠️ Breaking Change: Auth API",
        "body_md": "## API Change\n\nMigrated `/auth/login` to use JWT refresh tokens.\n\n**Action Required:**\n- Update frontend to handle `refreshToken` in response\n- See: `apps/api/src/modules/auth/dto/login-response.dto.ts`",
        "importance": "high",
        "ack_required": true,
        "thread_id": "auth-migration-wave2"
      }
    },
    "id": 4
  }'

# Agent B checks inbox
curl -X POST http://127.0.0.1:9000/mcp/ \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "fetch_inbox",
      "arguments": {
        "project_key": "'"$PROJECT_KEY"'",
        "agent_name": "AgentB",
        "urgent_only": true,
        "limit": 10
      }
    },
    "id": 5
  }'

# Agent B acknowledges
curl -X POST http://127.0.0.1:9000/mcp/ \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "acknowledge_message",
      "arguments": {
        "project_key": "'"$PROJECT_KEY"'",
        "agent_name": "AgentB",
        "message_id": 123
      }
    },
    "id": 6
  }'
```

#### 4. Pre-Commit Guard Installation

```bash
# Install guard to prevent conflicts
uv run python -m mcp_agent_mail.cli guard install \
  "c:/Users/luaho/Demo project/v-edfinance" \
  "c:/Users/luaho/Demo project/v-edfinance"

# Verify guard
cat .git/hooks/pre-commit
```

**Guard behavior:**
- Blocks commits if file is exclusively reserved by another agent
- Shows holder name and reservation reason
- Can bypass with `AGENT_MAIL_BYPASS=1` or `git commit --no-verify`

---

## 🔄 Integration Workflow

### Wave Execution Protocol

```bash
#!/bin/bash
# scripts/execute_wave.sh

WAVE_NUM=$1
PROJECT_KEY="c:/Users/luaho/Demo project/v-edfinance"

echo "═══════════════════════════════════════════════════════════"
echo "WAVE ${WAVE_NUM} EXECUTION"
echo "═══════════════════════════════════════════════════════════"

# ─────────────────────────────────────────────────────────────
# STEP 1: Pre-Wave Analysis
# ─────────────────────────────────────────────────────────────

echo "[1/7] Analyzing task dependencies..."
bv --robot-insights > ./monitoring/wave_${WAVE_NUM}_pre_insights.json
bv --robot-plan > ./monitoring/wave_${WAVE_NUM}_plan.json

# Check for blockers
BLOCKERS=$(jq '.plan.summary.total_blockers' ./monitoring/wave_${WAVE_NUM}_plan.json)
if [ "$BLOCKERS" -gt 0 ]; then
  echo "⚠️ Warning: $BLOCKERS blocking tasks detected"
  bv --robot-alerts --severity=critical
fi

# ─────────────────────────────────────────────────────────────
# STEP 2: Agent Registration
# ─────────────────────────────────────────────────────────────

echo "[2/7] Registering agents..."
# Read agent assignments from wave config
while IFS=, read -r agent_id task_id description; do
  ./scripts/register_agent.sh "$agent_id" "$description"
done < ./monitoring/wave_${WAVE_NUM}_agents.csv

# ─────────────────────────────────────────────────────────────
# STEP 3: Task Assignment
# ─────────────────────────────────────────────────────────────

echo "[3/7] Assigning tasks to agents..."
while IFS=, read -r agent_id task_id description; do
  # Claim task in beads
  beads.exe update $task_id --status in_progress
  
  # Reserve files
  FILES=$(beads.exe show $task_id | grep -oP '(?<=File: ).*')
  if [ -n "$FILES" ]; then
    # (Call file_reservation_paths API for each file)
    echo "  → Agent $agent_id reserved: $FILES"
  fi
  
  # Send task context to agent's inbox
  CONTEXT=$(bv --robot-insights | jq ".issues[] | select(.id == \"$task_id\")")
  # (Call send_message API with context)
  
done < ./monitoring/wave_${WAVE_NUM}_agents.csv

# ─────────────────────────────────────────────────────────────
# STEP 4: Parallel Execution (AGENTS DO THEIR WORK HERE)
# ─────────────────────────────────────────────────────────────

echo "[4/7] Agents executing tasks..."
echo "   (Parallel execution in progress...)"
# Agents work independently using:
# - File reservations (prevent conflicts)
# - Message bus (coordinate changes)
# - ACK tracking (confirm completions)

# ─────────────────────────────────────────────────────────────
# STEP 5: Progress Monitoring
# ─────────────────────────────────────────────────────────────

echo "[5/7] Monitoring progress..."
while true; do
  # Check completion status
  COMPLETED=$(beads.exe list --status completed | wc -l)
  IN_PROGRESS=$(beads.exe list --status in_progress | wc -l)
  
  echo "  Progress: $COMPLETED completed, $IN_PROGRESS in progress"
  
  # Check for overdue ACKs (stalled agents)
  OVERDUE=$(curl -s http://127.0.0.1:9000/mcp/ -d '{"method":"resources/read","params":{"uri":"resource://views/acks-stale/all?ttl_seconds=1800"}}' | jq '.result.count')
  if [ "$OVERDUE" -gt 0 ]; then
    echo "⚠️ $OVERDUE overdue ACKs detected (stalled agents?)"
  fi
  
  # Check for file reservation conflicts
  CONFLICTS=$(curl -s http://127.0.0.1:9000/mcp/ -d '{"method":"resources/read","params":{"uri":"resource://file_reservations/'"$PROJECT_KEY"'"}}' | jq '[.result[] | select(.conflicts | length > 0)] | length')
  if [ "$CONFLICTS" -gt 0 ]; then
    echo "⚠️ $CONFLICTS file reservation conflicts"
  fi
  
  # Break when all tasks completed
  if [ "$IN_PROGRESS" -eq 0 ]; then
    break
  fi
  
  sleep 30
done

# ─────────────────────────────────────────────────────────────
# STEP 6: Post-Wave Validation
# ─────────────────────────────────────────────────────────────

echo "[6/7] Validating wave completion..."

# Run tests
pnpm --filter api test --coverage

# Check diff
bv --diff-since HEAD~20 --robot-diff > ./monitoring/wave_${WAVE_NUM}_diff.json

# Export report
bv --export-md ./monitoring/wave_${WAVE_NUM}_report.md

# Generate static dashboard
bv --export-pages ./monitoring/wave_${WAVE_NUM}_dashboard \
  --pages-title "Wave ${WAVE_NUM} Completion Report"

# ─────────────────────────────────────────────────────────────
# STEP 7: Cleanup
# ─────────────────────────────────────────────────────────────

echo "[7/7] Releasing resources..."

# Release all file reservations
curl -s http://127.0.0.1:9000/mcp/ -d '{
  "method": "tools/call",
  "params": {
    "name": "release_file_reservations",
    "arguments": {
      "project_key": "'"$PROJECT_KEY"'",
      "agent_name": "all"
    }
  }
}'

# Sync beads to git
beads.exe sync

# Commit wave results
git add -A
git commit -m "Wave ${WAVE_NUM} complete: $(beads.exe list --status completed | wc -l) tasks"

echo "✅ Wave ${WAVE_NUM} complete!"
echo "═══════════════════════════════════════════════════════════"
```

---

## 📊 Monitoring Dashboard

### Real-Time Metrics

```bash
# scripts/monitor_dashboard.sh
#!/bin/bash

while true; do
  clear
  echo "════════════════════════════════════════════════════════════════"
  echo "         100-AGENT ORCHESTRATION DASHBOARD"
  echo "════════════════════════════════════════════════════════════════"
  echo ""
  
  # Beads Task Status
  echo "📋 TASK STATUS (Beads)"
  echo "────────────────────────────────────────────────────────────────"
  beads.exe doctor | grep -E "open|in_progress|completed"
  echo ""
  
  # Graph Health (bv)
  echo "📊 GRAPH HEALTH (beads_viewer)"
  echo "────────────────────────────────────────────────────────────────"
  bv --robot-insights | jq -r '
    "Health Score: \(.full_stats.health_score)",
    "Total Issues: \(.full_stats.total_issues)",
    "Blocking Cascades: \(.Bottlenecks | length)",
    "Cycles Detected: \(.Cycles | length)"
  '
  echo ""
  
  # Agent Activity (mcp_agent_mail)
  echo "🤖 AGENT ACTIVITY (mcp_agent_mail)"
  echo "────────────────────────────────────────────────────────────────"
  curl -s http://127.0.0.1:9000/mcp/ -d '{
    "method": "resources/read",
    "params": {"uri": "resource://project/'"$PROJECT_SLUG"'"}
  }' | jq -r '.result.agents[] | "\(.name): \(.status)"'
  echo ""
  
  # Active File Reservations
  echo "📁 ACTIVE FILE RESERVATIONS"
  echo "────────────────────────────────────────────────────────────────"
  curl -s http://127.0.0.1:9000/mcp/ -d '{
    "method": "resources/read",
    "params": {"uri": "resource://file_reservations/'"$PROJECT_KEY"'?active_only=true"}
  }' | jq -r '.result[] | "\(.holder): \(.path) (expires: \(.expires_at))"'
  echo ""
  
  # Pending ACKs
  echo "⏳ PENDING ACKNOWLEDGEMENTS"
  echo "────────────────────────────────────────────────────────────────"
  curl -s http://127.0.0.1:9000/mcp/ -d '{
    "method": "resources/read",
    "params": {"uri": "resource://views/ack-required/all"}
  }' | jq -r '.result.count'
  echo ""
  
  # Critical Alerts
  echo "🚨 CRITICAL ALERTS"
  echo "────────────────────────────────────────────────────────────────"
  bv --robot-alerts --severity=critical | jq -r '.alerts[] | "• \(.message)"'
  echo ""
  
  echo "════════════════════════════════════════════════════════════════"
  echo "Press Ctrl+C to exit"
  sleep 10
done
```

---

## 🔧 Configuration Files

### 1. Wave Agent Assignment CSV

```csv
# monitoring/wave_1_agents.csv
agent_id,task_id,description,files
A001,ved-xyz1,Configure Jest coverage,jest.config.js;package.json
A002,ved-xyz2,Create test helpers,tests/helpers/index.ts
A003,ved-xyz3,Setup test database,docker-compose.test.yml
A004,ved-xyz4,Install E2E deps,package.json
A005,ved-xyz5,Create CI/CD pipeline,.github/workflows/test.yml
```

### 2. Agent Environment Template

```bash
# .env.agent (template for each agent)
AGENT_NAME=BlueCastle  # Auto-generated adjective+noun
AGENT_MAIL_PROJECT=c:/Users/luaho/Demo project/v-edfinance
AGENT_MAIL_URL=http://127.0.0.1:9000/mcp/
AGENT_MAIL_TOKEN=<generated-token>
AGENT_MAIL_INTERVAL=120  # Check inbox every 2 min
```

### 3. Integration with Amp Workflow

```powershell
# scripts/amp-agent-workflow.ps1
param(
    [string]$AgentName,
    [string]$TaskId,
    [string]$Message
)

# 1. Register with mcp_agent_mail
./scripts/register_agent.sh $AgentName "Working on $TaskId"

# 2. Reserve files
$Files = beads.exe show $TaskId | Select-String -Pattern "File: (.*)" | ForEach-Object { $_.Matches.Groups[1].Value }
foreach ($File in $Files) {
    # Call file_reservation_paths API
}

# 3. Run Amp workflow (with auto-regenerate)
.\scripts\amp-auto-workflow.ps1 -TaskId $TaskId -Message $Message

# 4. Send completion message to dependent agents
$Dependents = beads.exe show $TaskId | Select-String -Pattern "blocks: (.*)" | ForEach-Object { $_.Matches.Groups[1].Value }
# Call send_message API

# 5. Release file reservations
# Call release_file_reservations API

# 6. Close beads task
beads.exe close $TaskId --reason "$Message"
```

---

## ✅ Testing Integration

### Scenario: Wave 1 Execution with 5 Agents

```bash
# Test with 5 agents (infrastructure wave)
./scripts/execute_wave.sh 1

# Expected flow:
# 1. bv analyzes dependencies → no blockers
# 2. 5 agents registered in mcp_agent_mail
# 3. Files reserved:
#    - A001: jest.config.js, package.json
#    - A002: tests/helpers/*
#    - A003: docker-compose.test.yml
#    - A004: package.json (conflict with A001 → resolved by exclusive flag)
#    - A005: .github/workflows/test.yml
# 4. Agents execute in parallel
# 5. ACKs tracked for cross-agent dependencies
# 6. bv exports report showing completion graph
```

### Validation Checklist

- [ ] beads_viewer shows 0 blocking cascades
- [ ] mcp_agent_mail has 0 active file reservation conflicts
- [ ] All 5 tasks marked "completed" in beads
- [ ] Static dashboard generated in `./monitoring/wave_1_dashboard/`
- [ ] Tests pass: `pnpm --filter api test`

---

## 📚 Documentation Updates

### AGENTS.md Integration

```markdown
## 🤖 Multi-Agent Coordination Tools

**Status:** ✅ DEPLOYED

### beads_viewer (bv)

**Purpose:** Visual task tracking + AI-driven recommendations

**Quick Commands:**
```bash
# Get next task for agent
bv --robot-next

# Check project health
bv --robot-insights | jq '.full_stats.health_score'

# Export dashboard
bv --export-pages ./monitoring/dashboard
```

### mcp_agent_mail

**Purpose:** Agent messaging + file conflict prevention

**Quick Commands:**
```bash
# Register agent
./scripts/register_agent.sh AgentName "Task description"

# Reserve file (before editing)
# Call file_reservation_paths API

# Check inbox
curl http://127.0.0.1:9000/mcp/ -d '{"method":"tools/call","params":{"name":"fetch_inbox","arguments":{"agent_name":"AgentName"}}}'
```

**Mandatory Protocol:**
1. Reserve files BEFORE editing
2. Check inbox every 2 minutes
3. ACK high-importance messages
4. Release reservations after commit
```

---

## 🚀 Next Steps

1. ✅ Install beads_viewer
2. ✅ Install mcp_agent_mail
3. Configure environment variables
4. Test with Wave 1 (5 agents)
5. Roll out to all 100 agents
6. Monitor dashboard during execution
7. Export final report

---

## 📊 Success Metrics

| Metric | Target | Tool |
|--------|--------|------|
| Task completion rate | 95%+ | beads_viewer (--robot-insights) |
| File conflicts | 0 | mcp_agent_mail (file_reservations) |
| Message ACK rate | 98%+ | mcp_agent_mail (views/ack-required) |
| Blocking cascades | ≤2 | beads_viewer (--robot-alerts) |
| Test coverage | 80%+ | Jest coverage report |
| Wave execution time | ≤3 hours | Dashboard monitoring |

---

**Status:** 🟡 Ready for Installation Phase
