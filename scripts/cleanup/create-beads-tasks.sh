#!/bin/bash
# Beads Task Creation Script for Project Cleanup
# This script creates all 22 cleanup tasks in beads

echo "🔄 Creating Beads tasks for Project Cleanup..."

# EPIC: Project Cleanup
./beads.exe create "EPIC: Comprehensive Project Cleanup" \
  --type epic \
  --priority 1 \
  --tags cleanup,documentation,automation \
  --description "Transform V-EdFinance from 201 root files to 15 core files using AI skills and automation"

# Get epic ID (will be used for dependencies)
EPIC_ID="ved-cleanup-epic"

# ═══════════════════════════════════════════════════════════
# PHASE 1: AI Categorization + Archive (5 hours, 8 tasks)
# ═══════════════════════════════════════════════════════════

echo "📦 Creating Phase 1 tasks..."

./beads.exe create "Audit root directory files" \
  --type task \
  --priority 1 \
  --tags cleanup,phase1,audit \
  --discovered-from "$EPIC_ID" \
  --description "Count and list all .md files in root directory. Expected: 201 files"

./beads.exe create "Create AI categorization engine" \
  --type task \
  --priority 1 \
  --tags cleanup,phase1,ai \
  --discovered-from "$EPIC_ID" \
  --description "Build TypeScript script using Google Gemini API to categorize files into: archive, edtech, testing, database, devops, core, delete"

./beads.exe create "Generate automated move plan" \
  --type task \
  --priority 1 \
  --tags cleanup,phase1,automation \
  --discovered-from "$EPIC_ID" \
  --deps blocks:ved-cleanup-2 \
  --description "Generate PowerShell script from AI categorization output. Include dry-run capability"

./beads.exe create "Create archive directory structure" \
  --type task \
  --priority 1 \
  --tags cleanup,phase1,setup \
  --discovered-from "$EPIC_ID" \
  --description "Create docs/archive/2025-12/{session-reports,test-waves,completion-reports,audits}"

./beads.exe create "Move WAVE reports to archive" \
  --type task \
  --priority 1 \
  --tags cleanup,phase1,archive \
  --discovered-from "$EPIC_ID" \
  --deps blocks:ved-cleanup-4 \
  --description "Archive all WAVE*.md files to docs/archive/2025-12/test-waves/"

./beads.exe create "Move SESSION reports to archive" \
  --type task \
  --priority 1 \
  --tags cleanup,phase1,archive \
  --discovered-from "$EPIC_ID" \
  --deps blocks:ved-cleanup-4 \
  --description "Archive all *HANDOFF*.md, *SESSION*.md, *PROGRESS*.md to docs/archive/2025-12/session-reports/"

./beads.exe create "Move old AUDIT reports to archive" \
  --type task \
  --priority 1 \
  --tags cleanup,phase1,archive \
  --discovered-from "$EPIC_ID" \
  --deps blocks:ved-cleanup-4 \
  --description "Archive old AUDIT*.md, COMPREHENSIVE_AUDIT*.md (keep PROJECT_AUDIT_2026-01-03.md in root)"

./beads.exe create "Verify archive integrity" \
  --type task \
  --priority 1 \
  --tags cleanup,phase1,verification \
  --discovered-from "$EPIC_ID" \
  --deps blocks:ved-cleanup-5,ved-cleanup-6,ved-cleanup-7 \
  --description "Run verification script to ensure all files moved correctly and no orphans remain"

# ═══════════════════════════════════════════════════════════
# PHASE 2: Extract EdTech Knowledge (4 hours, 5 tasks)
# ═══════════════════════════════════════════════════════════

echo "🎓 Creating Phase 2 tasks..."

./beads.exe create "Extract Nudge Theory patterns from SPEC.md" \
  --type task \
  --priority 1 \
  --tags cleanup,phase2,edtech,ai \
  --discovered-from "$EPIC_ID" \
  --deps blocks:ved-cleanup-8 \
  --description "Use Gemini 1.5 Pro to extract Social Proof, Loss Aversion, Framing, Mapping patterns"

./beads.exe create "Extract Hooked Model patterns from SPEC.md" \
  --type task \
  --priority 1 \
  --tags cleanup,phase2,edtech,ai \
  --discovered-from "$EPIC_ID" \
  --deps blocks:ved-cleanup-8 \
  --description "Use Gemini 1.5 Pro to extract Trigger, Action, Variable Reward, Investment patterns"

./beads.exe create "Extract Gamification patterns from SPEC.md" \
  --type task \
  --priority 1 \
  --tags cleanup,phase2,edtech,ai \
  --discovered-from "$EPIC_ID" \
  --deps blocks:ved-cleanup-8 \
  --description "Use Gemini 1.5 Pro to extract Points, Badges, Leaderboards, Commitment Contracts patterns"

