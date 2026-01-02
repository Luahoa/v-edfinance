# Multi-Agent Orchestration Skill

**Version:** 1.0.0  
**Author:** V-EdFinance Team  
**Last Updated:** 2026-01-03

## Description

Complete toolkit for orchestrating 100+ AI coding agents in parallel using the Beads Trinity (beads + beads_viewer + mcp_agent_mail). This skill provides automated task selection, file conflict prevention, agent-to-agent messaging, and real-time monitoring for large-scale multi-agent projects.

## When to Use

Use this skill when:
- Managing 10+ AI agents working on the same codebase
- Coordinating parallel development across multiple features
- Preventing file edit conflicts between agents
- Tracking task dependencies and blocking relationships
- Needing visual analytics of project health (graph metrics)
- Orchestrating wave-based execution (5 agents → 20 agents → 100 agents)
- Running automated testing campaigns with agent swarms
- Implementing zero-debt engineering protocols

## Prerequisites

### Required Tools
- **beads (bd)** - Git-native issue tracker
- **beads_viewer (bv)** - Graph analytics and AI recommendations
- **mcp_agent_mail** - Agent messaging and file locks

### Installation
```bash
# Install all 3 tools in one command
./scripts/install-beads-trinity.sh

# Or install individually:
# 1. beads: already included in project
# 2. beads_viewer
curl -fsSL "https://raw.githubusercontent.com/Dicklesworthstone/beads_viewer/main/install.sh?$(date +%s)" | bash

# 3. mcp_agent_mail
curl -fsSL "https://raw.githubusercontent.com/Dicklesworthstone/mcp_agent_mail/main/scripts/install.sh?$(date +%s)" | bash -s -- --port 9000 --yes
```

### Environment Setup
```bash
# Required environment variables
export AGENT_NAME="YourAgentName"  # Auto-generated if not set
export BEADS_SYNC_BRANCH="beads-sync"
export AGENT_MAIL_URL="http://127.0.0.1:9000/mcp/"
```

## Core Concepts

### The Beads Trinity Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   BEADS TRINITY                             │
├─────────────────────────────────────────────────────────────┤
│  beads (bd)        beads_viewer (bv)    mcp_agent_mail     │
│  Task Mgmt         Analytics            Coordination        │
│  (Write)           (Read + AI)          (Messaging)         │
│       │                   │                    │            │
│       └───────────────────┼────────────────────┘            │
│                           ▼                                 │
│              .beads/issues.jsonl                            │
│              Single Source of Truth                         │
└─────────────────────────────────────────────────────────────┘
```

**Division of Labor:**
1. **beads (bd)** - CRUD operations (create, update, close tasks)
2. **beads_viewer (bv)** - Read-only analytics (PageRank, Betweenness, cycles)
3. **mcp_agent_mail** - Agent coordination (messages, file locks, ACKs)

### Key Principles

1. **Single Source of Truth**: `.beads/issues.jsonl` is the canonical data store
2. **Advisory Locks**: File reservations prevent conflicts but don't block reads
3. **Explicit Dependencies**: Tasks have hard `blocks` relationships (A → B → C)
4. **AI-Driven Selection**: beads_viewer recommends high-impact tasks via PageRank
5. **Atomic Operations**: Claim, work, release as one transaction
6. **Zero-Debt Protocol**: Fix blockers before starting new features

## Workflow Phases

The skill follows a **3-Phase Workflow** inspired by beads_viewer best practices:

```
PHASE 1: CREATE        PHASE 2: REVIEW & REFINE        PHASE 3: EXECUTE
Plan sprint         →  Validate graph             →    Deploy agents
Create tasks           Apply automated fixes           Monitor progress
```

**Phase 1** uses `file-beads` skill + `bd` to create structured task graphs.  
**Phase 2** uses `bv --robot-suggest` and `--robot-priority` for automated analysis.  
**Phase 3** deploys agents with smart selection and conflict prevention.

---

## Commands

### Phase 1: Planning Commands

#### 0. Sprint Planning (NEW)

**Command:** `beads-plan-sprint`

Interactive sprint planner that creates Epic + Tasks with dependencies, then validates graph health.

**Usage:**
```bash
# Create sprint plan
./scripts/beads-plan-sprint.sh "Implement JWT Authentication" "Add refresh token support"

