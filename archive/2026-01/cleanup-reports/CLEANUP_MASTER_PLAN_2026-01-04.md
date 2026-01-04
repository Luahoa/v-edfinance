# 🧹 V-EdFinance Cleanup Master Plan (Planning + Orchestrator)
**Date:** 2026-01-04  
**Approach:** Dual-Agent Strategy (Planning Agent + Orchestrator Agent)  
**Status:** 🎯 **READY FOR EXECUTION**

---

## 🎯 STRATEGIC APPROACH

### Dual-Agent Architecture
```
┌──────────────────────────────────────────────────────────────┐
│                   CLEANUP DUAL-AGENT SYSTEM                  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  PLANNING AGENT              ORCHESTRATOR AGENT              │
│  ├─ Analyze Structure       ├─ Beads Trinity Control        │
│  ├─ Risk Assessment         ├─ Multi-Agent Coordination     │
│  ├─ Prioritization          ├─ Conflict Prevention          │
│  └─ Success Metrics         └─ Quality Gates                │
│                                                              │
│         ↓                            ↓                       │
│    STRATEGIC PLAN    →     EXECUTION ORCHESTRATION          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 📊 PHASE 0: PRE-CLEANUP ANALYSIS

### Current State Audit (Planning Agent)
```bash
# Root Directory Analysis
Total Files:        201 files (188 .md, 7 .bat, 3 .ps1, 3 .py)
Target:             15 core files
Reduction:          93% (186 files to move/archive)

# Categorization Breakdown
├─ Historical Reports:     47 files (WAVE*, SESSION*, AUDIT*, HANDOFF*)
├─ Test Outputs:          15 files (test_output*, coverage_*, TEST_*)
├─ Automation Scripts:    34 files (INSTALL_*, FIX_*, SETUP_*, RUN_*)
├─ Documentation:         52 files (AI_*, DATABASE_*, BEADS_*, PROJECT_*)
├─ Temp Files:            19 files (temp_*, $null, *.log, *.txt)
├─ Deploy Scripts:         8 files (VPS_*, DEPLOY_*, R2_*)
├─ Core Files (Keep):     15 files (AGENTS.md, SPEC.md, README.md, etc.)
└─ Duplicate/Obsolete:    11 files (superseded docs)
```

### Risk Assessment (Planning Agent)

**🔴 CRITICAL RISKS:**
1. **Test Breakage** - Moving test files could break imports
2. **Broken Links** - Documentation cross-references
3. **Lost Knowledge** - EdTech behavioral patterns scattered across files
4. **Script Dependencies** - Automation scripts reference specific paths

**🟡 MEDIUM RISKS:**
5. **Beads Sync Conflicts** - Multiple agents modifying .beads/
6. **Build Path Changes** - Scripts hardcoded with old paths
7. **Git History Loss** - Large file moves obscure blame

**🟢 LOW RISKS:**
8. **Temp Files** - Safe to delete
9. **Old Reports** - Safe to archive

### Mitigation Strategy (Planning Agent)
```bash
# Pre-Execution Safety Checks
1. ✅ Git commit all current work
2. ✅ Backup to R2: scripts/backup-to-r2.ps1
3. ✅ Create cleanup branch: git checkout -b cleanup/2026-01-04
4. ✅ Run tests baseline: pnpm test > test_baseline.txt
5. ✅ Beads snapshot: bd doctor > beads_snapshot.txt
6. ✅ Build verification: pnpm --filter api build && pnpm --filter web build

# During Execution
7. ✅ Dry-run ALL move operations first
8. ✅ Git commit after EACH phase (atomic commits)
9. ✅ Run tests after EACH phase
10. ✅ Rollback capability: git reset --hard HEAD~1

# Post-Execution
11. ✅ Link verification: npx tsx scripts/cleanup/check-broken-links.ts
12. ✅ Test suite pass: pnpm test
13. ✅ Build verification: pnpm --filter api build && pnpm --filter web build
14. ✅ Beads health: bd doctor
```

---

## 🚀 PHASE 1: ORCHESTRATOR SETUP (1 hour)

### Task: Create Cleanup Orchestration System
**Agent:** Orchestrator Agent  
**Beads Task:** ved-cleanup-orchestrator-setup  

#### 1.1 Beads Trinity Configuration
```bash
# Create all cleanup tasks in beads
./scripts/cleanup/create-cleanup-tasks.sh