./beads.exe create "Create behavioral-design directory structure" \
  --type task \
  --priority 1 \
  --tags cleanup,phase2,setup \
  --discovered-from "$EPIC_ID" \
  --deps blocks:ved-cleanup-9,ved-cleanup-10,ved-cleanup-11 \
  --description "Create docs/behavioral-design/{nudge-theory,hooked-model,gamification,ai-behavioral,test-reports}"

./beads.exe create "Move EdTech test reports" \
  --type task \
  --priority 1 \
  --tags cleanup,phase2,move \
  --discovered-from "$EPIC_ID" \
  --deps blocks:ved-cleanup-12 \
  --description "Move GAMIFICATION_TEST_REPORT.md, LOSS_AVERSION_TEST_REPORT.md, etc. to docs/behavioral-design/test-reports/"

# ═══════════════════════════════════════════════════════════
# PHASE 3: Consolidate Documentation (4 hours, 9 tasks)
# ═══════════════════════════════════════════════════════════

echo "📚 Creating Phase 3 tasks..."

./beads.exe create "Create complete docs directory structure" \
  --type task \
  --priority 1 \
  --tags cleanup,phase3,setup \
  --discovered-from "$EPIC_ID" \
  --deps blocks:ved-cleanup-13 \
  --description "Create docs/{behavioral-design,ai-behavioral,testing,database,beads,devops,git-workflows,ai-testing,archive}"

./beads.exe create "Move database documentation" \
  --type task \
  --priority 1 \
  --tags cleanup,phase3,move \
  --discovered-from "$EPIC_ID" \
  --deps blocks:ved-cleanup-14 \
  --description "Already in docs/, verify structure and update README"

./beads.exe create "Move testing documentation" \
  --type task \
  --priority 1 \
  --tags cleanup,phase3,move \
  --discovered-from "$EPIC_ID" \
  --deps blocks:ved-cleanup-14 \
  --description "Move MASTER_TESTING_PLAN.md, TEST_ENVIRONMENT_GUIDE.md, E2E_TESTING_GUIDE.md, etc. to docs/testing/"

./beads.exe create "Move DevOps documentation" \
  --type task \
  --priority 1 \
  --tags cleanup,phase3,move \
  --discovered-from "$EPIC_ID" \
  --deps blocks:ved-cleanup-14 \
  --description "Move DEVOPS_GUIDE.md, VPS_DEPLOYMENT_GUIDE.md, DEV_SERVER_GUIDE.md to docs/devops/"

./beads.exe create "Move Beads documentation" \
  --type task \
  --priority 1 \
  --tags cleanup,phase3,move \
  --discovered-from "$EPIC_ID" \
  --deps blocks:ved-cleanup-14 \
  --description "Verify BEADS_GUIDE.md stays in root, move BEADS_INTEGRATION_DEEP_DIVE.md to docs/beads/"

./beads.exe create "Update all documentation links" \
  --type task \
  --priority 1 \
  --tags cleanup,phase3,automation \
  --discovered-from "$EPIC_ID" \
  --deps blocks:ved-cleanup-15,ved-cleanup-16,ved-cleanup-17,ved-cleanup-18 \
  --description "Run TypeScript script to update all links in AGENTS.md, SPEC.md, README.md to new paths"

./beads.exe create "Run test suite verification" \
  --type task \
  --priority 1 \
  --tags cleanup,phase3,verification \
  --discovered-from "$EPIC_ID" \
  --deps blocks:ved-cleanup-19 \
  --description "Run pnpm test to ensure 98.7% pass rate maintained after cleanup"

./beads.exe create "Check for broken links" \
  --type task \
  --priority 1 \
  --tags cleanup,phase3,verification \
  --discovered-from "$EPIC_ID" \
  --deps blocks:ved-cleanup-19 \
  --description "Run link checker script to find any broken references"

./beads.exe create "Final cleanup audit" \
  --type task \
  --priority 1 \
  --tags cleanup,phase3,verification \
  --discovered-from "$EPIC_ID" \
  --deps blocks:ved-cleanup-20,ved-cleanup-21 \
  --description "Run beads doctor, verify root has ≤15 .md files, all knowledge preserved, git status clean"

echo ""
echo "✅ Created 22 cleanup tasks in beads!"
echo ""
echo "Next steps:"
echo "1. Run: ./beads.exe ready"
echo "2. Run: ./bv.exe --robot-next"
echo "3. Start with Phase 1 tasks"
