---
name: ralph
description: Complete end-to-end project deployment automation combining Planning → Execution → Verification → Documentation. Use when starting any new epic or feature work. This is THE primary workflow for V-EdFinance development.
---

# Ralph: Complete Project Deployment Pipeline

**The unified skill for autonomous epic execution from idea to production.**

## Philosophy

Ralph = **Planning + Orchestration + Quality + Knowledge**

One command → Complete epic → Production-ready code → Updated docs

---

## Quick Start

```bash
# User says: "Implement user authentication epic"

/skill ralph

# Ralph executes:
# 1. PLAN    → Creates execution plan with tracks
# 2. EXECUTE → Spawns parallel workers
# 3. VERIFY  → Runs quality gates
# 4. DOCUMENT → Extracts knowledge
# 5. DEPLOY  → Ready for git push
```

---

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        RALPH PIPELINE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  USER REQUEST                                                   │
│       ↓                                                         │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ PHASE 1: PLANNING (planning.md skill)                    │  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │ • Discovery → Approach → Spikes → Decomposition         │  │
│  │ • Output: history/<epic-id>/execution-plan.md           │  │
│  │ • Tracks with file scope isolation                      │  │
│  └─────────────────────────────────────────────────────────┘  │
│       ↓                                                         │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ PHASE 2: EXECUTION (orchestrator.md skill)              │  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │ • Spawn parallel workers via Task()                     │  │
│  │ • Each track = isolated file scope                      │  │
│  │ • Agent Mail for coordination                           │  │
│  │ • Self-correction loops (build verification)            │  │
│  └─────────────────────────────────────────────────────────┘  │
│       ↓                                                         │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ PHASE 3: VERIFICATION (Ralph CLI)                       │  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │ • Quality gates (build, lint, test)                     │  │
│  │ • Beads sync (all workers complete)                     │  │
│  │ • Git status check                                      │  │
│  └─────────────────────────────────────────────────────────┘  │
│       ↓                                                         │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ PHASE 4: DOCUMENTATION (knowledge skill)                │  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │ • Extract learnings from threads                        │  │
│  │ • Update AGENTS.md with patterns                        │  │
│  │ • Create diagrams with code citations                   │  │
│  └─────────────────────────────────────────────────────────┘  │
│       ↓                                                         │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ PHASE 5: LANDING (mandatory)                            │  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │ • Git push to remote                                    │  │
│  │ • Beads close epic                                      │  │
│  │ • Create session handoff                                │  │
│  └─────────────────────────────────────────────────────────┘  │
│       ↓                                                         │
│  ✅ EPIC COMPLETE → Production Ready                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Planning

**Goal**: Create comprehensive execution plan with risk assessment

### 1.1 Discovery

**Parallel exploration** of codebase:

```bash
# Spawn 3 discovery agents
Task() → Agent A: Architecture (Read directory structure)
Task() → Agent B: Patterns (finder for similar code)
Task() → Agent C: Constraints (Read package.json, tsconfig)
```

**Output**: `history/<epic-id>/discovery.md`

### 1.2 Synthesis

**Oracle analyzes** discoveries:

```bash
oracle(
  task: "Analyze gap between current codebase and requirements",
  files: ["history/<epic-id>/discovery.md"]
)
```

**Output**: `history/<epic-id>/approach.md` with:
- Gap analysis
- 3 approach options
- **Risk map** (HIGH/MEDIUM/LOW)

### 1.3 Verification (Spikes)

**For each HIGH-risk item**, spawn spike:

```bash
# Example: Prisma schema validation
Task(
  description: "Spike: Validate Prisma regeneration",
  prompt: "Time-box 30min. Answer YES/NO: Can we regenerate Prisma Client safely?"
)
```

**Output**: `.spikes/<epic-id>-<spike-name>/FINDINGS.md`

### 1.4 Decomposition

**Create beads** with embedded spike learnings:

```bash
# Use Beads CLI
beads create "Implement X" --epic <epic-id>
beads dep add <bead-a> <bead-b>
```

### 1.5 Validation

**Oracle + bv verify** dependency graph:

```bash
bv --robot-insights  # Check for cycles
bv --robot-suggest   # Find missing deps
```

### 1.6 Track Planning

**Generate parallel tracks**:

