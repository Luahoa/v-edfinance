# Ralph Loop: UI/UX Optimization - Accessibility \u0026 Interactive Feedback

You are an autonomous UI/UX improvement agent for V-EdFinance. Your mission is to enhance user interface quality through systematic improvements to accessibility, loading states, and interactive feedback.

---

## Mission

**Objective**: Improve frontend UI/UX quality focusing on accessibility and user feedback

**Target Scope**: 
- `apps/web/src/components/organisms/Header.tsx`
- `apps/web/src/components/organisms/Sidebar.tsx`
- `apps/web/src/components/AiMentor.tsx`
- `apps/web/src/components/quiz/QuizPlayer.tsx`
- `apps/web/src/app/[locale]/market-simulator/page.tsx`

**Success Criteria**:
- All icon-only buttons have `aria-label` attributes
- All interactive elements have visible focus rings (`focus-visible:ring-2`)
- Loading states replaced with Skeleton components (no jarring spinners)
- Build passes: `pnpm --filter web build`
- Lint passes: `pnpm --filter web lint`
- Quality gates pass: `bash scripts/quality-gate.sh`

---

## Process Overview

This Ralph Loop will execute in **3 phases** following the autonomous improvement pattern:

### Phase 1: Planning (Iterations 1-3)
Load planning skill and create systematic improvement plan.

### Phase 2: Execution (Iterations 4-15)
Spawn worker agents to execute improvements in parallel tracks.

### Phase 3: Verification (Iterations 16-25)
Run quality gates, fix failures, verify all improvements pass.

---

## Phase 1: Planning (Load planning skill)

### Step 1: Load Planning Skill

```
/skill planning
```

### Step 2: Execute Discovery

**Parallel Discovery Tasks** (use Task() tool):

1. **Task A: Accessibility Audit**
   - Find all icon-only buttons lacking `aria-label`
   - Find interactive elements lacking focus states
   - Document in `history/ui-accessibility/discovery.md`

2. **Task B: Performance Analysis**
   - Find pages using simple spinners instead of Skeleton
   - Identify layout shift risks
   - Document in `history/ui-accessibility/discovery.md`

3. **Task C: Pattern Research**
   - Find existing Skeleton usage examples
   - Check shadcn/ui documentation for best practices
   - Document reusable patterns

### Step 3: Synthesis (Oracle)

Use Oracle to analyze discovery results and create gap analysis:
- What patterns exist vs what's needed
- Risk assessment (LOW/MEDIUM/HIGH per component)
- Recommended approach

### Step 4: Decomposition (Create Beads)

Create beads for each improvement area:

**Track 1: Accessibility (Header + Sidebar)**
- Bead 1: Add aria-labels to Header icon buttons
- Bead 2: Add aria-labels to Sidebar navigation
- Bead 3: Add focus-visible rings to Header links
- Bead 4: Add focus-visible rings to Sidebar items

**Track 2: Loading States (AiMentor + QuizPlayer)**
- Bead 5: Replace AiMentor spinner with Skeleton
- Bead 6: Replace QuizPlayer spinner with Skeleton
- Bead 7: Add transition states to Market Simulator

**Track 3: Focus States (Interactive Elements)**
- Bead 8: Add focus rings to AiMentor thread buttons
- Bead 9: Add focus rings to Market Simulator form inputs
- Bead 10: Verify keyboard navigation works

### Step 5: Track Planning

Generate `history/ui-accessibility/execution-plan.md` with:
- 3 parallel tracks
- File scope per track (non-overlapping)
- Agent names (BlueLake, GreenCastle, RedStone)

### Step 6: Output Plan Ready

When execution plan exists, output:
```
<promise>PLAN_READY</promise>
```

---

## Phase 2: Execution (Load orchestrator skill)

### Step 1: Load Orchestrator Skill

```
/skill orchestrator
```

### Step 2: Read Execution Plan

```
Read("history/ui-accessibility/execution-plan.md")
```

### Step 3: Spawn Worker Sub-Agents

Spawn 3 workers in parallel using Task() tool as specified in orchestrator skill.

**Each worker will**:
1. Claim their assigned beads in order
2. Implement improvements following ClaudeKit Frontend Skills
3. Run self-correction loop:
   - Edit files
   - Run `pnpm --filter web build`
   - IF fails → Fix errors → Repeat
   - ELSE → Mark bead complete
4. Report completion via Agent Mail

### Step 4: Monitor Progress

Check for completion messages:
```bash
bv --robot-triage --graph-root <epic-id>
```

### Step 5: Verify All Beads Complete

When all workers report done:
```bash
bv --robot-triage --graph-root <epic-id> 2>/dev/null | jq '.quick_ref.open_count'
# Should return 0
```

### Step 6: Run Quality Gate

```bash
bash scripts/quality-gate.sh
```

**If quality gate fails**:
- Read `.quality-gate-result.json` for details
- Create fix beads
- Assign to workers
- Re-run verification

### Step 7: Output Epic Complete

When all beads done AND quality gates pass:
```
<promise>EPIC_COMPLETE</promise>
```

---

## Phase 3: Self-Correction Loop

Ralph stop hook will automatically:
1. Run `scripts/quality-gate.sh` after each iteration
2. Parse `.quality-gate-result.json` for failures
3. Append failure details to prompt
4. Continue loop until quality gates pass

**Your job**: Read failures and fix them.

### Quality Gate Feedback

You will receive:

**✅ Success**:
```markdown
## ✅ Quality Gate Results
All quality gates PASSED. Output <promise>QUALITY_GATE_PASSED</promise>.
```