# Interactive task entry:
# Enter tasks (one per line, empty line to finish):
# Format: <title> [--blocks <task_id>] [--priority <0-3>]
# 
# Create auth service --priority 1
# Add refresh token logic --blocks ved-123 --priority 2
# Update frontend login --blocks ved-124 --priority 2
# <empty line>

# Output:
# ✅ Created epic: ved-epic-1
# ✅ Created: ved-123 - Create auth service
# ✅ Created: ved-124 - Add refresh token logic
# ✅ Created: ved-125 - Update frontend login
# Health Score: 0.82
# Cycles:       0
# ✅ Plan exported to: sprints/ved-epic-1-plan.md
```

**What it does:**
1. Creates Epic with `bd create --type epic`
2. Prompts for tasks with dependency mapping
3. Validates graph with `bv --robot-insights`
4. Exports Markdown plan to `sprints/<epic-id>-plan.md`
5. Provides next-action recommendations

**When to use:**
- Starting new feature development
- Planning sprint work
- Creating structured task hierarchies

---

### Phase 2: Review & Refinement Commands

#### 0A. Graph Audit (NEW)

**Command:** `beads-graph-audit`

Pre-flight check that runs comprehensive `bv` analysis before execution.

**Usage:**
```bash
# Run audit (default: warning-level alerts)
./scripts/beads-graph-audit.sh

# Check critical issues only
./scripts/beads-graph-audit.sh critical

# Example output:
# 📊 GRAPH INSIGHTS
# ────────────────────────────────────────────────────────────────
# Health Score:       0.78
# Cycles Detected:    0
# Bottleneck Tasks:   3
# Critical Path:      7 tasks
# 
# 🚨 ALERTS (severity: warning)
# ────────────────────────────────────────────────────────────────
# Found 2 alerts:
#   • [WARNING] ved-123 stale for 45 days
#   • [WARNING] ved-456 blocks 8 tasks (cascade risk)
# 
# 💡 AUTOMATED SUGGESTIONS
# ────────────────────────────────────────────────────────────────
# 🔗 Missing Dependencies: 1
#   • ved-789 → ved-101: Frontend requires API completion
# ⚖️ Priority Mismatches: 2
#   • ved-123: current=3, suggested=1 (high PageRank)
```

**What it does:**
1. Runs `bv --robot-insights` for health metrics
2. Runs `bv --robot-alerts --severity=<level>` for issues
3. Runs `bv --robot-suggest` for missing deps, cycles, priorities
4. Exits with error if critical alerts found (blocks execution)

**When to use:**
- Before starting wave execution
- After creating new tasks
- Daily health check in CI/CD

---

#### 0B. Apply Recommendations (NEW)

**Command:** `beads-apply-recommendations`

Automated fixes based on `bv` analysis (dependency adjustments, priority updates).

**Usage:**
```bash
# Dry run (preview changes)
DRY_RUN=true ./scripts/beads-apply-recommendations.sh

# Apply changes
./scripts/beads-apply-recommendations.sh

# Example output:
# [1/3] Fetching suggestions...
# [2/3] Applying dependency fixes...
# 
# 🔗 Adding missing dependencies:
#   → ved-789 blocks ved-101
# 
# 🔄 Breaking cycles:
#   → Remove: ved-456 blocks ved-123
# 
# [3/3] Applying priority adjustments...
# 
# ⚖️ Updating priorities (high-confidence only):
#   → ved-123: priority=1
#   → ved-789: priority=2
# 
# Updated 2 task priorities
# 
# ✅ Changes applied successfully
# Run 'bd sync' to commit changes to git
```

**What it does:**
1. Gets `bv --robot-suggest` and `--robot-priority` output
2. Adds missing dependencies with `bd dep add`
3. Breaks cycles with `bd dep remove`
4. Updates priorities with `bd update --priority` (confidence >0.7 only)
5. Supports DRY_RUN mode for previewing changes

**When to use:**
- After graph audit detects issues
- Before wave execution to optimize task order
- Periodic maintenance (weekly) to prevent drift

---

### Phase 3: Execution Commands

### 1. Smart Task Selection

**Command:** `beads-smart-select`

Combines `bd ready` with `bv --robot-triage` for AI-driven task selection.

**Usage:**
```bash
# Get best task for current agent
./scripts/beads-smart-select.sh $AGENT_NAME