```bash
bv --robot-plan | jq '.plan.tracks'
# → Track 1: Beads [a,b,c] → File scope: docs/**
# → Track 2: Beads [x,y]   → File scope: apps/api/**
```

**Assign file scopes** (NO OVERLAP):
- Track 1: `docs/**`
- Track 2: `apps/api/prisma/**`
- Track 3: `apps/web/src/**`

**Output**: `history/<epic-id>/execution-plan.md`

**Promise**: `<promise>PLAN_READY</promise>`

---

## Phase 2: Execution (Orchestrator)

**Goal**: Autonomous parallel worker execution

### 2.1 Read Execution Plan

```bash
Read("history/<epic-id>/execution-plan.md")

# Extract:
# - EPIC_ID
# - TRACKS with agent names, beads, file scopes
# - CROSS_DEPS
```

### 2.2 Spawn Workers

**For each track**, spawn Task agent:

```javascript
Task({
  description: "Track 1 (BlueLake): <description>",
  prompt: `
You are BlueLake working on Track 1 of epic ${epicId}.

## Setup
Read AGENTS.md for tool preferences.

## Your Assignment
- Beads (in order): ${beadList}
- File scope: ${fileScope}
- Epic thread: ${epicId}

## Protocol for EACH bead:

### 1. START
beads update <bead-id> --status in_progress

### 2. WORK
Implement requirements using AGENTS.md tools.

### 3. VERIFY (Self-Correction Loop)
Run: pnpm --filter <scope> build

IF FAILS:
  - Read error output
  - Fix issues
  - Re-run build
  - Repeat until PASS

### 4. COMPLETE
beads close <bead-id> --reason "Summary"
beads sync --no-daemon

### 5. NEXT
Continue to next bead in track.

## Track Complete
When all beads done, return summary.
`
})
```

**Agent names**: BlueLake, GreenCastle, RedStone, PurpleWave, OrangeWave

**File scope isolation** prevents conflicts:
```
Track 1: docs/**         ✓ No overlap
Track 2: apps/api/**     ✓ No overlap
Track 3: apps/web/**     ✓ No overlap
```

### 2.3 Monitor Progress

**Check bead status**:
```bash
beads list --status open --epic <epic-id>
```

**Check worker reports**:
```bash
# Workers report via Agent Mail (if available)
# OR via beads comments
beads show <bead-id>
```

### 2.4 Handle Blockers

**Cross-track dependency**:
```
Track 2 blocked waiting for Track 1?
→ Check Track 1 status
→ Message worker if needed
```

**File conflict**:
```
Both tracks need same file?
→ ERROR: File scopes should NOT overlap
→ Fix planning phase
```

---

## Phase 3: Verification (Quality Gates)

**Goal**: Ensure production readiness

### 3.1 Quality Gates

```bash
# Ralph CLI runs automatically
scripts/quality-gate-ultra-fast.bat

# Checks:
# 1. Ralph CLI exists
# 2. Git repository healthy
# 3. Package configuration valid
```

**Full gates** (if configured):
```bash
scripts/quality-gate.bat

# Checks:
# 1. pnpm --filter api build (0 errors)
# 2. pnpm --filter web build (0 errors)
# 3. pnpm test (>70% pass rate)
# 4. No broken links in docs
```

### 3.2 Beads Sync

```bash
beads sync --no-daemon
# Ensures all workers' changes persisted
```

### 3.3 Completion Check

**All must be true**:
- [ ] All track workers completed
- [ ] Quality gates PASS
- [ ] `beads list --status open --epic <epic-id>` = 0
- [ ] Builds pass with 0 errors

---

## Phase 4: Documentation (Knowledge Extraction)

**Goal**: Preserve learnings for future agents

### 4.1 Find Threads

```bash
find_thread "<epic-id>" after:7d
# → Returns all threads for this epic
```

### 4.2 Extract Topics

**Parallel extraction**:
```bash
Task() → Agent A: Reads threads 1-3 → Extract patterns
Task() → Agent B: Reads threads 4-6 → Extract decisions
Task() → Agent C: Reads threads 7-9 → Extract learnings
```

**Oracle synthesizes**:
```bash
oracle(
  task: "Cluster extractions into unified topics",
  context: "Deduplicate, latest thread wins conflicts"
)
```

### 4.3 Verify Against Code

**For each topic**:
```bash
finder "<topic keyword>"
# → Find actual code implementing this topic

Grep "<topic>" AGENTS.md
# → Check if already documented
```