# Beads task structure:
ved-cleanup-00-setup         # Setup orchestration (P0)
ved-cleanup-01-archive       # Archive historical reports (P1)
ved-cleanup-02-tests         # Consolidate test outputs (P1)
ved-cleanup-03-scripts       # Organize automation scripts (P1)
ved-cleanup-04-docs          # Documentation consolidation (P2)
ved-cleanup-05-edtech        # Extract EdTech knowledge (P2)
ved-cleanup-06-temp          # Remove temp files (P3)
ved-cleanup-07-links         # Fix broken links (P3)
ved-cleanup-08-verify        # Final verification (P0)
```

#### 1.2 Multi-Agent Coordination (Orchestrator)
```bash
# mcp_agent_mail coordination setup
# Prevent file conflicts during parallel cleanup

# Agent 1: Archive Historical (ved-cleanup-01)
# Agent 2: Test Outputs (ved-cleanup-02) - CAN RUN PARALLEL
# Agent 3: Scripts (ved-cleanup-03) - CAN RUN PARALLEL
# Agent 4: Documentation (ved-cleanup-04) - DEPENDS ON 05
# Agent 5: EdTech Extraction (ved-cleanup-05) - MUST RUN FIRST
# Agent 6: Temp Cleanup (ved-cleanup-06) - CAN RUN PARALLEL
```

**Dependency Graph (Beads Viewer Analysis):**
```
ved-cleanup-00-setup
    ↓
ved-cleanup-05-edtech (CRITICAL PATH - must extract first)
    ↓
ved-cleanup-01-archive ← Parallel → ved-cleanup-02-tests
    ↓                                      ↓
ved-cleanup-03-scripts ← Parallel → ved-cleanup-06-temp
    ↓                                      ↓
ved-cleanup-04-docs (depends on 05)
    ↓
ved-cleanup-07-links
    ↓
ved-cleanup-08-verify
```

---

## 🎯 PHASE 2: ARCHIVE HISTORICAL REPORTS (2 hours)

### Planning Agent: Categorization Rules
```typescript
// scripts/cleanup/categorize-historical.ts
interface HistoricalFile {
  filename: string;
  category: 'wave' | 'session' | 'audit' | 'handoff' | 'report';
  date: string; // Extract from filename
  targetPath: string;
}

const rules = {
  wave: /^WAVE\d+_/i,
  session: /SESSION_|PROGRESS_/i,
  audit: /AUDIT_|PROJECT_AUDIT/i,
  handoff: /HANDOFF_|THREAD_HANDOFF/i,
  report: /REPORT_|COMPLETION_|STATUS_/i
};

// Archive structure
const archiveStructure = {
  'docs/archive/2025-12/wave-reports/': ['WAVE*.md'],
  'docs/archive/2025-12/session-reports/': ['SESSION*.md', 'PROGRESS*.md'],
  'docs/archive/2026-01/audit-reports/': ['AUDIT*.md', 'PROJECT_AUDIT*.md'],
  'docs/archive/2026-01/thread-handoffs/': ['HANDOFF*.md', 'THREAD_HANDOFF*.md'],
  'docs/archive/2026-01/completion-reports/': ['*_COMPLETION_*.md', '*_STATUS_*.md']
};
```

### Orchestrator Agent: Execution Plan
```bash
# Beads Task: ved-cleanup-01-archive
# Priority: P1
# Estimated: 2 hours
# Dependencies: ved-cleanup-00-setup

# Step 1: Create archive structure (10 min)
mkdir -p docs/archive/2025-12/{wave-reports,session-reports}
mkdir -p docs/archive/2026-01/{audit-reports,thread-handoffs,completion-reports}

# Step 2: Categorize files (30 min - AI-powered)
npx tsx scripts/cleanup/categorize-historical.ts > archive-plan.json

# Step 3: Dry-run move (10 min)
npx tsx scripts/cleanup/execute-archive-plan.ts --dry-run

# Step 4: Review output (10 min)
# Human review of dry-run results

# Step 5: Execute move (30 min)
npx tsx scripts/cleanup/execute-archive-plan.ts --execute

