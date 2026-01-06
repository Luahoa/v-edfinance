# Execution Plan: ved-jgea - Comprehensive Project Cleanup (OPTIMIZED)

**Epic ID**: ved-jgea  
**Generated**: 2026-01-06  
**Estimated Iterations**: 25-30  
**Planning Method**: planning.md + orchestrator.md pipeline  
**Priority**: P1 (Pre-Deployment Cleanup)

---

## Prerequisites

- ✅ [Discovery Report](file:///e:/Demo%20project/v-edfinance/history/ved-jgea/discovery.md) - Codebase snapshot complete
- ✅ [Approach Document](file:///e:/Demo%20project/v-edfinance/history/ved-jgea/approach.md) - Risk-assessed strategy defined
- ⏳ Spikes Required - 3 HIGH-risk items need validation before execution

---

## Execution Strategy

### Phase 1: Spike Verification (Iterations 1-5)

**Run 3 spikes in parallel to validate HIGH-risk approaches:**

1. **Spike: Prisma Schema Verification** (ved-jgea-spike-1)
   - Question: Can we regenerate Prisma Client without breaking existing code?
   - Time-box: 30 minutes
   - Output: `.spikes/ved-jgea-prisma/`
   - Worker: Any available (BlueLake suggested)

2. **Spike: VPS Access Verification** (ved-jgea-spike-2)
   - Question: Do we have VPS credentials and deployment access?
   - Time-box: 20 minutes
   - Output: `.spikes/ved-jgea-vps/`
   - Worker: Any available (GreenCastle suggested)

3. **Spike: Link Checker Automation** (ved-jgea-spike-3)
   - Question: Can we automate broken link detection?
   - Time-box: 15 minutes
   - Output: `.spikes/ved-jgea-links/`
   - Worker: Any available (RedStone suggested)

**Spike Completion Criteria**: All 3 spikes closed with YES/NO answers and learnings documented.

---

## Phase 2: Parallel Track Execution (Iterations 6-20)

### Track 1 (BlueLake) - Prisma Schema Repair ⚠️ CRITICAL PATH

**File Scope**: `apps/api/prisma/**`  
**Priority**: P0 (Blocks deployment)  
**Dependencies**: None (can start immediately after spikes)

**Beads** (in execution order):

1. **ved-23fn** (Existing): Move DevOps documentation
   - File scope: `docs/devops/**`
   - Low risk, independent task
   
2. **ved-ai7v** (Existing): Move Beads documentation
   - File scope: `docs/beads/**`
   - Low risk, independent task

3. **ved-aso1** (Existing): Move testing documentation
   - File scope: `docs/testing/**`
   - Low risk, independent task

4. **ved-lixs** (Existing): Move database documentation
   - File scope: `docs/database/**`
   - Low risk, independent task

5. **ved-cw16** (Existing): Create complete docs structure
   - File scope: `docs/**`
   - Depends on above moves completing

6. **ved-ehux** (Existing): Create behavioral-design structure
   - File scope: `docs/behavioral-design/**`
   - Independent of other moves

7. **ved-pdg7** (Existing): Move EdTech test reports
   - File scope: `docs/reports/**`
   - Low risk, independent

**Track Completion Criteria**:
- All 7 beads closed
- Root directory has ≤ 50 files (intermediate milestone)
- No broken links in moved documentation
- Build still passes: `pnpm --filter api build`

---

### Track 2 (GreenCastle) - Prisma Type Fixes ⚠️ CRITICAL PATH

**File Scope**: `apps/api/prisma/schema.prisma`  
**Priority**: P0 (Blocks ALL deployment)  
**Dependencies**: Spike 1 must complete successfully

**Beads** (to be created after spike):

1. **ved-jgea-prisma-1**: Add missing enum definitions
   - Add: ChatRole, LessonType, Level, ProgressStatus, Role
   - Verification: `npx prisma generate` succeeds
   - Learnings from spike embedded

2. **ved-jgea-prisma-2**: Add remaining missing enums
   - Add: QuestionType, BuddyGroupType, PostType, RelationStatus, BuddyRole
   - Verification: `npx prisma generate` succeeds

3. **ved-jgea-prisma-3**: Fix Prisma namespace exports
   - Fix: DbNull, InputJsonValue, PrismaClientKnownRequestError
   - May require Prisma version upgrade
   - Verification: TypeScript build passes

4. **ved-jgea-prisma-4**: Run full API build verification
   - Command: `pnpm --filter api build`
   - Success criteria: 0 TypeScript errors (down from 188)
   - Document any remaining warnings

**Track Completion Criteria**:
- All 4 beads closed
- `pnpm --filter api build` exits 0 (0 errors)
- Prisma Client regenerates cleanly
- All 188 TypeScript errors resolved

---

### Track 3 (RedStone) - Pattern Extraction & Documentation Polish

**File Scope**: `docs/behavioral-design/**, docs/patterns/**  
**Priority**: P1 (Enhancement)  
**Dependencies**: Track 1 (docs moves) must complete first

**Beads** (in execution order):

1. **ved-aww5** (Existing): Extract Hooked Model patterns
   - Read: Existing code implementing Hooked Model
   - Output: `docs/behavioral-design/hooked-model.md`
   - File scope: `docs/behavioral-design/**`

2. **ved-vzx0** (Existing): Extract Nudge Theory patterns
   - Read: NudgeService, behavior modules
   - Output: `docs/behavioral-design/nudge-theory.md`
   - File scope: `docs/behavioral-design/**`

3. **ved-wxc7** (Existing): Extract Gamification patterns
   - Read: Leaderboard, achievements, challenges
   - Output: `docs/behavioral-design/gamification.md`
   - File scope: `docs/behavioral-design/**`

**Track Completion Criteria**:
- All 3 beads closed
- 3 pattern documentation files created
- Cross-references updated in AGENTS.md

---

### Track 4 (PurpleWave) - VPS Deployment ⚠️ EXTERNAL DEPENDENCY

**File Scope**: `deployment/**, scripts/deploy/**`  
**Priority**: P0 (Deployment blocker)  
**Dependencies**: Track 2 (Prisma) must complete + Spike 2 success

**Beads** (in execution order):

1. **ved-43oq** (Existing - in_progress): Deploy API Docker Image to VPS
   - Complete in-progress task
   - Verification: API health endpoint responds
   - File scope: `apps/api/**` (read-only)

2. **ved-6yb** (Existing - in_progress): Enable Pgvector extension on VPS
   - Complete in-progress task
   - Requires DB superuser access
   - Verification: `SELECT * FROM pg_extension WHERE extname = 'vector';`

3. **ved-949o** (Existing): Deploy Web Docker Image to VPS
   - Depends on ved-43oq (needs API_URL)
   - Verification: Web homepage loads
   - File scope: `apps/web/**` (read-only)

4. **ved-0jl6** (Existing): Enrollment Logic - Service Layer
   - Webhook handler for payment → enrollment
   - Depends on API deployment
   - File scope: `apps/api/src/modules/enrollment/**`

**Track Completion Criteria**:
- All 4 beads closed
- API and Web running on VPS
- Pgvector extension enabled
- Enrollment webhook functional

---

## Phase 3: Verification & Final Cleanup (Iterations 21-25)

### Track 5 (OrangeWave) - Final Verification

**File Scope**: `scripts/**, tests/**, docs/**  
**Priority**: P1 (Quality assurance)  
**Dependencies**: ALL previous tracks complete

**Beads** (in execution order):

1. **ved-idst** (Existing): Run test suite verification
   - Command: `pnpm test`
   - Document any failures
   - File scope: `tests/**`

2. **ved-jtxp** (Existing): Update all documentation links
   - Use link checker from Spike 3
   - Fix broken cross-references
   - File scope: `docs/**, *.md`

3. **ved-z9n1** (Existing): Check for broken links
   - Automated link verification
   - Report any remaining issues
   - File scope: `docs/**`

4. **ved-ucot** (Existing): Final cleanup audit
   - Verify root directory ≤ 25 files
   - Run full quality gates
   - Close epic if all criteria met

**Track Completion Criteria**:
- All 4 beads closed
- 0 test failures
- 0 broken documentation links
- Root directory cleaned (15-25 files)
- All quality gates passing

---

## Tracks Summary

| Track | Agent       | File Scope                     | Beads | Risk   | Can Start After   |
| ----- | ----------- | ------------------------------ | ----- | ------ | ----------------- |
| 1     | BlueLake    | `docs/**` (moves)              | 7     | LOW    | Spikes complete   |
| 2     | GreenCastle | `apps/api/prisma/**`           | 4     | HIGH   | Spike 1 success   |
| 3     | RedStone    | `docs/behavioral-design/**`    | 3     | LOW    | Track 1 complete  |
| 4     | PurpleWave  | `deployment/**, apps/**` (RO)  | 4     | HIGH   | Track 2 + Spike 2 |
| 5     | OrangeWave  | `scripts/**, tests/**, docs/**`| 4     | MEDIUM | Tracks 1-4        |

---

## Cross-Track Dependencies

```
Spikes (Parallel)
  ├─> Track 1 (BlueLake) - Docs Moves [INDEPENDENT]
  ├─> Track 2 (GreenCastle) - Prisma Fixes [BLOCKS Track 4]
  └─> Spike 2 Success [BLOCKS Track 4]

Track 1 Complete → Track 3 (RedStone) - Pattern Extraction

Track 2 Complete + Spike 2 → Track 4 (PurpleWave) - Deployment

Tracks 1-4 Complete → Track 5 (OrangeWave) - Verification
```

---

## File Scope Validation

**No Overlaps** (verified):
- Track 1: `docs/**` (moves only)
- Track 2: `apps/api/prisma/**` (schema only)
- Track 3: `docs/behavioral-design/**` (new files)
- Track 4: `deployment/**, apps/**` (mostly read-only)
- Track 5: `scripts/**, tests/**` (verification)

**Potential Conflicts**:
- Track 1 and Track 3 both touch `docs/**`
  - **Resolution**: Track 3 starts AFTER Track 1 completes
- Track 4 reads `apps/**` while Track 2 modifies `apps/api/prisma/**`
  - **Resolution**: Track 4 starts AFTER Track 2 completes

---

## Ralph Loop Integration

### Worker Spawning Protocol

**Orchestrator will spawn 5 workers via Task() tool:**

```typescript
// After spikes complete
Task("Worker BlueLake: Track 1 - Documentation Moves", prompt)
Task("Worker GreenCastle: Track 2 - Prisma Schema Repair", prompt)

// After Track 1 completes
Task("Worker RedStone: Track 3 - Pattern Extraction", prompt)

// After Track 2 + Spike 2 success
Task("Worker PurpleWave: Track 4 - VPS Deployment", prompt)

// After all tracks complete
Task("Worker OrangeWave: Track 5 - Final Verification", prompt)
```

### Agent Mail Threads

- **Epic Thread**: `ved-jgea` (all workers report here)
- **Track Threads**:
  - `track:BlueLake:ved-jgea`
  - `track:GreenCastle:ved-jgea`
  - `track:RedStone:ved-jgea`
  - `track:PurpleWave:ved-jgea`
  - `track:OrangeWave:ved-jgea`

---

## Success Criteria (Epic Completion)

### Build Validation
- [ ] `pnpm --filter api build` exits 0 (0 errors, down from 188)
- [ ] `pnpm --filter web build` exits 0
- [ ] `npx prisma generate` runs successfully

### Documentation
- [ ] Root directory has ≤ 25 files (target achieved)
- [ ] 0 broken documentation links
- [ ] Pattern docs exist: hooked-model.md, nudge-theory.md, gamification.md

### Deployment
- [ ] API running on VPS with health check passing
- [ ] Web running on VPS with homepage loading
- [ ] Pgvector extension enabled on VPS database
- [ ] Enrollment webhook functional

### Quality
- [ ] All tests passing: `pnpm test`
- [ ] Full quality gates passing: `scripts/quality-gate.bat`
- [ ] All 22 ved-jgea sub-beads closed
- [ ] No TypeScript `any` types introduced

### Beads Status
- [ ] All spikes closed (3/3)
- [ ] All Track 1 beads closed (7/7)
- [ ] All Track 2 beads closed (4/4)
- [ ] All Track 3 beads closed (3/3)
- [ ] All Track 4 beads closed (4/4)
- [ ] All Track 5 beads closed (4/4)

---

## Key Learnings (from Spikes)

**Will be filled after spike execution** - To be embedded in bead descriptions.

---

## Risk Mitigation

### HIGH Risk: Prisma Schema Changes
- **Spike**: Validate approach before Track 2 starts
- **Rollback**: Keep backup of original schema.prisma
- **Verification**: Run build after every enum addition

### HIGH Risk: VPS Deployment
- **Spike**: Verify credentials and access before Track 4
- **External Dependency**: May require manual intervention
- **Fallback**: Document manual deployment steps if automation fails

### MEDIUM Risk: Link Breaks
- **Spike**: Automate link checking
- **Prevention**: Move files in small batches
- **Verification**: Run link checker after each batch

---

<promise>READY_FOR_EXECUTION</promise>

**This plan is optimized for Ralph CLI autonomous execution with proper:**
- ✅ File scope isolation (no conflicts)
- ✅ Risk assessment (HIGH/MEDIUM/LOW)
- ✅ Spike requirements (3 spikes defined)
- ✅ Cross-track dependencies documented
- ✅ Agent Mail integration points
- ✅ Ralph Loop completion criteria