# Example output:
# 🎯 Selected: ved-abc-123 (high-impact + ready)
# {
#   "id": "ved-abc-123",
#   "title": "Implement JWT refresh tokens",
#   "pagerank": 0.42,
#   "betweenness": 0.67,
#   "unblocks": 5,
#   "blockers": 0
# }
```

**How it works:**
1. Get all ready tasks (no blockers) from `bd ready`
2. Get AI recommendations from `bv --robot-triage` (PageRank + Betweenness)
3. Find intersection (ready + high-impact)
4. Export task ID to `.agent-task-selection`

**When to use:**
- At start of agent session
- After completing previous task
- When manually selecting next work item

---

### 2. Atomic Task Claim

**Command:** `beads-claim-task`

Claims task in beads + reserves files in mcp + notifies dependents.

**Usage:**
```bash
# Claim task for current agent
./scripts/beads-claim-task.sh ved-abc-123 $AGENT_NAME

# Example flow:
# 🔒 Claiming task ved-abc-123 for BlueCastle...
# ✅ Task claimed in beads
# 📁 Reserving files: auth.service.ts, auth.controller.ts
# ✅ Reserved: apps/api/src/modules/auth/auth.service.ts
# ✅ Reserved: apps/api/src/modules/auth/auth.controller.ts
# 📨 Notifying dependent tasks: ved-def-456
# ✅ Task ved-abc-123 claimed successfully
```

**What it does:**
1. `bd update <task> --status in_progress --actor <agent>`
2. Extract files from task body (e.g., `File: \`path/to/file.ts\``)
3. Call `mcp file_reservation_paths` for each file (exclusive, 1h TTL)
4. Send notification to agents working on dependent tasks
5. Update beads with mcp metadata (`mcp_agent`, `mcp_reserved_at`)

**When to use:**
- After selecting task with `beads-smart-select`
- Before making any code changes
- MANDATORY in multi-agent environments

---

### 3. Smart Task Release

**Command:** `beads-release-task`

Closes task + releases file locks + notifies unblocked agents + analyzes impact.

**Usage:**
```bash
# Release task after work complete
./scripts/beads-release-task.sh ved-abc-123 $AGENT_NAME "JWT refresh tokens implemented"

# Example flow:
# 🏁 Releasing task ved-abc-123...
# ✅ Task closed in beads
# 🔓 Releasing file reservations...
# ✅ Released: apps/api/src/modules/auth/auth.service.ts
# 📢 Notifying unblocked tasks: ved-def-456, ved-ghi-789
# 📊 Analyzing graph impact...
# {
#   "tasks_unblocked": 2,
#   "health_change": +0.05,
#   "new_cycles": 0
# }
# ✅ Syncing to git...
```

**What it does:**
1. `bd close <task> --reason "<reason>"`
2. Call `mcp release_file_reservations` for agent
3. Get list of dependent tasks (`bd show <task> --json | jq '.blocks[]'`)
4. Send "Blocker Resolved" message to each dependent agent
5. Analyze graph impact with `bv --robot-diff --diff-since HEAD~1`
6. Run `bd sync` to commit to beads-sync branch

**When to use:**
- After completing work (code + tests pass)
- BEFORE moving to next task
- At end of agent session (release all locks)

---

### 4. Full Agent Lifecycle

**Command:** `beads-agent-lifecycle`

Complete workflow: initialize → select → claim → work → release.

**Usage:**
```bash
# Run full agent lifecycle
./scripts/beads-agent-lifecycle.sh $AGENT_NAME

# Phases:
# [PHASE 1] Initializing agent...
# [PHASE 2] Selecting optimal task...
# [PHASE 3] Claiming task...
# [PHASE 4] Executing work...
# [PHASE 5] Releasing task...
# [PHASE 6] Checking for more work...
```