# Step 6: Update links (20 min)
npx tsx scripts/cleanup/update-archive-links.ts

# Step 7: Verify (10 min)
pnpm test
git add -A && git commit -m "chore: Archive historical reports (ved-cleanup-01)"
```

**Files to Archive (47 total):**
```
# Wave Reports (12 files)
WAVE4_BATCH4_INSTALL_AND_RUN.bat
(... other WAVE files ...)

# Session/Progress Reports (15 files)
THREAD_HANDOFF_2026-01-03.md
THREAD_HANDOFF_UI_UX_COMPLETE.md
THREAD_HANDOFF_WEEK2_MVP_AUTH_SECURITY.md
(... other SESSION files ...)

# Audit Reports (8 files)
PROJECT_AUDIT_2026-01-03.md
PROJECT_AUDIT_FINAL_2026-01-03.md
CLEANUP_EXECUTION_COMPLETE_2026-01-03.md
(... other AUDIT files ...)

# Completion Reports (12 files)
MVP_LAUNCH_FINAL_REPORT_2026-01-03.md
PHASE0_COMPLETION_REPORT.md
CLEANUP_COMPLETE_FINAL_REPORT.md
(... other COMPLETION files ...)
```

---

## 📊 PHASE 3: CONSOLIDATE TEST OUTPUTS (1 hour)

### Planning Agent: Test File Analysis
```bash
# Test Output Files (15 files)
test_output.txt
test_output_current.txt
test_output_latest.txt
test_output_final.txt
test_output_post_fix.txt
test_output_debug.txt
test_output_debug_2.txt
test_output_debug_3.txt
test_output_sm0_analysis.txt
test_output_ved9yx.txt
test_failures_only.txt
coverage_output.txt
coverage_summary.txt
coverage_extract.txt
coverage_full_output.txt

# Target Structure
test-results/
├─ unit/
│  ├─ latest/
│  │  └─ test_output_2026-01-04.txt
│  └─ archive/
│     ├─ test_output_2026-01-03.txt
│     └─ test_output_ved9yx.txt
├─ coverage/
│  ├─ latest/
│  │  └─ coverage_summary_2026-01-04.txt
│  └─ archive/
│     └─ coverage_full_output_2026-01-03.txt
└─ analysis/
   ├─ test_failures_only.txt
   └─ test_output_sm0_analysis.txt
```

### Orchestrator Agent: Execution
```bash
# Beads Task: ved-cleanup-02-tests
# Priority: P1
# Estimated: 1 hour
# Dependencies: ved-cleanup-00-setup
# Can run PARALLEL with ved-cleanup-01-archive

# Step 1: Create structure (5 min)
mkdir -p test-results/{unit,coverage,analysis}/{latest,archive}

# Step 2: Categorize and move (30 min)
npx tsx scripts/cleanup/consolidate-test-outputs.ts

# Step 3: Update .gitignore (5 min)
echo "test-results/latest/*" >> .gitignore

# Step 4: Verify tests still pass (15 min)
pnpm test

# Step 5: Commit (5 min)
git add -A && git commit -m "chore: Consolidate test outputs (ved-cleanup-02)"
```

---

## 🛠️ PHASE 4: ORGANIZE AUTOMATION SCRIPTS (2 hours)

### Planning Agent: Script Categorization
```bash
# Automation Scripts (34 files)

# Category 1: Setup/Install (12 files)
INSTALL_AI_SKILLS.bat
INSTALL_AI_SKILLS.ps1
INSTALL_COMMAND_SUITE_COMPLETE.ps1
INSTALL_DEVOPS_TOOLS.bat
INSTALL_R2_DEPENDENCIES.bat
INSTALL_RCLONE.bat
INSTALL_TO_AGENTS.ps1
QUICK_INSTALL_SKILLS.ps1
SIMPLE_INSTALL.ps1
SETUP_DATABASE.bat
SETUP_PROJECT.bat
COMPLETE_SETUP.bat

# Category 2: Fix/Repair (10 files)
FIX_AND_START.bat
FIX_DATABASE_URL.bat
FIX_DUPLICATE_NEXTJS.bat
FIX_MIGRATIONS.bat
FIX_P0_BLOCKERS.bat
FIX_PORT_CONFLICT.bat
FIX_POSTGRES.bat
FIX_PRIORITY_1.bat
FORCE_DB_SYNC.bat
NUCLEAR_RESET.bat