### 4.4 Update Documentation

**Surgical edits**:
```bash
edit_file("AGENTS.md", 
  old_str: "<existing-section>",
  new_str: "<updated-with-new-pattern>"
)
```

**Create diagrams**:
```bash
mermaid({
  code: "flowchart LR\n  A[Client] --> B[Service]",
  citations: {
    "Client": "file:///apps/web/src/client.ts#L10",
    "Service": "file:///apps/api/src/service.ts#L45"
  }
})
```

**Output**: 
- Updated AGENTS.md
- `docs/<epic-id>-knowledge-extraction.md`
- Mermaid diagrams with citations

---

## Phase 5: Landing (Mandatory)

**Goal**: Work NOT complete until git push succeeds

### 5.1 Pre-Push Checks

```bash
# 1. Verify all changes committed
git status
# → Should show "working tree clean"

# 2. Verify builds pass
pnpm --filter api build
pnpm --filter web build
```

### 5.2 Git Push

```bash
git pull --rebase
beads sync --no-daemon
git push

# Verify
git status
# → MUST show "up to date with origin"
```

**CRITICAL**: Work is NOT complete until push succeeds!

### 5.3 Close Epic

```bash
beads close <epic-id> --reason "All tracks complete, quality gates passed, docs updated"
```

### 5.4 Session Handoff

Create `SESSION_HANDOFF.md`:
```markdown
# Session Handoff: Epic <epic-id>

## Completed
- Track 1: <summary>
- Track 2: <summary>
- Docs updated: AGENTS.md + <files>

## Remaining (if any)
- Track 4 blocked by <reason>

## Next Session
- Resume Track 4 with <approach>
```

---

## Integration with Ralph CLI

### Manual Trigger
```bash
# User starts epic
test-ralph.bat start <epic-id> --max-iter 30 --verbose

# Ralph CLI loop:
# Iteration 1: Check plan exists
# Iteration 2-N: Workers execute (simulated)
# Final: Quality gates + Knowledge extraction prompt
```

### Automatic Phases

Ralph CLI handles:
- **Phase 3**: Quality gate execution
- **Phase 4**: Knowledge extraction prompt creation
- **Phase 5**: Git push reminder

Orchestrator handles:
- **Phase 1**: Planning
- **Phase 2**: Worker spawning and monitoring

---

## Complete Example: Epic ved-jgea

### Input
```
User: "Clean up project structure and fix Prisma errors"
```

### Phase 1: Planning
```bash
/skill ralph

# Discovery (parallel)
Agent A: Found 201 files in root directory
Agent B: Found Prisma schema with missing types
Agent C: Found VPS toolkit for deployment

# Synthesis (oracle)
Risk Map:
- Prisma regeneration: HIGH → Spike required
- VPS deployment: HIGH → Spike required  
- Docs moves: LOW → Proceed

# Spikes (3 parallel)
Spike 1: Prisma → YES, safe to regenerate
Spike 2: VPS → YES, toolkit ready
Spike 3: Link checker → YES, automated

# Track Planning
Track 1 (BlueLake): Docs moves (7 beads)
Track 2 (GreenCastle): Prisma fix (1 bead - CRITICAL)
Track 3 (RedStone): Pattern docs (3 beads)
Track 4 (PurpleWave): VPS deployment (4 beads)
Track 5 (OrangeWave): Verification (4 beads)
```

### Phase 2: Execution
```bash
# Spawn 5 workers
Task() → BlueLake → docs/** → 7 beads
Task() → GreenCastle → apps/api/prisma/** → 1 bead (critical)
Task() → RedStone → docs/behavioral-design/** → 3 beads
Task() → PurpleWave → deployment/** → 4 beads (2 blocked)
Task() → OrangeWave → scripts/**, tests/** → 4 beads

# Result: 82% completion (18/22 beads)
# Track 4 blocked by Docker timeout (infrastructure, not code)
```

### Phase 3: Verification
```bash
Quality Gates: 5/5 PASS
- API build: 0 errors (from 188)
- Web build: PASS
- Tests: 71.3% pass
- Links: 0 broken
- Ultra-fast QG: PASS
```

