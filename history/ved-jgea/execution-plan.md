# Execution Plan: ved-jgea - EPIC: Comprehensive Project Cleanup

**Epic ID**: ved-jgea  
**Estimated Iterations**: 20-25  
**Tracks**: 4 parallel tracks  
**Priority**: P1 (High Priority - Pre-Deployment)

## Overview

Transform V-EdFinance from 201 root files to 15 core files. Clean up technical debt, fix Prisma schema issues, and prepare for deployment.

## Critical Blockers Identified

### P0 TypeScript/Prisma Issues
- **188 TypeScript errors** in API build (missing Prisma types)
- Schema drift: Missing exports (ChatRole, LessonType, Level, etc.)
- Prisma.DbNull not exported
- InputJsonValue namespace issues

### P0 Deployment Blockers
- ved-43oq: Deploy API Docker Image to VPS (in_progress)
- ved-949o: Deploy Web Docker Image to VPS (open)
- ved-0jl6: Enrollment Logic - Service Layer (open)
- ved-6yb: Enable Pgvector extension on VPS (in_progress)

## Track 1 (OrangeWave) - Prisma Schema Repair (P0)

**Goal**: Fix all 188 TypeScript errors by regenerating Prisma Client and fixing schema drift

- ved-jgea-t1-1: Verify Prisma schema integrity and enum definitions
- ved-jgea-t1-2: Fix missing exports (ChatRole, LessonType, Level, ProgressStatus, Role)
- ved-jgea-t1-3: Fix Prisma.DbNull and InputJsonValue namespace issues
- ved-jgea-t1-4: Fix QuestionType, BuddyGroupType, PostType exports
- ved-jgea-t1-5: Regenerate Prisma Client and verify all types exported
- ved-jgea-t1-6: Run API build and verify 0 TypeScript errors

**Success Criteria**: `pnpm --filter api build` passes with 0 errors

## Track 2 (BlueSky) - Documentation Cleanup

**Goal**: Complete documentation cleanup (16 open tasks from ved-jgea)

### Phase 1: Move Documentation Files
- ved-23fn: Task 17: Move DevOps documentation
- ved-ai7v: Task 18: Move Beads documentation
- ved-aso1: Task 16: Move testing documentation
- ved-lixs: Task 15: Move database documentation

### Phase 2: Create Structure
- ved-cw16: Task 14: Create complete docs structure
- ved-ehux: Task 12: Create behavioral-design structure
- ved-pdg7: Task 13: Move EdTech test reports

### Phase 3: Extract Patterns
- ved-aww5: Task 10: Extract Hooked Model patterns
- ved-vzx0: Task 9: Extract Nudge Theory patterns
- ved-wxc7: Task 11: Extract Gamification patterns

**Success Criteria**: Root directory has ≤ 25 files (down from 201)

## Track 3 (GreenMountain) - Deployment Preparation

**Goal**: Fix P0 deployment blockers

- ved-43oq: Deploy API Docker Image to VPS (complete in_progress task)
- ved-949o: Deploy Web Docker Image to VPS
- ved-0jl6: Enrollment Logic - Service Layer (webhook handler)
- ved-6yb: Enable Pgvector extension on VPS (complete in_progress task)

**Success Criteria**: API and Web deployed to VPS staging environment

## Track 4 (RedWave) - Verification & Quality Gates

**Goal**: Ensure project integrity post-cleanup

- ved-idst: Task 20: Run test suite verification
- ved-jtxp: Task 19: Update all documentation links
- ved-z9n1: Task 21: Check for broken links
- ved-ucot: Task 22: Final cleanup audit

**Additional Checks**:
- Run `pnpm --filter api build` (must pass)
- Run `pnpm --filter web build` (must pass)
- Run `scripts/quality-gate-ultra-fast.bat` (must pass)
- Verify beads sync works (`beads.exe sync --no-daemon`)

**Success Criteria**: All builds pass, all quality gates green

## Iteration Strategy

### Iterations 1-5: Track 1 (Prisma Schema Repair) - P0 CRITICAL
Focus 100% on fixing TypeScript errors. This blocks everything else.

### Iterations 6-12: Track 2 (Documentation Cleanup)
Parallel execution of documentation tasks while Track 3 starts.

### Iterations 13-18: Track 3 (Deployment Preparation)
Complete deployment blockers in parallel with documentation.

### Iterations 19-25: Track 4 (Verification)
Final validation, testing, and quality gate verification.

## Success Criteria

- [ ] **API Build**: `pnpm --filter api build` passes (0 TypeScript errors)
- [ ] **Web Build**: `pnpm --filter web build` passes
- [ ] **Quality Gates**: All quality gates pass
- [ ] **Documentation**: Root directory has ≤ 25 files
- [ ] **Deployment**: API and Web deployed to VPS staging
- [ ] **Beads**: All ved-jgea tasks closed
- [ ] **Tests**: Test suite verification passes
- [ ] **Links**: No broken documentation links

## Dependencies

- **Track 1** must complete before Track 3 (can't deploy with build errors)
- **Track 2** independent, can run in parallel
- **Track 4** depends on all other tracks completing

## Risk Assessment

### High Risk
- **Prisma schema changes** may break existing code
- **Database migrations** may require manual intervention on VPS

### Medium Risk
- **Documentation moves** may break internal links
- **VPS deployment** may encounter network/permission issues

### Mitigation
- Test Prisma changes locally before committing
- Create checkpoint commits after each track completion
- Use `--no-daemon` flag for beads sync to avoid git conflicts
- Manual verification at each iteration milestone

<promise>READY_FOR_EXECUTION</promise>