# Category 3: Test/Verify (6 files)
RUN_TESTS.bat
RUN_SEED_TESTS.bat
RUN_ACCEPTANCE_TESTS.bat
RUN_BENCHMARK_TESTS.bat
VERIFY_CLI_TOOLS.bat
VERIFY_SECURITY_FIX.bat

# Category 4: Deployment (8 files)
VPS_DEPLOY_NOW.bat
VPS_ENABLE_PGVECTOR.bat
VPS_ENABLE_PGVECTOR.ps1
AMPHITHEATRE_DEPLOY.ps1
AMPHITHEATRE_DEPLOY_SIMPLE.ps1
R2_AUTO_SETUP.bat
R2_SYNC.bat
START_DEV.bat
```

### Orchestrator Agent: Target Structure
```bash
scripts/
├─ setup/
│  ├─ install-ai-skills.bat
│  ├─ install-dependencies.bat
│  ├─ setup-database.bat
│  └─ complete-setup.bat
├─ fix/
│  ├─ fix-database.bat
│  ├─ fix-migrations.bat
│  ├─ fix-build.bat
│  └─ nuclear-reset.bat
├─ test/
│  ├─ run-tests.bat
│  ├─ run-e2e.bat
│  └─ verify-quality.bat
├─ deploy/
│  ├─ vps-deploy.bat
│  ├─ cloudflare-deploy.ps1
│  └─ r2-sync.bat
└─ cleanup/ (NEW)
   ├─ ai-categorizer.ts
   ├─ consolidate-test-outputs.ts
   └─ execute-archive-plan.ts
```

### Execution
```bash
# Beads Task: ved-cleanup-03-scripts
# Priority: P1
# Estimated: 2 hours
# Dependencies: ved-cleanup-00-setup
# Can run PARALLEL with ved-cleanup-01, ved-cleanup-02

# Step 1: Create structure (5 min)
mkdir -p scripts/{setup,fix,test,deploy,cleanup}

# Step 2: Move and rename (60 min - careful!)
# Must update internal references
npx tsx scripts/cleanup/reorganize-scripts.ts --dry-run
npx tsx scripts/cleanup/reorganize-scripts.ts --execute

# Step 3: Update AGENTS.md references (30 min)
# Update all script paths in documentation

# Step 4: Test critical scripts (20 min)
./scripts/test/run-tests.bat
./scripts/setup/complete-setup.bat --dry-run

# Step 5: Commit (5 min)
git add -A && git commit -m "refactor: Reorganize automation scripts (ved-cleanup-03)"
```

---

## 📚 PHASE 5: EXTRACT EDTECH KNOWLEDGE (4 hours)

### Planning Agent: Knowledge Extraction Strategy

**CRITICAL:** This MUST run BEFORE docs consolidation (ved-cleanup-04)

**Source Files (52 documentation files):**
```
AI_SYSTEM_OPTIMIZATION_MASTERPLAN.md
AI_SYSTEM_OPTIMIZATION_REVISED.md
DATABASE_PRODUCTION_MASTER_PLAN.md
SPEC.md (Section 12: Behavioral Design)
```

**EdTech Concepts to Extract:**
1. Nudge Theory (Richard Thaler)
2. Hooked Model (Nir Eyal)
3. Gamification Patterns
4. Social Proof
5. Loss Aversion
6. Framing
7. Investment Loop

### Orchestrator Agent: Extraction Plan
```bash
# Beads Task: ved-cleanup-05-edtech
# Priority: P2 (MUST RUN BEFORE ved-cleanup-04)
# Estimated: 4 hours
# Dependencies: ved-cleanup-00-setup

# Step 1: Create behavioral design structure (15 min)
mkdir -p docs/behavioral-design/{nudge,hooked,gamification,patterns}

# Step 2: AI-powered extraction (2 hours)
# Using Gemini API to extract and consolidate knowledge
npx tsx scripts/cleanup/extract-edtech-knowledge.ts

