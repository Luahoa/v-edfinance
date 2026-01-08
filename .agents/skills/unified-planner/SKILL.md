---
name: unified-planner
description: End-to-end epic planning and execution. Combines discovery, risk analysis, spike validation, bead decomposition, parallel worker orchestration, and quality gates. Use when starting any new feature, debug session, or multi-track work.
---

# Unified Planner Skill

Complete automation pipeline from idea → production. Integrates:
- **Beads** (`bd` v0.32+) - Task management
- **Beads Viewer** (`bv` v0.12+) - Graph analysis & triage
- **Agent Mail** (v0.3+) - Multi-agent coordination
- **Knowledge** - Thread extraction & doc sync

## Pipeline Overview

```
REQUEST → Discovery → Synthesis → Spikes → Decomposition → Orchestration → Quality Gate → Knowledge → DONE
   │          │           │          │           │              │              │              │
   │          │           │          │           │              │              │              └─ Docs updated
   │          │           │          │           │              │              └─ git push
   │          │           │          │           │              └─ Task() workers
   │          │           │          │           └─ bd create beads
   │          │           │          └─ Validate HIGH risk
   │          │           └─ Oracle gap analysis
   │          └─ Parallel sub-agents + Thread context
   └─ User request or epic ID
```

## Pre-Planning: Thread Context (NEW)

Before starting, gather knowledge from previous threads:

```bash
# Find related threads
find_thread "topic keywords" after:7d
find_thread file:apps/api
find_thread task:<related-epic-id>
```

Use `read_thread` with focused goal:

```python
read_thread(
  threadID="T-xxx",
  goal="Extract implementation patterns, decisions, and gotchas"
)
```

This prevents re-discovering known issues and leverages past work.

---

## Phase 1: Discovery (Parallel)

Launch parallel sub-agents to gather intelligence:

```python
# Spawn discovery agents in parallel
Task("Discover architecture", "Use finder + Grep to map relevant modules")
Task("Discover patterns", "Find similar implementations in codebase")  
Task("Discover constraints", "Check package.json, tsconfig, deps")
```

### Discovery Report Template

Save to `history/<epic-id>/discovery.md`:

```markdown
# Discovery Report: <Epic Name>

## Architecture Snapshot
- Relevant packages: ...
- Key modules: ...
- Entry points: ...

## Existing Patterns
- Similar implementation: <file> does X using Y pattern
- Reusable utilities: ...

## Technical Constraints
- Node version: ...
- Key dependencies: ...

## External References (if needed)
- Library docs: ...
```

---

## Phase 2: Synthesis (Oracle)

Feed Discovery Report to Oracle:

```python
oracle(
  task="Analyze gap between current state and requirements",
  context="Discovery report attached. Goal: <epic description>",
  files=["history/<epic-id>/discovery.md"]
)
```

Oracle produces:
1. **Gap Analysis** - What exists vs what's needed
2. **Approach Options** - 1-3 strategies with tradeoffs
3. **Risk Map** - LOW / MEDIUM / HIGH per component

### Risk Classification

| Level  | Criteria                      | Action           |
|--------|-------------------------------|------------------|
| LOW    | Pattern exists in codebase    | Proceed          |
| MEDIUM | Variation of existing pattern | Interface sketch |
| HIGH   | Novel or external integration | Spike required   |

Save to `history/<epic-id>/approach.md`

---

## Phase 3: Verification (Spikes)

For HIGH-risk items, create spike beads:

```bash
bd create "Spike: <question to answer>" -t epic -p 0
bd create "Spike: Test X" -t task --blocks <spike-epic>
```

### Spike Execution

```python
Task(
  description="Spike: <question>",
  prompt="""
Time-box: 30 minutes
Output: .spikes/<epic-id>/<spike-name>/

## Question
Can we <specific technical question>?

## Success Criteria
- Working throwaway code exists
- Answer documented (yes/no + details)
- Learnings captured

## On Completion
bd close <id> --reason "YES: <approach>" or "NO: <blocker>"
"""
)
```

Aggregate results and update `approach.md`.

---

## Phase 4: Decomposition (Beads)

Create beads with embedded learnings:

```bash
# Create epic
bd create "Epic: <name>" -t epic -p 1

# Create tasks with dependencies
bd create "Task: <name>" -t task --blocks <epic-id>
bd dep add <task-a> <task-b>  # a blocks b
```

### Bead Requirements

Each bead MUST include:
- Spike learnings (if applicable)
- File scope for track assignment
- Clear acceptance criteria

---

## Phase 5: Track Planning

### Step 1: Get Parallel Tracks

```bash
bv --robot-plan 2>nul
```

Returns:
```json
{
  "plan": {
    "tracks": [
      {"id": 1, "beads": ["ved-abc", "ved-def"], "parallelizable": true},
      {"id": 2, "beads": ["ved-ghi"], "parallelizable": true}
    ]
  }
}
```