**What it does:**
1. Register agent in mcp_agent_mail
2. Check inbox for urgent messages
3. Select optimal task with `beads-smart-select`
4. Claim task with `beads-claim-task`
5. Execute work (delegate to Amp or other agent)
6. Release task with `beads-release-task`
7. Check for more ready tasks, loop if available

**When to use:**
- Fully automated agent execution
- Wave-based deployments (spawn 20 agents at once)
- Continuous integration pipelines

---

### 5. Unified Dashboard

**Command:** `beads-unified-dashboard`

Real-time monitoring of beads + bv + mcp status.

**Usage:**
```bash
# Start dashboard (auto-refresh every 10s)
./scripts/beads-unified-dashboard.sh

# Output:
# ════════════════════════════════════════════════════════════════
#          BEADS UNIFIED DASHBOARD
# ════════════════════════════════════════════════════════════════
# 
# 📋 TASK STATUS (beads)
# ────────────────────────────────────────────────────────────────
# Total:        58 tasks
# Open:         32 tasks
# In Progress:  12 tasks
# Completed:    14 tasks
# Ready:        8 tasks (no blockers)
# 
# 📊 GRAPH ANALYTICS (beads_viewer)
# ────────────────────────────────────────────────────────────────
# Health Score:     0.78
# Avg Degree:       2.4
# Blocking Tasks:   3
# Critical Path:    7 tasks
# Cycles Detected:  0
# 
# 🤖 AGENT ACTIVITY (mcp_agent_mail)
# ────────────────────────────────────────────────────────────────
# Registered Agents: 15
# Active Locks:      8 files
# Pending ACKs:      2 messages
# 
# 📝 RECENT ACTIVITY (last 5 updates)
# ────────────────────────────────────────────────────────────────
# ved-123: Implement JWT refresh (completed) - 2026-01-03T10:30:00Z
# ved-456: Add user dashboard (in_progress) - 2026-01-03T10:25:00Z
# ...
```

**When to use:**
- Monitoring multi-agent execution in real-time
- Debugging agent coordination issues
- Presenting progress to stakeholders
- Detecting bottlenecks and blocking cascades

---

### 6. Sync Daemon

**Command:** `beads-mcp-sync-daemon`

Continuous bidirectional sync between beads and mcp_agent_mail.

**Usage:**
```bash
# Start sync daemon (background)
./scripts/beads-mcp-sync-daemon.sh &

# Stop daemon
pkill -f beads-mcp-sync-daemon
```

**What it does:**
Every 30 seconds:
1. **beads → mcp**: Broadcast task status changes to all agents
2. **mcp → beads**: Check for expired file reservations, send reminders

**When to use:**
- Running 24/7 in production environments
- Ensuring agents stay synchronized
- Auto-releasing stale locks

---

## Workflow Examples

### Example 1: Single Agent Session

```bash
# Start session
export AGENT_NAME="BlueCastle"

# 1. Select task
TASK=$(./scripts/beads-smart-select.sh $AGENT_NAME | tail -1)

# 2. Claim task
./scripts/beads-claim-task.sh $TASK $AGENT_NAME

# 3. Do work
# ... (Amp agent makes code changes)

# 4. Release task
./scripts/beads-release-task.sh $TASK $AGENT_NAME "Feature complete"

# 5. Sync
bd sync
```

---

### Example 2: Complete 3-Phase Workflow