# Generated files:
docs/behavioral-design/
├─ README.md (Overview)
├─ nudge/
│  ├─ social-proof.md
│  ├─ loss-aversion.md
│  ├─ framing.md
│  └─ mapping.md
├─ hooked/
│  ├─ trigger-design.md
│  ├─ action-simplification.md
│  ├─ variable-rewards.md
│  └─ investment-loop.md
├─ gamification/
│  ├─ progression-systems.md
│  ├─ achievement-design.md
│  └─ leaderboards.md
└─ patterns/
   ├─ financial-literacy-patterns.md
   └─ engagement-metrics.md

# Step 3: Validate extraction (30 min)
# Human review of generated docs

# Step 4: Update SPEC.md (60 min)
# Replace Section 12 with references to docs/behavioral-design/

# Step 5: Commit (30 min)
git add -A && git commit -m "docs: Extract EdTech behavioral design knowledge (ved-cleanup-05)"
```

**AI Extraction Script:**
```typescript
// scripts/cleanup/extract-edtech-knowledge.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

async function extractEdTechKnowledge() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  // Read source files
  const specMd = fs.readFileSync('SPEC.md', 'utf-8');
  const aiMasterplan = fs.readFileSync('AI_SYSTEM_OPTIMIZATION_MASTERPLAN.md', 'utf-8');

  const prompt = `
Extract ALL behavioral design knowledge from these V-EdFinance documents:

SPEC.md Section 12:
${specMd.split('## 12. Behavioral Design')[1]}

AI Optimization Plan:
${aiMasterplan}

Extract into structured Markdown:
1. Nudge Theory patterns (Social Proof, Loss Aversion, Framing, Mapping)
2. Hooked Model implementation (Trigger, Action, Reward, Investment)
3. Gamification systems (Progression, Achievements, Leaderboards)
4. EdTech-specific patterns (Financial literacy, Engagement metrics)

Generate separate .md files for each concept with:
- Overview
- Implementation details
- Code examples (if available)
- Metrics/KPIs
- V-EdFinance specific applications

Format: Clean Markdown with code blocks, diagrams (Mermaid if applicable)
`;

  const result = await model.generateContent(prompt);
  const extractedKnowledge = result.response.text();

  // Parse and save to files
  // (Implementation details...)
  
  return extractedKnowledge;
}
```

---

## 📖 PHASE 6: CONSOLIDATE DOCUMENTATION (3 hours)

### Planning Agent: Documentation Structure
```bash
# Current State: 52+ documentation files scattered in root
# Target State: Organized docs/ hierarchy

docs/
├─ README.md (Navigation hub)
├─ architecture/
│  ├─ ARCHITECTURE.md (existing)
│  ├─ triple-orm-strategy.md
│  └─ monorepo-structure.md
├─ database/
│  ├─ DATABASE_PRODUCTION_MASTER_PLAN.md
│  ├─ PRISMA_DRIZZLE_HYBRID_STRATEGY.md
│  ├─ schema-drift-prevention.md
│  └─ query-optimization.md
├─ testing/
│  ├─ TEST_COVERAGE_BASELINE.md
│  ├─ ai-testing-army.md
│  ├─ e2e-testing-guide.md
│  └─ stress-testing.md
├─ devops/
│  ├─ vps-deployment.md
│  ├─ cloudflare-deployment.md
│  ├─ monitoring-setup.md
│  └─ docker-compose-guide.md
├─ beads/
│  ├─ BEADS_GUIDE.md
│  ├─ BEADS_VIEWER_WORKFLOW_GUIDE.md
│  ├─ beads-trinity-architecture.md
│  └─ multi-agent-protocol.md
├─ behavioral-design/ (from Phase 5)
│  └─ (EdTech knowledge)
├─ archive/ (from Phase 2)
│  └─ (Historical reports)
└─ contributing/
   ├─ zero-debt-protocol.md
   ├─ agent-commit-protocol.md
   └─ quality-gates.md
```

### Orchestrator Agent: Execution
```bash
# Beads Task: ved-cleanup-04-docs
# Priority: P2
# Estimated: 3 hours
# Dependencies: ved-cleanup-05-edtech (MUST COMPLETE FIRST)

# Step 1: Create structure (10 min)
mkdir -p docs/{architecture,database,testing,devops,beads,contributing}