### Step 2: Assign File Scopes

| Rule | Description |
|------|-------------|
| No overlap | File scopes MUST NOT overlap between tracks |
| Glob patterns | Use `packages/sdk/**`, `apps/server/**` |
| Merge if overlap | If unavoidable, merge into single track |

### Step 3: Generate Agent Names

Assign unique adjective+noun names:
- BlueLake, GreenCastle, RedStone, PurpleBear, etc.

### Step 4: Create Execution Plan

Save to `history/<epic-id>/execution-plan.md`:

```markdown
# Execution Plan: <Epic Name>

Epic: <epic-id>
Generated: <date>

## Tracks

| Track | Agent       | Beads (in order)  | File Scope        |
|-------|-------------|-------------------|-------------------|
| 1     | BlueLake    | bd-10 → bd-11     | `apps/api/**`     |
| 2     | GreenCastle | bd-20 → bd-21     | `apps/web/**`     |

## Cross-Track Dependencies

- Track 2 can start after bd-11 (Track 1) completes

## Key Learnings (from Spikes)

- <learning 1>
- <learning 2>
```

---

## Phase 6: Orchestration (Parallel Workers)

### Initialize Agent Mail (if multi-agent)

```bash
# From mcp_agent_mail
ensure_project(human_key="<project-path>")
register_agent(project_key="<path>", name="Orchestrator", ...)
```

### Spawn Workers

```python
# Spawn all tracks in parallel
Task(
  description="Worker BlueLake: Track 1",
  prompt="""
You are agent BlueLake working on Track 1 of epic <epic-id>.

## Setup
1. Read AGENTS.md for tool preferences
2. Follow self-correction protocol

## Your Track
Beads: <bead-a> → <bead-b>
File scope: apps/api/**

## Protocol for EACH bead:

### Start
- bd update <bead-id> --status in_progress
- Reserve files (if using Agent Mail)

### Work
- Implement requirements
- Run verification after EVERY change:
  ```bash
  pnpm --filter api build
  ```
- If fails: fix and retry until success

### Complete
- bd close <bead-id> --reason "Summary"
- Report to orchestrator

### Next
- Continue with next bead in track

## When Track Complete
Return summary of all work completed.
"""
)

# Spawn Track 2 in parallel
Task(description="Worker GreenCastle: Track 2", prompt="...")
```

---

## Phase 7: Quality Gate

### Run Verification

```bash
# Windows
scripts\quality-gate-ultra-fast.bat

# Or manual
pnpm --filter api build
pnpm --filter web build
pnpm --filter web lint
```

### Check Results

```bash
type .quality-gate-result.json
```

If fails:
1. Create fix beads for failures
2. Assign to workers
3. Re-run verification

---

## Phase 8: Landing

### Mandatory Steps

```bash
# 1. Sync beads
beads sync --no-daemon

# 2. Commit
git add -A
git commit -m "feat(<epic-id>): <summary>"

# 3. Push (MANDATORY)
git pull --rebase
git push

# 4. Close epic
bd close <epic-id> --reason "All tracks complete, quality gates passed"
```

### Completion Signal

When ALL conditions are true:
- [ ] All track workers complete
- [ ] `bv --robot-triage` shows 0 open beads for epic
- [ ] Quality gate passes
- [ ] `git push` succeeds

Output: `<promise>EPIC_COMPLETE</promise>`

---

## Phase 9: Knowledge Extraction (Post-Epic)

After epic completion, extract and document learnings:

### Step 1: Find Epic Threads

```bash
find_thread task:<epic-id>
find_thread "epic keywords" after:start-date
```

### Step 2: Extract Topics (Parallel)

Spawn parallel Task agents:

```python
Task(
  description="Extract topics from threads",
  prompt="""
Read threads [T-xxx, T-yyy] using read_thread.
Goal: 'Extract topics, decisions, changes'

Return JSON:
{
  "topics": [{
    "name": "topic name",
    "threads": ["T-xxx"],
    "summary": "1-2 sentences",
    "decisions": ["..."],
    "patterns": ["..."],
    "changes": ["..."]
  }]
}
"""
)
```

### Step 3: Verify Against Code

For each topic, verify claims exist in code:

```bash
# Topic: "Added retry logic to API client"
finder "retry logic API client"
Grep "RetryPolicy" apps/api/
```

| Claim Type | Verification |
|------------|--------------|
| "Added X" | `finder "X"` |
| "Refactored Y" | `Grep "Y"` → check file |
| "Changed pattern" | `finder "pattern implementation"` |

### Step 4: Map to Docs

| Topic Type | Target Files |
|------------|--------------|
| Architecture | `AGENTS.md`, `docs/ARCHITECTURE.md` |
| Patterns | `.agents/skills/*/SKILL.md` |
| Commands | Package-specific AGENTS.md |
| Troubleshooting | `docs/TROUBLESHOOTING.md` |

### Step 5: Oracle Reconciliation

```python
oracle(
  task="Compare extracted topics vs current docs",
  context="""
Compare:
1. TOPICS: [extracted knowledge]
2. CODE: [verified state with file paths]
3. DOCS: [current documentation content]

Output:
- GAPS: Knowledge not in docs
- STALE: Docs that contradict code
- UPDATES: [{file, section, change}]
""",
  files=["AGENTS.md", "docs/"]
)
```

### Step 6: Apply Updates

```python
# Text updates
edit_file("AGENTS.md", old_str="...", new_str="...")