```bash
# ═══════════════════════════════════════════════════════════════════
# PHASE 1: CREATE - Sprint Planning
# ═══════════════════════════════════════════════════════════════════

# Create sprint plan
./scripts/beads-plan-sprint.sh "User Dashboard Feature" "Analytics + Gamification"

# Interactive task entry:
# Implement analytics service --priority 1
# Add gamification badges --blocks ved-201 --priority 2
# Create dashboard UI --blocks ved-202 --priority 2
# <empty line>

# Output:
# ✅ Created epic: ved-epic-5
# ✅ Created 3 tasks
# Health Score: 0.85
# ✅ Plan exported to: sprints/ved-epic-5-plan.md

# ═══════════════════════════════════════════════════════════════════
# PHASE 2: REVIEW & REFINE - Automated Analysis
# ═══════════════════════════════════════════════════════════════════

# Run pre-flight audit
./scripts/beads-graph-audit.sh

# Output shows:
# ⚠️ Priority Mismatches: 1
#   • ved-201: current=1, suggested=0 (critical path)

# Preview recommendations
DRY_RUN=true ./scripts/beads-apply-recommendations.sh

# Apply fixes
./scripts/beads-apply-recommendations.sh

# ⚖️ Updating priorities:
#   → ved-201: priority=0 (confidence: 0.89)
# ✅ Changes applied

# Sync to git
bd sync

# ═══════════════════════════════════════════════════════════════════
# PHASE 3: EXECUTE - Deploy Agents
# ═══════════════════════════════════════════════════════════════════

# Start dashboard
./scripts/beads-unified-dashboard.sh &

# Deploy 3 agents in parallel
for AGENT in Agent1 Agent2 Agent3; do
  (
    TASK=$(./scripts/beads-smart-select.sh $AGENT)
    ./scripts/beads-claim-task.sh $TASK $AGENT
    # ... agent work ...
    ./scripts/beads-release-task.sh $TASK $AGENT "Complete"
  ) &
done
wait

# Final validation
./scripts/beads-graph-audit.sh
# ✅ Health Score: 0.92 (improved from 0.85)
# ✅ All tasks complete
```

---

### Example 2: Wave Execution (20 Agents in Parallel)

```bash
# Create wave agent list
cat > wave_1_agents.csv <<EOF
agent_id,task_id,description
BlueCastle,ved-123,Implement JWT refresh
GreenLake,ved-456,Add user dashboard
RedForest,ved-789,Create API tests
...
EOF

# Execute wave
./scripts/execute-wave.sh 1

# Monitor progress
./scripts/beads-unified-dashboard.sh
```

---

### Example 3: Debugging File Conflicts

```bash
# Check active reservations
curl -s http://127.0.0.1:9000/mcp/ -d '{
  "method": "resources/read",
  "params": {"uri": "resource://file_reservations/<project>?active_only=true"}
}' | jq '.result[] | {holder, path, expires_at}'

# Force release stale lock
curl -s http://127.0.0.1:9000/mcp/ -d '{
  "method": "tools/call",
  "params": {
    "name": "force_release_file_reservation",
    "arguments": {
      "project_key": "<project>",
      "agent_name": "<your_agent>",
      "file_reservation_id": 123,
      "notify_previous": true
    }
  }
}'
```

---

## Integration Points

### With Amp Workflow

```bash
# Integrate with amp-auto-workflow.ps1
.\scripts\amp-beads-agent-workflow.ps1 `
  -AgentName "BlueCastle" `
  -TaskId "ved-123" `
  -Message "Feature complete"

# This script:
# 1. Calls beads-claim-task
# 2. Runs amp-auto-workflow (with Amp code review)
# 3. Calls beads-release-task
# 4. Syncs to git
```

### With CI/CD

```yaml
# .github/workflows/multi-agent-test.yml
name: Multi-Agent Test Wave
on: [push]
jobs:
  wave-1:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        agent: [agent-1, agent-2, agent-3, agent-4, agent-5]
    steps:
      - uses: actions/checkout@v3
      - name: Install Beads Trinity
        run: ./scripts/install-beads-trinity.sh
      - name: Run Agent Lifecycle
        run: ./scripts/beads-agent-lifecycle.sh ${{ matrix.agent }}
```

---

## Configuration

### Beads Config (.beads/config.yaml)

```yaml
sync-branch: "beads-sync"  # Required for multi-agent
auto-start-daemon: true
flush-debounce: "5s"
```

### MCP Agent Mail Config (.env)

```bash
STORAGE_ROOT=./.agent-mail
HTTP_HOST=127.0.0.1
HTTP_PORT=9000

# File reservation settings
FILE_RESERVATIONS_ENFORCEMENT_ENABLED=true
FILE_RESERVATION_INACTIVITY_SECONDS=1800  # 30 min
FILE_RESERVATION_ACTIVITY_GRACE_SECONDS=900  # 15 min