# Step 2: Categorize docs (AI-powered, 60 min)
npx tsx scripts/cleanup/categorize-docs.ts

# Step 3: Move files (dry-run, 20 min)
npx tsx scripts/cleanup/move-docs.ts --dry-run

# Step 4: Review plan (20 min)
# Human review

# Step 5: Execute move (30 min)
npx tsx scripts/cleanup/move-docs.ts --execute

# Step 6: Update all cross-references (60 min)
npx tsx scripts/cleanup/update-doc-links.ts

# Step 7: Create docs/README.md (20 min)
# Navigation hub for all documentation

# Step 8: Commit (10 min)
git add -A && git commit -m "docs: Consolidate documentation (ved-cleanup-04)"
```

---

## 🧹 PHASE 7: CLEANUP TEMP FILES (30 min)

### Planning Agent: Temp File Identification
```bash
# Safe to Delete (19 files)
$null
temp_*.ts
temp_*.txt
*.log (except critical logs)
api_build_success.txt
audit-root-files.txt
categorization.json
git-status-raw.txt
move-execution.log
remove_duplicates.py
update_schema.py
go_installer.msi
routes.txt
security-audit.json
test-r2-upload.txt
test-upload.txt
```

### Orchestrator Agent: Execution
```bash
# Beads Task: ved-cleanup-06-temp
# Priority: P3
# Estimated: 30 min
# Dependencies: ved-cleanup-00-setup
# Can run PARALLEL with other phases

# Step 1: List temp files (5 min)
npx tsx scripts/cleanup/list-temp-files.ts

# Step 2: Confirm deletion (5 min)
# Human review

# Step 3: Delete (10 min)
npx tsx scripts/cleanup/delete-temp-files.ts

# Step 4: Update .gitignore (5 min)
# Add patterns to prevent future temp file commits

# Step 5: Commit (5 min)
git add -A && git commit -m "chore: Remove temporary files (ved-cleanup-06)"
```

---

## 🔗 PHASE 8: FIX BROKEN LINKS (2 hours)

### Planning Agent: Link Analysis
```bash
# Link Categories to Update:
1. Documentation cross-references (SPEC.md, AGENTS.md, README.md)
2. Script references in AGENTS.md
3. Archive links in new docs/archive/
4. Beads task references
5. GitHub issue links
```

### Orchestrator Agent: Execution
```bash
# Beads Task: ved-cleanup-07-links
# Priority: P3
# Estimated: 2 hours
# Dependencies: ved-cleanup-01, ved-cleanup-04 (docs must be moved first)

# Step 1: Scan all markdown files (20 min)
npx tsx scripts/cleanup/scan-broken-links.ts > broken-links-report.txt

# Step 2: Auto-fix (60 min)
npx tsx scripts/cleanup/auto-fix-links.ts

# Step 3: Manual review (30 min)
# Review broken-links-report.txt
# Fix any links auto-fix couldn't handle

# Step 4: Verify (10 min)
npx tsx scripts/cleanup/verify-all-links.ts

# Step 5: Commit (10 min)
git add -A && git commit -m "docs: Fix broken links after reorganization (ved-cleanup-07)"
```

---

## ✅ PHASE 9: FINAL VERIFICATION (1 hour)

### Orchestrator Agent: Quality Gates
```bash
# Beads Task: ved-cleanup-08-verify
# Priority: P0 (CRITICAL)
# Estimated: 1 hour
# Dependencies: ALL other tasks

# Step 1: Root file count (5 min)
ls -1 *.md | wc -l  # Must be ≤ 15

# Step 2: Test suite (20 min)
pnpm test
# Must pass: 98.7%+ (1811/1834)

# Step 3: Build verification (15 min)
pnpm --filter api build
pnpm --filter web build
# Must pass: 0 errors

# Step 4: Link verification (10 min)
npx tsx scripts/cleanup/verify-all-links.ts
# Must pass: 0 broken links

# Step 5: Beads health (5 min)
bd doctor
# Must pass: All checks green

# Step 6: Generate final report (5 min)
npx tsx scripts/cleanup/generate-final-report.ts

# Step 7: Close all cleanup tasks (10 min)
bd close ved-cleanup-01 --reason "Archive complete"
bd close ved-cleanup-02 --reason "Test outputs consolidated"
# ... (close all 8 tasks)