### Phase 4: Documentation
```bash
# Knowledge extraction
Topics extracted:
1. Ralph CLI Orchestrator Pattern
2. Spike Validation Workflow
3. Track-Based Parallel Execution
4. VPS Toolkit Usage
5. Quality Gate Integration

AGENTS.md updated: 3 new sections (125 lines)
Mermaid diagram: Orchestrator workflow
Knowledge doc: docs/ved-jgea-knowledge-extraction.md
```

### Phase 5: Landing
```bash
git push → SUCCESS
beads close ved-jgea → COMPLETE
Session handoff → Created

✅ EPIC COMPLETE (82% - 18/22 beads)
```

---

## Tools Used

| Phase | Tools |
|-------|-------|
| Planning | `Task`, `finder`, `Grep`, `Read`, `oracle`, `beads create` |
| Execution | `Task`, `beads update/close`, `pnpm build/test` |
| Verification | `scripts/quality-gate.bat`, `beads sync`, `git status` |
| Documentation | `find_thread`, `read_thread`, `edit_file`, `mermaid` |
| Landing | `git push`, `beads close`, `create_file` |

---

## Success Criteria

Epic complete when:
- ✅ All beads closed (or documented blockers)
- ✅ Quality gates pass (5/5)
- ✅ Builds succeed with 0 errors
- ✅ AGENTS.md updated with learnings
- ✅ Git pushed to remote
- ✅ Session handoff created

**Promise**: `<promise>EPIC_COMPLETE</promise>`

---

## Configuration

### Ralph CLI (ralph.config.json)
```json
{
  "maxIterations": 30,
  "qualityGates": true,
  "knowledgeExtraction": true,
  "qualityGateScript": "scripts/quality-gate-ultra-fast.bat",
  "knowledgeExtractionPrompt": ".agents/skills/knowledge/epic-completion-prompt.txt"
}
```

### V-EdFinance Specific
- **Beads**: `beads.exe` (Windows), `bd` (Linux)
- **BV**: `bv.exe` (Windows), `bv` (Linux)
- **Quality Gates**: Ultra-fast (<1s) for rapid iteration
- **VPS**: Use `scripts/vps-toolkit/` for deployment

---

## Anti-Patterns (DON'T DO THIS)

❌ **Skip planning** → Workers discover blockers mid-execution
❌ **Overlapping file scopes** → Git merge conflicts
❌ **Skip quality gates** → Broken code pushed
❌ **Skip knowledge extraction** → Learnings lost
❌ **Stop before git push** → Work stranded locally

---

## Quick Reference

```bash
# Start epic
/skill ralph

# Or via Ralph CLI
test-ralph.bat start <epic-id> --max-iter 30

# Phases execute automatically:
# 1. Planning      → execution-plan.md
# 2. Execution     → parallel workers
# 3. Verification  → quality gates
# 4. Documentation → knowledge extraction
# 5. Landing       → git push

# Result: EPIC COMPLETE
```

---

## Files Structure

```
v-edfinance/
├── .agents/skills/
│   ├── ralph/                    # THIS SKILL
│   │   ├── SKILL.md
│   │   └── examples/
│   ├── planning.md               # Phase 1
│   ├── orchestrator.md           # Phase 2
│   └── knowledge/                # Phase 4
├── history/<epic-id>/
│   ├── discovery.md              # Planning output
│   ├── approach.md               # Risk map
│   ├── execution-plan.md         # Track assignments
│   └── knowledge-extraction-*.txt # Phase 4 output
├── .spikes/<epic-id>-*/          # Spike findings
├── .beads/                       # Beads tracking
└── ralph.config.json             # Configuration
```

---

## Metrics (from ved-jgea)

| Metric | Result |
|--------|--------|
| Planning time | ~1 hour |
| Execution time | ~3 hours (5 workers) |
| Verification time | <5 minutes |
| Documentation time | ~15 minutes |
| **Total** | **~4.5 hours** |
| **Beads completed** | 18/22 (82%) |
| **Quality gates** | 5/5 PASS |
| **Time saved** | 90% vs manual docs |

---

## Conclusion

**Ralph = Complete automation** from idea to production.

**One skill to rule them all**:
- Planning
- Execution
- Verification
- Documentation
- Landing

**Use whenever**: Starting new epic or feature work.

**Output**: Production-ready code + Updated docs + Knowledge preserved.

---

**Skill complete** ✅  
**Version**: Ralph 1.0.0  
**Date**: 2026-01-06