# Contact policy (auto for same project)
CONTACT_ENFORCEMENT_ENABLED=true
CONTACT_AUTO_TTL_SECONDS=86400  # 1 day
MESSAGING_AUTO_HANDSHAKE_ON_BLOCK=true
```

---

## Troubleshooting

### Issue: "No tasks available"

```bash
# Check for blockers
bd doctor

# View dependency graph
bv --robot-insights | jq '.Bottlenecks'

# Check alerts
bv --robot-alerts --severity=critical
```

### Issue: "File reservation conflict"

```bash
# View active locks
curl http://127.0.0.1:9000/mcp/ -d '{
  "method": "resources/read",
  "params": {"uri": "resource://file_reservations/<project>?active_only=true"}
}'

# Wait for expiration or force release (see Example 3)
```

### Issue: "Sync conflicts in beads-sync branch"

```bash
# Rebase strategy
git checkout beads-sync
git pull --rebase origin beads-sync

# If conflicts in issues.jsonl:
# Accept incoming changes (other agents' work)
git checkout --theirs .beads/issues.jsonl
git add .beads/issues.jsonl
git rebase --continue

# Re-import to beads.db
bd doctor
```

---

## Best Practices

### 1. Always Use Smart Selection

❌ **Don't:**
```bash
# Picking first task without analysis
TASK=$(bd ready | head -1)
```

✅ **Do:**
```bash
# Use AI-driven selection
TASK=$(./scripts/beads-smart-select.sh $AGENT_NAME)
```

### 2. Never Edit Files Without Locks

❌ **Don't:**
```bash
# Editing without reservation
vim apps/api/src/auth/auth.service.ts
```

✅ **Do:**
```bash
# Claim task first (includes file reservation)
./scripts/beads-claim-task.sh ved-123 $AGENT_NAME
# Now safe to edit
```

### 3. Always Release Before Moving On

❌ **Don't:**
```bash
# Closing task but forgetting to release locks
bd close ved-123
# Move to next task (locks still held!)
```

✅ **Do:**
```bash
# Use atomic release (closes + unlocks + notifies)
./scripts/beads-release-task.sh ved-123 $AGENT_NAME "Done"
```

### 4. Monitor Health Regularly

```bash
# Run dashboard in separate terminal
./scripts/beads-unified-dashboard.sh

# Check for issues
bv --robot-alerts --severity=warning
```

---

## Advanced Usage

### Custom Agent Selection Logic

```bash
# Select by label
TASK=$(bd ready --json | jq -r '.[] | select(.labels[] == "frontend") | .id' | head -1)

# Select by priority
TASK=$(bd ready --json | jq -r 'sort_by(.priority) | .[0].id')

# Combine with bv insights
TASK=$(bv --robot-triage --json | jq -r '
  .recommendations[] 
  | select(.issue_id | test("^frontend-"))
  | select(.confidence > 0.8)
  | .issue_id
' | head -1)
```

### Multi-Project Coordination

```bash
# Use same project_key across repos
export PROJECT_KEY="/abs/path/to/monorepo"

# Frontend agents
cd frontend && ./scripts/beads-agent-lifecycle.sh FrontendAgent

# Backend agents
cd backend && ./scripts/beads-agent-lifecycle.sh BackendAgent

# Agents can message across repos (same project_key)
```

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|---------------|
| File conflict rate | 0% | `resource://file_reservations` conflicts |
| Task sync latency | <1s | `bd sync` execution time |
| Graph health score | >0.7 | `bv --robot-insights` health_score |
| Agent coordination | 95%+ ACK rate | `views/ack-required` count |
| Blocking cascades | ≤2 per wave | `bv --robot-alerts` critical count |

---

## Resources

- **Full Documentation**: [BEADS_INTEGRATION_DEEP_DIVE.md](../../../BEADS_INTEGRATION_DEEP_DIVE.md)
- **Installation Guide**: [MULTI_AGENT_INTEGRATION_PLAN.md](../../../MULTI_AGENT_INTEGRATION_PLAN.md)
- **beads_viewer Docs**: https://github.com/Dicklesworthstone/beads_viewer
- **mcp_agent_mail Docs**: https://github.com/Dicklesworthstone/mcp_agent_mail

---

## Version History

- **1.0.0** (2026-01-03) - Initial release with Beads Trinity integration