# Step 8: Sync and push (10 min)
bd sync
git push origin cleanup/2026-01-04
# Create PR: "Project Cleanup - 93% Root Reduction"
```

---

## 📊 SUCCESS METRICS

### Quantitative Targets
```
✅ Root Directory:     201 → 15 files (93% reduction)
✅ Test Suite:         98.7%+ passing (maintained)
✅ Build Health:       0 errors (maintained)
✅ Broken Links:       0 (all fixed)
✅ EdTech Knowledge:   100% preserved
✅ Execution Time:     15 hours (3 sessions)
```

### Qualitative Targets
```
✅ Organized structure (docs/, scripts/, test-results/)
✅ Zero knowledge loss (EdTech patterns preserved)
✅ Beads Trinity operational (all tasks tracked)
✅ Zero-Debt compliance (quality gates passed)
✅ Multi-agent coordination (no conflicts)
```

---

## 🎯 BEADS TASK SUMMARY

### Task Creation Commands
```bash
# Phase 0: Setup
bd create "Setup cleanup orchestration system" \
  --type task --priority 0 --tags cleanup,orchestrator

# Phase 1: Archive
bd create "Archive historical reports (47 files)" \
  --type task --priority 1 --tags cleanup,archive --deps blocks:ved-cleanup-00-setup

# Phase 2: Tests
bd create "Consolidate test outputs (15 files)" \
  --type task --priority 1 --tags cleanup,tests --deps blocks:ved-cleanup-00-setup

# Phase 3: Scripts
bd create "Reorganize automation scripts (34 files)" \
  --type task --priority 1 --tags cleanup,scripts --deps blocks:ved-cleanup-00-setup

# Phase 4: EdTech (CRITICAL PATH)
bd create "Extract EdTech behavioral design knowledge" \
  --type task --priority 2 --tags cleanup,edtech --deps blocks:ved-cleanup-00-setup

# Phase 5: Docs
bd create "Consolidate documentation (52 files)" \
  --type task --priority 2 --tags cleanup,docs --deps blocks:ved-cleanup-05-edtech

# Phase 6: Temp
bd create "Remove temporary files (19 files)" \
  --type task --priority 3 --tags cleanup,temp --deps blocks:ved-cleanup-00-setup

# Phase 7: Links
bd create "Fix broken links after reorganization" \
  --type task --priority 3 --tags cleanup,links --deps blocks:ved-cleanup-01,ved-cleanup-04

# Phase 8: Verify
bd create "Final verification and quality gates" \
  --type task --priority 0 --tags cleanup,verify --deps blocks:ved-cleanup-01,ved-cleanup-02,ved-cleanup-03,ved-cleanup-04,ved-cleanup-05,ved-cleanup-06,ved-cleanup-07
```

### Task Dependency Graph
```
ved-cleanup-00-setup (P0)
    ↓
    ├─→ ved-cleanup-05-edtech (P2) ← CRITICAL PATH
    │       ↓
    │   ved-cleanup-04-docs (P2)
    │
    ├─→ ved-cleanup-01-archive (P1) ← PARALLEL
    ├─→ ved-cleanup-02-tests (P1) ← PARALLEL
    ├─→ ved-cleanup-03-scripts (P1) ← PARALLEL
    └─→ ved-cleanup-06-temp (P3) ← PARALLEL
    
    ↓ (All converge)
    
ved-cleanup-07-links (P3)
    ↓
ved-cleanup-08-verify (P0)
```

---

## 🚨 RISK MITIGATION CHECKLIST

### Pre-Execution Safety
- [ ] ✅ Git commit all current work
- [ ] ✅ Backup to R2: `scripts/backup-to-r2.ps1`
- [ ] ✅ Create branch: `git checkout -b cleanup/2026-01-04`
- [ ] ✅ Test baseline: `pnpm test > test_baseline.txt`
- [ ] ✅ Beads snapshot: `bd doctor > beads_snapshot.txt`
- [ ] ✅ Build baseline: `pnpm build`

### During Execution Safety
- [ ] ✅ Dry-run EVERY move operation
- [ ] ✅ Git commit after EACH phase
- [ ] ✅ Run tests after EACH phase
- [ ] ✅ Beads update after EACH task

### Post-Execution Safety
- [ ] ✅ Link verification: 0 broken links
- [ ] ✅ Test suite: 98.7%+ passing
- [ ] ✅ Build verification: 0 errors
- [ ] ✅ Beads health: All checks green
- [ ] ✅ Final report generated

### Rollback Plan
```bash
# If ANY phase fails:
git reset --hard HEAD~1  # Rollback last commit
pnpm test                # Verify tests still pass
bd doctor                # Verify beads health

