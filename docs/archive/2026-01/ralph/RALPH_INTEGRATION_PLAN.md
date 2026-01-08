# Ralph Loop Integration Plan: Autonomous System Improvement

**Epic**: Integrate Ralph Wiggum methodology with planning.md + orchestrator.md workflow  
**Goal**: Zero-human-intervention system improvement pipeline  
**Date**: 2026-01-06

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    RALPH SUPER-LOOP (Outer Loop)                    │
│                         /ralph-loop command                         │
├─────────────────────────────────────────────────────────────────────┤
│  System Prompt: "Improve codebase quality by <metric>"             │
│  Completion: <promise>QUALITY_GATE_PASSED</promise>                │
│  Max Iterations: 50                                                 │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ Iteration 1..N
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PHASE 1: PLANNING SKILL                          │
├─────────────────────────────────────────────────────────────────────┤
│  Input: Feature request or improvement area                         │
│  Process:                                                           │
│    1. Discovery (parallel sub-agents)                               │
│    2. Synthesis (Oracle gap analysis)                               │
│    3. Verification (Spike beads for HIGH risk)                      │
│    4. Decomposition (file-beads skill → .beads/*.md)                │
│    5. Validation (bv --robot-suggest/insights/priority)             │
│    6. Track Planning (execution-plan.md)                            │
│  Output: history/<feature>/execution-plan.md                        │
│  Completion: <promise>PLAN_READY</promise>                         │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                 PHASE 2: ORCHESTRATOR SKILL                         │
├─────────────────────────────────────────────────────────────────────┤
│  Input: execution-plan.md                                           │
│  Process:                                                           │
│    1. Read execution plan                                           │
│    2. Initialize Agent Mail                                         │
│    3. Spawn worker sub-agents (Task() parallel)                     │
│    4. Monitor via Agent Mail inbox                                  │
│    5. Handle cross-track blockers                                   │
│    6. Announce epic completion                                      │
│  Output: Completed beads + working code                             │
│  Completion: <promise>EPIC_COMPLETE</promise>                      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  PHASE 3: QUALITY VERIFICATION                      │
├─────────────────────────────────────────────────────────────────────┤
│  Input: Modified codebase                                           │
│  Process:                                                           │
│    1. Run quality-gate.sh                                           │
│    2. Parse JSON output                                             │
│    3. Check for failed gates                                        │
│  Decisions:                                                         │
│    - All gates pass → Output <promise>QUALITY_GATE_PASSED</promise>│
│    - Any gate fails → Read failures, continue loop (fix issues)    │
│  Completion: <promise>QUALITY_GATE_PASSED</promise>                │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ (Stop hook detects promise)
                              ▼
                         EXIT SUCCESS
```

---

## Integration Points

### 1. Ralph Stop Hook → Quality Gates

**File**: `claude-code/plugins/ralph-wiggum/hooks/stop-hook.sh`

**Current behavior**:
- Detects `<promise>TEXT</promise>` in assistant output
- Blocks exit if promise not found
- Feeds same prompt back to continue loop

**Enhancement needed**:
```bash
# Add to stop-hook.sh after line 128
# BEFORE continuing loop, run quality verification

if [[ -x "./scripts/quality-gate.sh" ]]; then
  echo "🔍 Running quality gate verification..." >&2
  
  # Run quality gate and capture JSON output
  GATE_RESULT=$(./scripts/quality-gate.sh 2>/dev/null || echo '{"gates":[],"summary":{"failed":1}}')
  
  # Check if all gates passed
  FAILED_COUNT=$(echo "$GATE_RESULT" | jq -r '.summary.failed // 1')
  
  if [[ "$FAILED_COUNT" -eq 0 ]]; then
    echo "✅ Quality gates passed - suggesting completion" >&2
    # Append quality report to prompt
    PROMPT_TEXT="$PROMPT_TEXT

## Quality Gate Results (Auto-Generated)
All quality gates PASSED. You may now output <promise>QUALITY_GATE_PASSED</promise> if task is complete."
  else
    echo "❌ Quality gates failed ($FAILED_COUNT failures) - continuing loop" >&2
    # Append failure details to prompt
    FAILED_GATES=$(echo "$GATE_RESULT" | jq -r '.gates[] | select(.status == "failed") | "- \(.gate): \(.message)"')
    PROMPT_TEXT="$PROMPT_TEXT

## Quality Gate FAILURES (Auto-Generated)
Fix these issues before completion:
$FAILED_GATES"
  fi
fi
```

### 2. Planning Skill → Completion Promise

**File**: `.agents/skills/planning.md`

**Add to Phase 6 output** (`history/<feature>/execution-plan.md`):
```markdown
## Ralph Loop Completion Criteria

When ALL of these conditions are true, output <promise>PLAN_READY</promise>:
- [ ] Discovery report exists (history/<feature>/discovery.md)
- [ ] Approach document exists (history/<feature>/approach.md)
- [ ] All HIGH-risk spikes completed (.spikes/<feature>/*.md)
- [ ] Beads created (.beads/*.md)
- [ ] bv validation passes (no cycles, all deps resolved)
- [ ] Execution plan generated (this file)
```

### 3. Orchestrator Skill → Worker Self-Correction

**File**: `.agents/skills/orchestrator.md`

**Enhance Worker Prompt Template** (after line 335):
```markdown
## Self-Correction Protocol

After EACH bead completion:
1. Run verification command: `pnpm --filter <scope> build`
2. If build fails:
   - Read error output
   - Fix errors
   - Re-run build
   - Repeat until success
3. Only then mark bead complete and report to orchestrator

## Ralph-Style Iteration

Your worker runs in a mini-loop:
1. Claim bead (bd update --status in_progress)
2. Implement
3. Verify (build/lint/test)
4. IF verification fails → Re-read errors, fix, repeat from step 3
5. ELSE → Close bead, report completion
```

### 4. Quality Gate Integration

**File**: `scripts/quality-gate.sh`

**Already supports**:
- JSON output for CI/CD (line 39-43)
- Exit codes (0 = pass, 1 = fail)
- Detailed gate results

**Enhancement needed**:
```bash
# Add to end of quality-gate.sh (after line 280)

# Export JSON for Ralph loop consumption
JSON_REPORT=$(jq -n \
  --argjson gates "$JSON_GATES" \
  --arg passed "$PASSED" \
  --arg failed "$FAILED" \
  --arg warnings "$WARNINGS" \
  --arg duration "$(($(date +%s) - START_TIME))" \
  '{
    "gates": $gates,
    "summary": {
      "passed": ($passed | tonumber),
      "failed": ($failed | tonumber),
      "warnings": ($warnings | tonumber),
      "duration_seconds": ($duration | tonumber)
    }
  }')

echo "$JSON_REPORT" > .quality-gate-result.json
```

---

## Completion Promises Hierarchy

### Level 1: Planning Skill
```markdown
Output <promise>PLAN_READY</promise> when:
- All discovery artifacts exist
- All HIGH-risk spikes validated
- Beads created and dependency graph valid
- Execution plan generated
```

### Level 2: Orchestrator Skill
```markdown
Output <promise>EPIC_COMPLETE</promise> when:
- All tracks report completion
- All beads in epic closed
- bv --robot-triage shows 0 open items
```

### Level 3: Quality Gate
```markdown
Output <promise>QUALITY_GATE_PASSED</promise> when:
- scripts/quality-gate.sh exits 0
- .quality-gate-result.json shows "failed": 0
- No blocking errors exist
```

### Level 4: Super-Loop (Ralph)
```markdown
Output <promise>FEATURE_COMPLETE</promise> when:
- PLAN_READY detected
- EPIC_COMPLETE detected
- QUALITY_GATE_PASSED detected
```

---

## Safety Mechanisms

### 1. Max Iterations
```bash
/ralph-loop "Improve test coverage to 85%" \
  --completion-promise "QUALITY_GATE_PASSED" \
  --max-iterations 50
```

### 2. Rollback Strategy
**Create pre-loop checkpoint**:
```bash
# Before starting Ralph loop
git stash push -u -m "Pre-Ralph checkpoint: $(date +%Y%m%d_%H%M%S)"
echo "Checkpoint: $(git stash list | head -1)" > .ralph-checkpoint
```

**Rollback if needed**:
```bash
# If loop produces broken state
CHECKPOINT=$(cat .ralph-checkpoint)
git stash pop # Apply checkpoint
```

### 3. Circuit Breaker
**Detect infinite loops**:
```bash
# In stop-hook.sh, track repeated failures
if [[ -f ".ralph-failure-count" ]]; then
  FAILURE_COUNT=$(cat .ralph-failure-count)
else
  FAILURE_COUNT=0
fi

# If quality gate fails
if [[ "$FAILED_COUNT" -gt 0 ]]; then
  FAILURE_COUNT=$((FAILURE_COUNT + 1))
  echo "$FAILURE_COUNT" > .ralph-failure-count
  
  # Circuit breaker: 3 consecutive failures
  if [[ "$FAILURE_COUNT" -ge 3 ]]; then
    echo "🚨 Circuit breaker: 3 consecutive quality failures" >&2
    echo "   Manual intervention required" >&2
    rm "$RALPH_STATE_FILE"
    exit 0
  fi
else
  # Success - reset counter
  echo "0" > .ralph-failure-count
fi
```

### 4. Scope Limiting
**Prevent scope creep**:
```markdown
# In Ralph prompt
## Constraints
- ONLY modify files in: apps/api/src/modules/behavioral/
- DO NOT refactor unrelated code
- DO NOT add new dependencies without explicit approval
- DO NOT modify database schema
```

---

## Implementation Workflow

### Step 1: Setup Ralph Plugin
```bash
# Copy plugin to V-EdFinance
mkdir -p .claude/plugins
cp -r claude-code/plugins/ralph-wiggum/* .claude/plugins/

# Test plugin
cd .claude/plugins
bash commands/ralph-loop.sh "Test task" --max-iterations 5
```

### Step 2: Enhance Stop Hook
```bash
# Apply integration changes to stop-hook.sh
# Add quality gate verification (see Integration Point 1)
```

### Step 3: Update Skills
```bash
# Add completion promises to:
# - .agents/skills/planning.md (PLAN_READY)
# - .agents/skills/orchestrator.md (EPIC_COMPLETE)
```

### Step 4: Create Master Prompt Template
```bash
# File: .agents/prompts/ralph-system-improvement.md
```

### Step 5: Test Run
```bash
/ralph-loop "$(cat .agents/prompts/ralph-system-improvement.md)" \
  --completion-promise "QUALITY_GATE_PASSED" \
  --max-iterations 20
```

---

## Master Prompt Template

**File**: `.agents/prompts/ralph-system-improvement.md`

```markdown
You are an autonomous system improvement agent. Your goal is to improve the V-EdFinance codebase quality metrics.

## Current Objective
Increase test coverage from 72% to 85% in apps/api/src/modules/behavioral/

## Process
1. Load planning skill: /skill planning
2. Generate improvement plan following 6-phase pipeline
3. Output <promise>PLAN_READY</promise> when plan complete
4. Load orchestrator skill: /skill orchestrator
5. Execute plan using multi-agent coordination
6. Output <promise>EPIC_COMPLETE</promise> when all beads done
7. Run quality verification: bash scripts/quality-gate.sh
8. Output <promise>QUALITY_GATE_PASSED</promise> when all gates pass

## Completion Signal
When you see quality-gate.sh output "All quality gates PASSED", and test coverage ≥ 85%, output:
<promise>QUALITY_GATE_PASSED</promise>

## Constraints
- Only modify files in: apps/api/src/modules/behavioral/
- Follow AGENTS.md code style (TypeScript strict, no any)
- Run `pnpm --filter api build` after each change
- If build fails, read errors and fix before proceeding

## Self-Correction
If quality gates fail:
1. Read failure details from .quality-gate-result.json
2. Identify root cause
3. Fix issues
4. Re-run verification
5. Continue until all gates pass

Do NOT output the completion promise until quality gates actually pass.
```

---

## Expected Behavior

### Iteration 1-3: Planning
```
Iteration 1: Discovery → find existing tests, coverage reports
Iteration 2: Synthesis → Oracle analyzes gaps, identifies missing tests
Iteration 3: Verification → Spike to validate test framework setup
             → Output <promise>PLAN_READY</promise>
```

### Iteration 4-15: Execution
```
Iteration 4: Spawn 3 worker agents (Track 1: Unit tests, Track 2: Integration, Track 3: E2E)
Iteration 5-10: Workers implement tests, self-correct build errors
Iteration 11: Worker 1 reports Track 1 complete
Iteration 12: Worker 2 reports Track 2 complete
Iteration 13: Worker 3 reports Track 3 complete
Iteration 14: Orchestrator validates all beads closed
             → Output <promise>EPIC_COMPLETE</promise>
```

### Iteration 16-20: Quality Verification
```
Iteration 16: Run quality-gate.sh → Fails (coverage 78%, target 85%)
Iteration 17: Read failure, add missing tests to auth.service.spec.ts
Iteration 18: Run quality-gate.sh → Fails (coverage 82%, target 85%)
Iteration 19: Read failure, add edge case tests
Iteration 20: Run quality-gate.sh → PASS (coverage 86%)
             → Output <promise>QUALITY_GATE_PASSED</promise>
             → Ralph loop exits
```

---

## Metrics & Observability

### Track Progress
```bash
# Watch Ralph iterations
tail -f .claude/ralph-loop.local.md

# Monitor quality gate results
watch -n 5 'jq . .quality-gate-result.json'

# Monitor beads progress
bv --robot-triage --graph-root <epic-id>
```

### Success Criteria
- Loop completes in < 50 iterations
- No manual intervention required
- All quality gates pass
- Code changes aligned with constraints
- Git history clean (atomic commits per bead)

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Infinite loop (impossible task) | Max iterations = 50, circuit breaker at 3 consecutive failures |
| Scope creep (modifies unrelated code) | File scope constraints in prompt, workers use file reservations |
| Breaking changes | Pre-loop git checkpoint, rollback script |
| Quality regression | quality-gate.sh validates every iteration |
| Token cost runaway | Monitor costs, stop if > $10/iteration |
| Conflicting worker edits | Agent Mail file reservations, non-overlapping file scopes |

---

## Next Steps

1. **Implement**: Copy Ralph plugin + apply integrations
2. **Test**: Small task (e.g., "Add JSDoc to 3 functions")
3. **Iterate**: Medium task (e.g., "Increase coverage 5%")
4. **Production**: Large task (e.g., "Implement new feature X")
5. **Monitor**: Track success rate, iteration counts, cost per task