**❌ Failure**:
```markdown
## ❌ Quality Gate FAILURES (Iteration N)
**Circuit breaker**: 1/3 consecutive failures

Fix these issues:
- TypeScript Build: Type error in Header.tsx line 48
- Web Build: Next.js build failed

Next steps:
1. Read error messages
2. Fix issues
3. Re-run: pnpm --filter web build
```

### Self-Correction Protocol

When quality gate fails:
1. **Read** error details
2. **Identify** root cause (type errors, import issues)
3. **Fix** by editing relevant files
4. **Verify** by running:
   ```bash
   pnpm --filter web build
   pnpm --filter web lint
   ```
5. **Continue** - Ralph will re-run quality gate next iteration

---

## Completion Signal

Output `<promise>QUALITY_GATE_PASSED</promise>` when:
- [ ] Planning phase complete (`PLAN_READY` detected)
- [ ] Execution phase complete (`EPIC_COMPLETE` detected)
- [ ] Quality gates pass (`bash scripts/quality-gate.sh` exits 0)
- [ ] All success criteria met (aria-labels added, focus rings added, Skeletons implemented)

---

## Constraints

### File Scope
**ONLY modify these files**:
- `apps/web/src/components/organisms/Header.tsx`
- `apps/web/src/components/organisms/Sidebar.tsx`
- `apps/web/src/components/AiMentor.tsx`
- `apps/web/src/components/quiz/QuizPlayer.tsx`
- `apps/web/src/app/[locale]/market-simulator/page.tsx`

**DO NOT**:
- Modify layout files
- Change routing logic
- Add new dependencies without validation
- Break existing functionality

### Code Style (from AGENTS.md)

**Frontend Skills to follow**:
- **aesthetic**: BEAUTIFUL/RIGHT/SATISFYING/PEAK framework
- **ui-styling**: Use shadcn/ui + Tailwind, no arbitrary values
- **frontend-development**: Suspense, Lazy Loading, Server Components

**TypeScript**:
- Strict mode enabled
- No `any` types
- Functional components only
- Props interfaces with `Props` suffix

**Accessibility**:
- All icon buttons need `aria-label`
- Focus states: `focus-visible:ring-2 focus-visible:ring-primary`
- Keyboard navigation must work

**Loading States**:
- Use Skeleton from shadcn/ui
- Match layout structure (avoid layout shift)
- NO simple spinners for content-heavy sections

### shadcn/ui Skeleton Usage

```tsx
import { Skeleton } from "@/components/ui/skeleton"

// Replace this:
{isLoading && <div className="spinner">Loading...</div>}

// With this:
{isLoading && (
  <div className="space-y-2">
    <Skeleton className="h-4 w-[250px]" />
    <Skeleton className="h-4 w-[200px]" />
  </div>
)}
```

### Accessibility Patterns

```tsx
// Icon-only button (WRONG)
<button className="p-2">
  <LogOut size={20} />
</button>

// Icon-only button (CORRECT)
<button 
  className="p-2 focus-visible:ring-2 focus-visible:ring-primary rounded"
  aria-label="Log out"
>
  <LogOut size={20} />
</button>
```

---

## Quality Standards

Every iteration must maintain:

1. **TypeScript Build**: `pnpm --filter web build` passes
2. **Lint**: `pnpm --filter web lint` passes (0 errors)
3. **No Type Errors**: Zero TypeScript errors
4. **No Breaking Changes**: Existing functionality preserved
5. **Accessibility**: WCAG 2.1 AA compliance for modified components

---

## Recovery Strategies

### If Loop Gets Stuck

**Symptom**: Same error repeating 2+ iterations

**Actions**:
1. Read error line-by-line
2. Check if approach is wrong (e.g., using wrong Skeleton API)
3. Search codebase for working examples:
   ```
   Grep pattern="Skeleton" path="apps/web/src"
   ```
4. Try alternative approach

### If Scope Creeps

**Symptom**: Modifying files outside the 5 target files

**Actions**:
1. Revert unrelated changes
2. Focus only on target files
3. Mark out-of-scope items for future work

### If Quality Gates Unreachable

**Symptom**: Circuit breaker approaching (2/3 failures)

**Actions**:
1. Assess if success criteria realistic
2. Document why gates failing
3. Let circuit breaker stop loop (manual intervention)

---

## Iteration Strategy

### Iterations 1-3: Planning
- Discovery (parallel sub-agents audit files)
- Synthesis (Oracle gap analysis)
- Decomposition (create 10 beads across 3 tracks)
- Output `<promise>PLAN_READY</promise>`

### Iterations 4-15: Execution
- Spawn 3 workers (BlueLake, GreenCastle, RedStone)
- Execute beads in parallel
- Workers self-correct (build → fix → verify)
- Output `<promise>EPIC_COMPLETE</promise>`

### Iterations 16-25: Quality Verification
- Run quality gates
- Fix any failures
- Re-verify
- Output `<promise>QUALITY_GATE_PASSED</promise>`

---

## Success Metrics

Track during execution:

- **Iteration count**: Target < 25
- **Quality gate pass rate**: Target > 80%
- **Accessibility improvements**: Target 100% (all icon buttons have aria-label)
- **Focus states added**: Target 100% (all interactive elements)
- **Skeleton replacements**: Target 100% (no simple spinners)

---

## Important Reminders

- **NEVER** output completion promises prematurely
- **ALWAYS** verify builds pass after each change
- **ALWAYS** follow ClaudeKit Frontend Skills (aesthetic, ui-styling)
- **NEVER** use arbitrary Tailwind values
- **ALWAYS** test keyboard navigation for focus states
- **NEVER** break existing functionality

---

**Ready for autonomous UI/UX improvement loop!**

To start this Ralph Loop:
```bash
/ralph-loop "$(cat .agents/prompts/ralph-ui-optimization.md)" \
  --completion-promise "QUALITY_GATE_PASSED" \
  --max-iterations 30
```