# If multiple phases fail:
git checkout main
git branch -D cleanup/2026-01-04
# Start over with lessons learned
```

---

## 📋 SESSION EXECUTION PLAN

### Session 1: Setup + Archive + Tests (5 hours)
```bash
# Hour 1: Orchestrator Setup
- Create all beads tasks (ved-cleanup-00 to ved-cleanup-08)
- Setup multi-agent coordination (mcp_agent_mail)
- Create cleanup branch
- Pre-execution safety checks

# Hour 2-3: Archive Historical (Parallel Agent 1)
- Create archive structure
- AI categorization of 47 files
- Dry-run move
- Execute move
- Update links
- Commit

# Hour 2-3: Consolidate Tests (Parallel Agent 2)
- Create test-results structure
- Move 15 test output files
- Update .gitignore
- Run tests to verify
- Commit

# Hour 4: Scripts Reorganization (Agent 3)
- Create scripts/ subdirectories
- Move 34 automation scripts
- Update AGENTS.md references
- Test critical scripts
- Commit

# Hour 5: Session 1 Verification
- Run full test suite
- Verify builds
- Beads sync
- Git push
```

### Session 2: EdTech + Docs (6 hours)
```bash
# Hour 1-4: Extract EdTech Knowledge (CRITICAL)
- Create docs/behavioral-design/ structure
- AI-powered extraction from SPEC.md
- Generate 15+ EdTech documentation files
- Validate extraction
- Update SPEC.md references
- Commit

# Hour 5-6: Consolidate Documentation
- Create docs/ structure
- AI categorization of 52 doc files
- Move to appropriate subdirectories
- Update cross-references
- Create docs/README.md navigation
- Commit

# Verification
- Run tests
- Verify builds
- Beads sync
- Git push
```

### Session 3: Final Cleanup + Verification (4 hours)
```bash
# Hour 1: Temp Files + Links (Parallel)
- Delete 19 temp files
- Scan for broken links
- Auto-fix links
- Manual review

# Hour 2: Final Link Verification
- Verify all markdown links
- Fix any remaining broken links
- Update AGENTS.md, SPEC.md, README.md

# Hour 3: Final Verification (Quality Gates)
- Root file count check
- Full test suite run
- Full build verification
- Link verification
- Beads health check

# Hour 4: Cleanup Completion
- Generate final report
- Close all 8 beads tasks
- Beads sync
- Create PR
- Merge to main
- Celebrate! 🎉
```

---

## 🎖️ FINAL DELIVERABLES

### Code Deliverables
1. ✅ Root directory: 15 core files
2. ✅ docs/ organized hierarchy
3. ✅ scripts/ organized by category
4. ✅ test-results/ structure
5. ✅ docs/behavioral-design/ (EdTech knowledge)
6. ✅ docs/archive/ (historical reports)

### Documentation Deliverables
1. ✅ CLEANUP_FINAL_REPORT_2026-01-04.md
2. ✅ docs/README.md (navigation hub)
3. ✅ Updated AGENTS.md (new paths)
4. ✅ Updated SPEC.md (EdTech references)
5. ✅ Updated README.md (new structure)

### Quality Deliverables
1. ✅ Test suite: 98.7%+ passing
2. ✅ Builds: 0 errors
3. ✅ Links: 0 broken
4. ✅ Beads: All tasks closed
5. ✅ Git: Clean history, atomic commits

---

**Created:** 2026-01-04  
**Planning Agent:** Strategic Analysis + Risk Assessment  
**Orchestrator Agent:** Beads Trinity Coordination + Multi-Agent Orchestration  
**Total Effort:** 15 hours (3 sessions)  
**Expected Reduction:** 201 → 15 files (93%)  
**Status:** 🎯 **READY FOR EXECUTION**
