# Execution Plan: Project Cleanup Consolidation

Epic: ved-vpf9
Generated: 2026-01-09

## Objective

Complete remaining cleanup tasks from ved-jgea before continuing feature development.

## Current State Analysis

### Already Completed (Previous Session)
- ✅ Created docs/README.md index
- ✅ Created docs/code-standards.md
- ✅ Created docs/troubleshooting.md
- ✅ Created docs/codebase-summary.md
- ✅ Created docs/deployment/production-checklist.md
- ✅ Archived 38 outdated files to docs/archive/2026-01/
- ✅ Consolidated devops/ → deployment/
- ✅ Closed ved-quwn (Dokploy debugging - VPS offline)
- ✅ Closed ved-cw16, ved-pdg7, ved-ehux

### Remaining Cleanup Tasks (Track M from robot-plan)

| ID | Task | Status | Est. Time |
|----|------|--------|-----------|
| ved-lixs | Move database documentation | open | 15m |
| ved-aso1 | Move testing documentation | open | 30m |
| ved-23fn | Move DevOps documentation | open | 30m |
| ved-ai7v | Move Beads documentation | open | 15m |

### P0 Tasks to Address

| ID | Task | Status |
|----|------|--------|
| ved-1y3c | PHASE-0: Remove Unused Dependencies | open |
| ved-ll5l | PHASE-0: Add BehaviorLog Performance Indexes | open |

## Cleanup Analysis

### docs/database/ - Already Structured ✅
Files present:
- README.md, architecture.md, connection-pool.md, erd.md
- jsonb-schema-audit.md, manual-migration-add-integration-models.md
- migration-dry-run-checklist.md, migration-guide-payment-system.md
- production-master-plan.md, schema-drift-audit-plan.md, schema-fix-guide.md

**Status:** ved-lixs can be closed - database docs already properly organized

### docs/testing/ - Already Structured ✅
Files present:
- README.md, e2e-testing-guide.md, test-coverage-plan.md
- test-environment-guide.md, test-mock-standardization-guide.md
- scenario-generator-test-report.md, stress-test-report.md
- behavior-tracking-test-report.md

**Status:** ved-aso1 can be closed - testing docs already properly organized

### docs/deployment/ - Already Structured ✅
Files present:
- README.md, production-checklist.md, deployment-status.md
- deployment-strategy-comparison.md, dokploy-manual-steps.md
- dokploy-setup-guide.md, service-dependencies.md
- ssh-auth-troubleshooting.md, vps-setup-instructions.md
- VPS_INFO_TEMPLATE.md

**Status:** ved-23fn can be closed - DevOps docs already consolidated into deployment/

### docs/beads/ - Already Structured ✅
Files present:
- README.md, beads-sync-commit-summary.md
- beads-sync-integration-guide.md, beads-sync-ready.md

**Status:** ved-ai7v can be closed - Beads docs already properly organized

## Decision

All 4 cleanup tasks (ved-lixs, ved-aso1, ved-23fn, ved-ai7v) can be CLOSED as the documentation was already moved/organized in the previous session. The tasks were created before the consolidation work was completed.

## Execution Steps

1. Close ved-lixs, ved-aso1, ved-23fn, ved-ai7v with reason "Already completed in previous session"
2. Run quality gate to verify no broken links
3. Close epic ved-vpf9

## P0 Cleanup Tasks

For ved-1y3c (Remove Unused Dependencies) and ved-ll5l (Add Indexes):
- These require actual code changes
- Schedule for next development session
- Not blocking cleanup completion