# Architecture diagrams with code citations
mermaid(
  code="flowchart LR\\n  A[Client] --> B[RetryPolicy]",
  citations={
    "Client": "file:///apps/api/client.ts#L10",
    "RetryPolicy": "file:///apps/api/retry.ts#L45"
  }
)
```

### Knowledge Quality Checklist

```
- [ ] Topics verified against code
- [ ] Existing docs read before updating
- [ ] Changes surgical, not wholesale
- [ ] Mermaid diagrams have citations
- [ ] Terminology matches existing docs
```

---

## Quick Reference

### Beads Viewer Commands

| Need | Command |
|------|---------|
| Start here | `bv --robot-triage` |
| Single next pick | `bv --robot-next` |
| Parallel tracks | `bv --robot-plan` |
| Priority check | `bv --robot-priority` |
| Full metrics | `bv --robot-insights` |
| History | `bv --robot-history` |
| Diff since | `bv --robot-diff --diff-since HEAD~5` |

### Beads CLI Commands

| Need | Command |
|------|---------|
| Create task | `bd create "Title" -t task` |
| Create epic | `bd create "Title" -t epic` |
| Add dependency | `bd dep add <from> <to>` |
| Update status | `bd update <id> --status in_progress` |
| Close | `bd close <id> --reason "..."` |
| Sync | `beads sync --no-daemon` |

### Agent Mail Commands (if multi-agent)

| Need | Command |
|------|---------|
| Ensure project | `ensure_project(human_key="<path>")` |
| Register agent | `register_agent(name="BlueLake", ...)` |
| Reserve files | `file_reservation_paths(paths=["src/**"])` |
| Send message | `send_message(to=["Agent"], ...)` |
| Check inbox | `fetch_inbox(agent_name="BlueLake")` |

### Knowledge Commands

| Need | Command |
|------|---------|
| Find threads | `find_thread "query" after:7d file:path` |
| Read thread | `read_thread(threadID, goal)` |
| Semantic search | `finder "concept"` |
| Grep pattern | `Grep "pattern" path/` |
| Oracle synthesis | `oracle(task, context, files)` |
| Create diagram | `mermaid(code, citations)` |

### read_thread Goal Templates

| Context | Goal Template |
|---------|---------------|
| Architecture | "Extract architectural decisions, patterns, design rationale, trade-offs" |
| Feature | "Extract requirements, implementation approach, API surface, usage examples" |
| Refactor | "Extract what was refactored, motivation, approach, migration guidance" |
| Bug Fix | "Extract bug description, root cause, fix approach, prevention patterns" |

---

## Common Mistakes to Avoid

| Mistake | Fix |
|---------|-----|
| Skip discovery | Always gather context first |
| No risk assessment | Surprises during execution |
| No spikes for HIGH risk | Blocked workers |
| Missing learnings in beads | Workers re-discover issues |
| No bv validation | Broken dependency graph |
| Stop before git push | Work stranded locally |
| Use bare `bv` | BLOCKS session! Use `--robot-*` |
| Skip thread context | Re-discover known issues |
| No knowledge extraction | Learnings lost after epic |
| Doc updates without code verify | Stale/incorrect docs |

---

## Example: Debug Dokploy Epic

```bash
# Phase 1: Discovery
Task("Check API logs", "SSH to VPS, get docker logs api")
Task("Check Web logs", "SSH to VPS, get docker logs web")
Task("Check Network", "docker network inspect")

# Phase 2: Synthesis
oracle(task="Analyze Dokploy failures", files=["discovery.md"])

# Phase 4: Decomposition
bd create "Epic: Fix Dokploy" -t epic -p 0
bd create "Fix API: database connection" -t task --blocks ved-xxxx
bd create "Fix Web: env vars" -t task --blocks ved-xxxx
bd create "Fix Nginx: upstream" -t task --blocks ved-xxxx

# Phase 5: Track Planning
bv --robot-plan

# Phase 6: Orchestration
Task("Worker BlueLake: Fix API", "...")
Task("Worker GreenCastle: Fix Web", "...")
Task("Worker RedStone: Fix Nginx", "...")

# Phase 7: Quality Gate
curl https://api.staging.v-edfinance.com/health
curl https://staging.v-edfinance.com

# Phase 8: Landing
git push
bd close ved-xxxx --reason "All services healthy"
```
