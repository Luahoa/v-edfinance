# Approach Document: Comprehensive Project Cleanup (ved-jgea)

**Generated**: 2026-01-06  
**Epic**: ved-jgea  
**Status**: Risk-assessed, spike-verified approach

---

## Gap Analysis

| Component                  | Have                    | Need                                | Gap                              |
| -------------------------- | ----------------------- | ----------------------------------- | -------------------------------- |
| Prisma Type Exports        | schema.prisma           | All enums/models exported           | Missing 15+ enum exports         |
| TypeScript Build           | 188 errors              | 0 errors                            | Fix all type issues              |
| Documentation Structure    | 201 root files          | 15-25 organized files               | Move 176-186 files               |
| VPS Deployment             | 2 in_progress beads     | API + Web running on VPS            | Complete deployment tasks        |
| Pattern Extraction         | Scattered in code       | Documented in docs/behavioral/      | Extract and document             |
| Quality Gates              | Ultra-fast passing      | All gates passing                   | Upgrade to full gates            |

---

## Recommended Approach

### Phase 1: Prisma Schema Repair (CRITICAL PATH - P0)

**Strategy**: Fix schema drift by ensuring all enums and models are properly defined and exported.

**Approach**:
1. Run `npx prisma generate` in apps/api to regenerate client
2. Verify all missing exports exist in schema.prisma
3. If missing, add enum definitions following existing patterns
4. Re-run build to verify 0 errors
5. Commit immediately (don't batch with other changes)

**Why this approach**:
- Blocks all other work (can't deploy with build errors)
- Isolated to single file (prisma/schema.prisma)
- Low blast radius if done correctly
- Quick verification (build passes or fails clearly)

### Phase 2: Documentation Cleanup (PARALLEL TRACK - P1)

**Strategy**: Move files in batches by category, verify links after each batch.

**Approach**:
1. Create target directory structure first (docs/, archive/, history/)
2. Move files in small batches (10-15 at a time)
3. Update internal links after each batch
4. Verify no broken links before next batch
5. Extract patterns only after source files are in final location

**Why this approach**:
- No code dependencies (pure file moves)
- Can run in parallel with Phase 1
- Incremental verification prevents cascading link breaks
- Rollback-friendly (git revert if issues found)

### Phase 3: Deployment Preparation (DEPENDS ON PHASE 1 - P0)

**Strategy**: Complete in-progress deployment beads, verify health endpoints.

**Approach**:
1. Complete ved-43oq (API Docker) - already in_progress
2. Start ved-949o (Web Docker) after API healthy
3. Verify pgvector extension (ved-6yb) independently
4. Complete enrollment webhook (ved-0jl6) after API deployed

**Why this approach**:
- Sequential dependencies (Web needs API URL)
- External infrastructure dependencies (VPS access required)
- Health check validation at each step
- Can rollback individual services

### Phase 4: Final Verification (AFTER ALL TRACKS - P1)

**Strategy**: Comprehensive testing and link verification.

**Approach**:
1. Run full test suite (not just builds)
2. Check all documentation links
3. Run full quality gates (not ultra-fast)
4. Final audit and cleanup

---

## Alternative Approaches

### Alternative 1: Fix Everything Sequentially
- **Tradeoff**: Slower (no parallelism), but simpler coordination
- **Rejected**: Ralph CLI supports parallel tracks, should use it

### Alternative 2: Deploy First, Fix Build Later
- **Tradeoff**: Faster deployment, but unstable codebase
- **Rejected**: Can't deploy broken builds (188 errors)

### Alternative 3: Bulk Documentation Move
- **Tradeoff**: Faster moves, but link breaks harder to diagnose
- **Rejected**: High risk of cascading link failures

---

## Risk Map (Detailed)

| Component                      | Risk   | Reason                                   | Verification Strategy          |
| ------------------------------ | ------ | ---------------------------------------- | ------------------------------ |
| **Prisma Schema Regeneration** | HIGH   | May introduce type breaking changes      | Spike required                 |
| Prisma Enum Additions          | MEDIUM | May conflict with existing data          | Check DB for enum usage        |
| TypeScript Error Fixes         | MEDIUM | 188 errors, may reveal deeper issues     | Fix incrementally, test often  |
| Documentation Moves            | LOW    | Pure file operations                     | Proceed with git tracking      |
| Internal Link Updates          | MEDIUM | Many cross-references exist              | Automated link checker         |
| VPS API Deployment             | HIGH   | External infrastructure dependency       | Spike for credentials/access   |
| VPS Web Deployment             | HIGH   | Depends on API deployment                | Sequential after API           |
| Pgvector Extension             | MEDIUM | Requires DB superuser permissions        | Check VPS DB access            |
| Enrollment Webhook Logic       | LOW    | Follows existing webhook patterns        | Proceed                        |
| Test Suite Verification        | MEDIUM | May reveal regressions from cleanup      | Run after each track completes |
| Quality Gate Upgrade           | LOW    | Already have ultra-fast passing          | Proceed                        |

---

## Spike Requirements

### Spike 1: Prisma Schema Verification (HIGH RISK)

**Question**: Can we regenerate Prisma Client with all missing enums without breaking existing code?

**Time-box**: 30 minutes

**Output**: `.spikes/ved-jgea-prisma/`

**Success Criteria**:
- [ ] Identified all missing enum definitions
- [ ] Added enums to schema.prisma (throwaway)
- [ ] Ran `prisma generate` successfully
- [ ] Build passes with 0 TypeScript errors
- [ ] Documented enum values and usage patterns

**Close with**: "YES: Enums <list> added, build passes" OR "NO: Conflict <details>"

### Spike 2: VPS Access Verification (HIGH RISK)

**Question**: Do we have VPS credentials and can we deploy Docker containers?

**Time-box**: 20 minutes

**Output**: `.spikes/ved-jgea-vps/`

**Success Criteria**:
- [ ] SSH access to VPS confirmed
- [ ] Docker installed and running
- [ ] Can pull/push images
- [ ] Database access confirmed
- [ ] Documented deployment commands

**Close with**: "YES: Access confirmed, commands documented" OR "NO: Blocker <details>"

### Spike 3: Link Checker Automation (MEDIUM RISK)

**Question**: Can we automate broken link detection for documentation?

**Time-box**: 15 minutes

**Output**: `.spikes/ved-jgea-links/`

**Success Criteria**:
- [ ] Found or created link checker script
- [ ] Tested on current docs
- [ ] Outputs list of broken links
- [ ] Fast enough to run after each batch (<30s)

**Close with**: "YES: Script at <path>, tested" OR "NO: Manual checking required"

---

## File Scope Assignments (for Parallel Tracks)

### Track 1: Prisma Schema Repair
**File Scope**: `apps/api/prisma/**`
**No Overlap With**: Any other track (isolated)

### Track 2: Documentation Cleanup
**File Scope**: `docs/**, *.md` (excluding AGENTS.md, README.md, SPEC.md)
**No Overlap With**: Code files (Track 1, 3, 4)

### Track 3: VPS Deployment
**File Scope**: `apps/api/src/**`, `apps/web/src/**` (read-only), deployment scripts
**No Overlap With**: Documentation moves (Track 2)

### Track 4: Verification & Quality Gates
**File Scope**: `scripts/**, tests/**`
**No Overlap With**: Other tracks (verification role)

---

## Dependencies

### Cross-Track Dependencies
- Track 3 (Deployment) **BLOCKS ON** Track 1 (Prisma) completing (can't deploy broken build)
- Track 4 (Verification) **RUNS AFTER** all other tracks
- Track 2 (Docs) **INDEPENDENT** (can run in parallel with Track 1)

### External Dependencies
- VPS access credentials (for Track 3)
- Database superuser permissions (for pgvector)
- GitHub push access (for beads sync)

---

## Execution Strategy

### Iteration 1-5: Spike Phase
- Run 3 spikes in parallel (Prisma, VPS, Links)
- Aggregate results and update this approach
- Create bead files with spike learnings embedded

### Iteration 6-10: Track 1 (Prisma) - CRITICAL PATH
- All workers focus on fixing TypeScript errors
- Verify build passes before moving on

### Iteration 11-20: Tracks 2 + 3 (Parallel)
- Track 2: Documentation cleanup (independent)
- Track 3: VPS deployment (after Track 1 complete)

### Iteration 21-25: Track 4 (Verification)
- Run full test suite
- Check links
- Run quality gates
- Final audit

---

## Success Criteria

- [ ] **Build**: `pnpm --filter api build` exits 0
- [ ] **Build**: `pnpm --filter web build` exits 0
- [ ] **Docs**: Root directory has ≤ 25 files
- [ ] **Links**: 0 broken documentation links
- [ ] **Deploy**: API and Web running on VPS
- [ ] **Tests**: All tests passing
- [ ] **Quality**: Full quality gates passing
- [ ] **Beads**: All 22 ved-jgea sub-beads closed

---

## Next Steps

1. **Execute Spikes**: Run 3 spikes to validate HIGH risk approaches
2. **Aggregate Learnings**: Update this document with spike results
3. **Decompose to Beads**: Create `.beads/` files with spike learnings embedded
4. **Track Assignment**: Generate execution-plan.md with proper file scopes
5. **Validation**: Run `bv --robot-insights` to check for cycles
6. **Ready for Orchestrator**: Output `<promise>PLAN_READY</promise>`
