# 🧹 Comprehensive Project Cleanup Plan
**Date:** 2026-01-03 05:00  
**Authority:** Strategic cleanup using ALL available skills and libraries  
**Status:** 🎯 **READY FOR EXECUTION**

---

## 📋 EXECUTIVE SUMMARY

### Mission
Transform V-EdFinance from **201 root files** to **15 core files** while preserving 100% knowledge using automation, AI skills, and Beads Trinity orchestration.

### Strategy
```
┌─────────────────────────────────────────────────────────────┐
│              CLEANUP AUTOMATION PIPELINE                    │
├─────────────────────────────────────────────────────────────┤
│  AI Skills → Beads Trinity → Automation Scripts → Deploy   │
│     ↓              ↓               ↓                ↓       │
│  Categorize    Orchestrate     Execute         Verify      │
└─────────────────────────────────────────────────────────────┘
```

### Resources Allocated
- **50+ AI Skills** - Intelligent categorization
- **Beads Trinity** - Task orchestration (bd + bv + mcp_agent_mail)
- **40+ DevOps Scripts** - Automation
- **Testing Ecosystem** - Verification (98.7% pass rate)
- **Database Tools** - Data migration

---

## 🎯 OBJECTIVES & SUCCESS METRICS

### Quantitative Goals
```
Root Directory:     201 files → 15 files (93% reduction)
Documentation:      Consolidated into 7 categories
EdTech Knowledge:   100% preserved (zero loss)
Skills Libraries:   50+ preserved (zero deletion)
Historical Reports: Archived systematically
Execution Time:     12-15 hours (3 sessions)
```

### Qualitative Goals
- ✅ AI-powered intelligent categorization
- ✅ Automated file movement using scripts
- ✅ Beads Trinity orchestration for multi-agent coordination
- ✅ Zero-Debt compliance maintained
- ✅ All skills accessible via clear structure

---

## 🛠️ RESOURCE ALLOCATION MAP

### Phase 1: AI-Powered Categorization (3 hours)
**Skills Used:**
- ✅ **n8n-workflow-patterns** - Automation workflow design
- ✅ **devops-toolkit-ai** - File classification automation
- ✅ **langchain-devops-templates** - LLM-powered categorization
- ✅ **amphitheatre-agent-framework** - Multi-agent orchestration

**Scripts Used:**
- ✅ `scripts/audit/` - File audit tools
- ✅ Custom classification script (to be created)

**Beads Tasks:**
- ved-cleanup-1: Audit root directory files
- ved-cleanup-2: AI categorization engine
- ved-cleanup-3: Generate move plan

---

### Phase 2: Archive Historical (2 hours)
**Skills Used:**
- ✅ **database-reliability-engineering** - Archive structure design
- ✅ **devops-awesome-rules** - Best practices

**Scripts Used:**
- ✅ Custom archive script (batch file movement)
- ✅ `scripts/verify-all.sh` - Verification

**Beads Tasks:**
- ved-cleanup-4: Create archive structure
- ved-cleanup-5: Move WAVE reports
- ved-cleanup-6: Move SESSION reports
- ved-cleanup-7: Move AUDIT reports
- ved-cleanup-8: Verify archive integrity

---

### Phase 3: Extract EdTech Knowledge (4 hours)
**Skills Used:**
- ✅ **ai-integration-gemini** - AI-powered extraction
- ✅ **edtech-monorepo-init** - EdTech patterns
- ✅ **prisma-edtech-schema** - Database patterns

**Scripts Used:**
- ✅ Custom extraction script (Gemini API)
- ✅ Markdown generation

**Beads Tasks:**
- ved-cleanup-9: Extract Nudge Theory patterns
- ved-cleanup-10: Extract Hooked Model patterns
- ved-cleanup-11: Extract Gamification patterns
- ved-cleanup-12: Create behavioral-design/ structure
- ved-cleanup-13: Move test reports

---

### Phase 4: Consolidate Documentation (3 hours)
**Skills Used:**
- ✅ **devops-toolkit-ai** - Documentation organization
- ✅ **database-reliability-engineering** - Database docs structure

**Scripts Used:**
- ✅ Batch move scripts
- ✅ Link update automation

**Beads Tasks:**
- ved-cleanup-14: Create docs/ structure
- ved-cleanup-15: Move database docs
- ved-cleanup-16: Move testing docs
- ved-cleanup-17: Move DevOps docs
- ved-cleanup-18: Move beads docs

---

### Phase 5: Automated Verification (1 hour)
**Skills Used:**
- ✅ **Testing ecosystem** (Vitest, Playwright, Bats)
- ✅ **query-optimizer-ai** - Link validation

**Scripts Used:**
- ✅ `scripts/verify-all.sh` - Full verification
- ✅ `scripts/quality-gate.sh` - Quality gates
- ✅ Custom link checker

**Beads Tasks:**
- ved-cleanup-19: Verify all links
- ved-cleanup-20: Run test suite
- ved-cleanup-21: Check broken references
- ved-cleanup-22: Final audit

---

## 📊 DETAILED EXECUTION PLAN

### SESSION 1: AI Categorization + Archive (5 hours)

#### Step 1.1: Create Categorization AI Agent (1 hour)
**Using:**
- `ai-integration-gemini.md` skill
- `langchain-devops-templates.md` skill
- Google Gemini 2.0 Flash API (FREE)

**Script to Create:**
```typescript
// scripts/cleanup/ai-categorizer.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

interface FileCategory {
  filename: string;
  category: 'archive' | 'edtech' | 'testing' | 'database' | 'devops' | 'core' | 'delete';
  reason: string;
  targetPath: string;
}

async function categorizeFiles(files: string[]): Promise<FileCategory[]> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = `
Categorize these V-EdFinance documentation files:

Rules:
1. ARCHIVE: WAVE reports, SESSION/PROGRESS/HANDOFF files, old AUDIT reports
2. EDTECH: Behavioral design (NUDGE, HOOKED, GAMIFICATION, SOCIAL_PROOF, LOSS_AVERSION)
3. TESTING: TEST_*, COVERAGE_*, E2E_*, STRESS_*
4. DATABASE: DATABASE_*, PRISMA_*, DRIZZLE_*, KYSELY_*
5. DEVOPS: DEVOPS_*, VPS_*, DEPLOYMENT_*, DOCKER_*
6. CORE: AGENTS.md, SPEC.md, README.md, PROJECT_AUDIT_*, STRATEGIC_*
7. DELETE: Superseded/duplicate files

Files to categorize:
${files.join('\n')}

Return JSON array of FileCategory objects.
`;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}
```

**Beads Task:** `ved-cleanup-2`

---

#### Step 1.2: Generate Move Plan (30 min)
**Using:**
- AI categorization output
- `n8n-workflow-patterns` skill (automation design)

**Script to Create:**
```typescript
// scripts/cleanup/generate-move-plan.ts
interface MovePlan {
  source: string;
  destination: string;
  action: 'move' | 'delete';
}

function generateMovePlan(categories: FileCategory[]): MovePlan[] {
  return categories.map(file => ({
    source: file.filename,
    destination: file.category === 'delete' ? '' : file.targetPath,
    action: file.category === 'delete' ? 'delete' : 'move'
  }));
}

// Generate PowerShell script
function generatePowerShellScript(plan: MovePlan[]): string {
  const moves = plan.filter(p => p.action === 'move')
    .map(p => `Move-Item "${p.source}" "${p.destination}"`)
    .join('\n');
  
  const deletes = plan.filter(p => p.action === 'delete')
    .map(p => `Remove-Item "${p.source}"`)
    .join('\n');

  return `
# Auto-generated cleanup script
# Generated: ${new Date().toISOString()}

${moves}

${deletes}
`;
}
```

**Beads Task:** `ved-cleanup-3`

---

#### Step 1.3: Create Archive Structure (30 min)
**Using:**
- `database-reliability-engineering.md` (archive best practices)

**Directory Structure:**
```
docs/archive/
├── 2025-12/
│   ├── session-reports/     # HANDOFF, SESSION, PROGRESS
│   ├── test-waves/          # WAVE1-5 reports
│   ├── completion-reports/  # VED-XXX completion
│   └── audits/              # Old AUDIT reports
└── 2026-01/
    └── (future archives)
```

**Script:**
```powershell
# scripts/cleanup/create-archive-structure.ps1
$baseDir = "docs/archive"

# Create 2025-12 structure
New-Item -ItemType Directory -Force -Path "$baseDir/2025-12/session-reports"
New-Item -ItemType Directory -Force -Path "$baseDir/2025-12/test-waves"
New-Item -ItemType Directory -Force -Path "$baseDir/2025-12/completion-reports"
New-Item -ItemType Directory -Force -Path "$baseDir/2025-12/audits"

# Create 2026-01 structure
New-Item -ItemType Directory -Force -Path "$baseDir/2026-01"

Write-Host "✅ Archive structure created"
```

**Beads Task:** `ved-cleanup-4`

---

#### Step 1.4: Execute Archive Move (2 hours)
**Using:**
- PowerShell automation
- `devops-toolkit-ai.md` (safe file operations)

**Script:**
```powershell
# scripts/cleanup/execute-archive-move.ps1
param(
    [string]$DryRun = "true"  # Safety: dry-run first
)

$archiveBase = "docs/archive/2025-12"

# Archive WAVE reports
$waveFiles = Get-ChildItem -Filter "WAVE*.md"
foreach ($file in $waveFiles) {
    $dest = "$archiveBase/test-waves/$($file.Name)"
    if ($DryRun -eq "false") {
        Move-Item $file.FullName $dest
        Write-Host "✅ Moved: $($file.Name) → test-waves/"
    } else {
        Write-Host "🔍 Would move: $($file.Name) → test-waves/"
    }
}

# Archive SESSION/PROGRESS/HANDOFF reports
$sessionFiles = Get-ChildItem -Filter "*HANDOFF*.md", "*SESSION*.md", "*PROGRESS*.md"
foreach ($file in $sessionFiles) {
    $dest = "$archiveBase/session-reports/$($file.Name)"
    if ($DryRun -eq "false") {
        Move-Item $file.FullName $dest
        Write-Host "✅ Moved: $($file.Name) → session-reports/"
    } else {
        Write-Host "🔍 Would move: $($file.Name) → session-reports/"
    }
}

# Archive VED-XXX completion reports
$completionFiles = Get-ChildItem -Filter "VED-*_COMPLETION_REPORT.md"
foreach ($file in $completionFiles) {
    $dest = "$archiveBase/completion-reports/$($file.Name)"
    if ($DryRun -eq "false") {
        Move-Item $file.FullName $dest
        Write-Host "✅ Moved: $($file.Name) → completion-reports/"
    } else {
        Write-Host "🔍 Would move: $($file.Name) → completion-reports/"
    }
}

# Archive old AUDIT reports (keep latest PROJECT_AUDIT_2026-01-03.md)
$auditFiles = Get-ChildItem -Filter "AUDIT*.md", "COMPREHENSIVE_AUDIT*.md", "COMPREHENSIVE_PROJECT_AUDIT*.md" | 
    Where-Object { $_.Name -notlike "*2026-01-03*" }
foreach ($file in $auditFiles) {
    $dest = "$archiveBase/audits/$($file.Name)"
    if ($DryRun -eq "false") {
        Move-Item $file.FullName $dest
        Write-Host "✅ Moved: $($file.Name) → audits/"
    } else {
        Write-Host "🔍 Would move: $($file.Name) → audits/"
    }
}

Write-Host "`n✅ Archive move complete (DryRun=$DryRun)"
```

**Beads Tasks:** `ved-cleanup-5, ved-cleanup-6, ved-cleanup-7`

---

#### Step 1.5: Verify Archive Integrity (30 min)
**Using:**
- `scripts/verify-all.sh`
- Custom verification script

**Script:**
```powershell
# scripts/cleanup/verify-archive.ps1
$archiveBase = "docs/archive/2025-12"

# Check structure exists
$requiredDirs = @(
    "$archiveBase/session-reports",
    "$archiveBase/test-waves",
    "$archiveBase/completion-reports",
    "$archiveBase/audits"
)

foreach ($dir in $requiredDirs) {
    if (Test-Path $dir) {
        $count = (Get-ChildItem $dir).Count
        Write-Host "✅ $dir - $count files"
    } else {
        Write-Host "❌ Missing: $dir"
        exit 1
    }
}

# Verify no files left in root
$rootWaves = Get-ChildItem -Filter "WAVE*.md"
$rootSessions = Get-ChildItem -Filter "*HANDOFF*.md", "*SESSION*.md"
$rootCompletions = Get-ChildItem -Filter "VED-*_COMPLETION_REPORT.md"

if ($rootWaves.Count -gt 0 -or $rootSessions.Count -gt 0 -or $rootCompletions.Count -gt 0) {
    Write-Host "⚠️  Some files not archived"
    exit 1
}

Write-Host "`n✅ Archive verification passed"
```

**Beads Task:** `ved-cleanup-8`

---

### SESSION 2: Extract EdTech Knowledge (4 hours)

#### Step 2.1: AI-Powered Knowledge Extraction (2 hours)
**Using:**
- `ai-integration-gemini.md` skill
- Google Gemini 1.5 Pro API (for complex extraction)

**Script:**
```typescript
// scripts/cleanup/extract-edtech-knowledge.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';

interface EdTechKnowledge {
  category: 'nudge' | 'hooked' | 'gamification' | 'ai-behavioral';
  title: string;
  content: string;
  sources: string[];
}

async function extractFromSPEC(): Promise<EdTechKnowledge[]> {
  const specContent = await fs.readFile('SPEC.md', 'utf-8');
  
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

  const prompt = `
Extract EdTech behavioral design knowledge from this SPEC.md file.

Focus on:
1. Nudge Theory (Richard Thaler) - Social Proof, Loss Aversion, Framing, Mapping
2. Hooked Model (Nir Eyal) - Trigger, Action, Variable Reward, Investment
3. Gamification - Points, Badges, Leaderboards, Commitment Contracts
4. AI-Powered Behavioral Analytics - Persona Modeling, Adaptive Difficulty, Predictive Scenarios

For each pattern found:
- Title: Clear name
- Content: Complete implementation details
- Sources: Line references in SPEC.md

Return JSON array of EdTechKnowledge objects.

SPEC.md content:
${specContent}
`;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}

async function generateMarkdownFiles(knowledge: EdTechKnowledge[]): Promise<void> {
  // Group by category
  const grouped = knowledge.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, EdTechKnowledge[]>);

  // Generate files
  for (const [category, items] of Object.entries(grouped)) {
    const content = items.map(item => `
## ${item.title}

${item.content}

**Sources:** ${item.sources.join(', ')}
`).join('\n---\n');

    const filename = `docs/behavioral-design/${category}/${category.toUpperCase()}_PATTERNS.md`;
    await fs.writeFile(filename, content);
    console.log(`✅ Created: ${filename}`);
  }
}
```

**Beads Tasks:** `ved-cleanup-9, ved-cleanup-10, ved-cleanup-11`

---

#### Step 2.2: Create EdTech Documentation Structure (1 hour)
**Using:**
- `edtech-monorepo-init.md` skill

**Directory Structure:**
```
docs/behavioral-design/
├── README.md                    # Overview of behavioral theories
├── nudge-theory/
│   ├── SOCIAL_PROOF_PATTERNS.md
│   ├── LOSS_AVERSION_PATTERNS.md
│   ├── FRAMING_PATTERNS.md
│   └── MAPPING_PATTERNS.md
├── hooked-model/
│   ├── TRIGGER_DESIGN.md
│   ├── ACTION_SIMPLIFICATION.md
│   ├── VARIABLE_REWARDS.md
│   └── INVESTMENT_LOOPS.md
├── gamification/
│   ├── POINTS_BADGES_LEADERBOARDS.md
│   ├── COMMITMENT_CONTRACTS.md
│   └── BUDDY_SYSTEM.md
├── ai-behavioral/
│   ├── PERSONA_MODELING.md
│   ├── ADAPTIVE_DIFFICULTY.md
│   └── PREDICTIVE_SCENARIOS.md
└── test-reports/
    ├── GAMIFICATION_TEST_REPORT.md
    ├── LOSS_AVERSION_TEST_REPORT.md
    ├── SOCIAL_PROOF_TEST_REPORT.md
    └── COMMITMENT_CONTRACTS_TEST_REPORT.md
```

**Beads Task:** `ved-cleanup-12`

---

#### Step 2.3: Move Test Reports (30 min)
**Script:**
```powershell
# scripts/cleanup/move-edtech-reports.ps1
$testReports = @(
    "GAMIFICATION_TEST_REPORT.md",
    "LOSS_AVERSION_TEST_REPORT.md",
    "SOCIAL_PROOF_TEST_REPORT.md",
    "COMMITMENT_CONTRACTS_TEST_REPORT.md",
    "NUDGE_TRIGGER_TEST_REPORT.md",
    "MARKET_SIMULATION_TEST_REPORT.md"
)

foreach ($report in $testReports) {
    if (Test-Path $report) {
        Move-Item $report "docs/behavioral-design/test-reports/"
        Write-Host "✅ Moved: $report"
    }
}
```

**Beads Task:** `ved-cleanup-13`

---

### SESSION 3: Consolidate Documentation + Verify (4 hours)

#### Step 3.1: Create docs/ Structure (30 min)
**Using:**
- `database-reliability-engineering.md` (best practices)

**Directory Structure:**
```
docs/
├── behavioral-design/      # EdTech knowledge (from Session 2)
├── ai-behavioral/          # AI + Psychology integration
├── testing/                # Testing guides
├── database/               # Database docs (already exists)
├── beads/                  # Beads workflow
├── devops/                 # DevOps guides
├── git-workflows/          # Git automation
├── ai-testing/             # AI Testing Army
└── archive/                # Historical (from Session 1)
```

**Beads Task:** `ved-cleanup-14`

---

#### Step 3.2: Automated Documentation Move (2 hours)
**Using:**
- `n8n-workflow-patterns` (automation design)
- `devops-toolkit-ai` (file operations)

**Script:**
```powershell
# scripts/cleanup/consolidate-documentation.ps1
param([string]$DryRun = "true")

# Testing docs
$testingDocs = @(
    "MASTER_TESTING_PLAN.md",
    "TEST_ENVIRONMENT_GUIDE.md",
    "E2E_TESTING_GUIDE.md",
    "AUTO_TEST_SYSTEM.md",
    "TEST_DB_SETUP.md"
)
foreach ($doc in $testingDocs) {
    if (Test-Path $doc) {
        $dest = "docs/testing/$doc"
        if ($DryRun -eq "false") {
            Move-Item $doc $dest
            Write-Host "✅ Moved: $doc → testing/"
        } else {
            Write-Host "🔍 Would move: $doc → testing/"
        }
    }
}

# DevOps docs
$devopsDocs = @(
    "DEVOPS_GUIDE.md",
    "VPS_DEPLOYMENT_GUIDE.md",
    "DEV_SERVER_GUIDE.md",
    "SECURITY_SECRETS_SETUP.md"
)
foreach ($doc in $devopsDocs) {
    if (Test-Path $doc) {
        $dest = "docs/devops/$doc"
        if ($DryRun -eq "false") {
            Move-Item $doc $dest
            Write-Host "✅ Moved: $doc → devops/"
        } else {
            Write-Host "🔍 Would move: $doc → devops/"
        }
    }
}

# AI Testing docs
$aiTestDocs = @(
    "AI_TESTING_ARMY_FINAL_REPORT.md",
    "GOOGLE_GEMINI_API_FOR_TESTING.md",
    "E2B_ORCHESTRATION_PLAN.md",
    "SWARM_TESTING_PLAN.md"
)
foreach ($doc in $aiTestDocs) {
    if (Test-Path $doc) {
        $dest = "docs/ai-testing/$doc"
        if ($DryRun -eq "false") {
            Move-Item $doc $dest
            Write-Host "✅ Moved: $doc → ai-testing/"
        } else {
            Write-Host "🔍 Would move: $doc → ai-testing/"
        }
    }
}

Write-Host "`n✅ Documentation consolidation complete (DryRun=$DryRun)"
```

**Beads Tasks:** `ved-cleanup-15, ved-cleanup-16, ved-cleanup-17, ved-cleanup-18`

---

#### Step 3.3: Update All Links (1 hour)
**Using:**
- `query-optimizer-ai.md` (link analysis patterns)
- Custom link updater

**Script:**
```typescript
// scripts/cleanup/update-links.ts
import fs from 'fs/promises';
import path from 'path';

interface LinkMapping {
  old: string;
  new: string;
}

const linkMappings: LinkMapping[] = [
  // Archive moves
  { old: 'WAVE1_BATCH2_REPORT.md', new: 'docs/archive/2025-12/test-waves/WAVE1_BATCH2_REPORT.md' },
  { old: 'SESSION_HANDOFF_*.md', new: 'docs/archive/2025-12/session-reports/SESSION_HANDOFF_*.md' },
  
  // Testing moves
  { old: 'MASTER_TESTING_PLAN.md', new: 'docs/testing/MASTER_TESTING_PLAN.md' },
  { old: 'E2E_TESTING_GUIDE.md', new: 'docs/testing/E2E_TESTING_GUIDE.md' },
  
  // DevOps moves
  { old: 'DEVOPS_GUIDE.md', new: 'docs/devops/DEVOPS_GUIDE.md' },
  { old: 'VPS_DEPLOYMENT_GUIDE.md', new: 'docs/devops/VPS_DEPLOYMENT_GUIDE.md' },
  
  // EdTech moves
  { old: 'GAMIFICATION_TEST_REPORT.md', new: 'docs/behavioral-design/test-reports/GAMIFICATION_TEST_REPORT.md' }
];

async function updateLinksInFile(filePath: string): Promise<void> {
  let content = await fs.readFile(filePath, 'utf-8');
  let updated = false;

  for (const mapping of linkMappings) {
    const regex = new RegExp(`\\[([^\\]]+)\\]\\(${mapping.old}\\)`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, `[$1](${mapping.new})`);
      updated = true;
    }
  }

  if (updated) {
    await fs.writeFile(filePath, content);
    console.log(`✅ Updated links in: ${filePath}`);
  }
}

async function updateAllLinks(): Promise<void> {
  const coreDocs = ['AGENTS.md', 'SPEC.md', 'README.md', 'PROJECT_AUDIT_2026-01-03.md'];
  
  for (const doc of coreDocs) {
    await updateLinksInFile(doc);
  }
  
  console.log('✅ All links updated');
}
```

**Beads Task:** `ved-cleanup-19`

---

#### Step 3.4: Automated Verification (30 min)
**Using:**
- Testing ecosystem (Vitest, Playwright, Bats)
- `scripts/verify-all.sh`
- `scripts/quality-gate.sh`

**Verification Checklist:**
```bash
# scripts/cleanup/verify-cleanup.sh
#!/bin/bash

echo "🔍 Running cleanup verification..."

# 1. Check test suite still passes
echo "1️⃣ Running test suite..."
pnpm test
if [ $? -ne 0 ]; then
    echo "❌ Tests failed"
    exit 1
fi

# 2. Verify builds
echo "2️⃣ Verifying builds..."
pnpm --filter api build
pnpm --filter web build
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

# 3. Check for broken links
echo "3️⃣ Checking for broken links..."
npx tsx scripts/cleanup/check-broken-links.ts
if [ $? -ne 0 ]; then
    echo "❌ Broken links found"
    exit 1
fi

# 4. Verify root directory count
echo "4️⃣ Verifying root file count..."
ROOT_COUNT=$(ls -1 *.md 2>/dev/null | wc -l)
if [ $ROOT_COUNT -gt 15 ]; then
    echo "⚠️  Root has $ROOT_COUNT .md files (target: 15)"
    exit 1
fi

# 5. Verify archive structure
echo "5️⃣ Verifying archive structure..."
if [ ! -d "docs/archive/2025-12/session-reports" ]; then
    echo "❌ Archive structure missing"
    exit 1
fi

# 6. Verify EdTech knowledge preserved
echo "6️⃣ Verifying EdTech knowledge..."
if [ ! -d "docs/behavioral-design" ]; then
    echo "❌ EdTech knowledge not preserved"
    exit 1
fi

echo "✅ All verification checks passed"
```

**Beads Tasks:** `ved-cleanup-20, ved-cleanup-21`

---

#### Step 3.5: Final Audit (30 min)
**Using:**
- Beads Trinity (bd doctor, bv --robot-insights)

**Script:**
```powershell
# scripts/cleanup/final-audit.ps1
Write-Host "📊 Running final cleanup audit..."

# 1. Root file count
$rootMd = (Get-ChildItem -Filter "*.md").Count
Write-Host "Root .md files: $rootMd (target: 15)"

# 2. Archive status
$archiveCount = (Get-ChildItem -Recurse -Path "docs/archive" -Filter "*.md").Count
Write-Host "Archived files: $archiveCount"

# 3. EdTech knowledge
$edtechCount = (Get-ChildItem -Recurse -Path "docs/behavioral-design" -Filter "*.md").Count
Write-Host "EdTech docs: $edtechCount"

# 4. Skills preserved
$skillsCount = (Get-ChildItem -Recurse -Path ".agents/skills" -Filter "*.md").Count
Write-Host "Skills preserved: $skillsCount"

# 5. Beads health
Write-Host "`nRunning beads health check..."
& beads.exe doctor

# 6. Git status
Write-Host "`nGit status:"
git status --short

Write-Host "`n✅ Final audit complete"
```

**Beads Task:** `ved-cleanup-22`

---

## 🎯 BEADS TRINITY ORCHESTRATION

### Task Creation (All 22 Tasks)
```bash
# Create all cleanup tasks in beads
beads.exe create "AI categorization engine" \
  --type task \
  --priority 1 \
  --tags cleanup,ai,phase1

beads.exe create "Generate move plan" \
  --type task \
  --priority 1 \
  --tags cleanup,automation,phase1 \
  --deps blocks:ved-cleanup-2

# ... (repeat for all 22 tasks)
```

### Multi-Agent Coordination
**Using:**
- `mcp_agent_mail` - Prevent conflicts
- `bv --robot-next` - AI task selection
- `.agents/skills/multi-agent-orchestration/` scripts

**Workflow:**
```bash
# Agent 1: AI Categorization
./scripts/beads-claim-task.sh ved-cleanup-2

# Agent 2: Archive Move (waits for Agent 1)
# mcp_agent_mail coordinates to prevent conflicts

# Agent 3: EdTech Extraction (parallel with Agent 2)
./scripts/beads-claim-task.sh ved-cleanup-9
```

---

## 📊 RESOURCE USAGE MATRIX

| Phase | AI Skills | Scripts | Beads Tasks | Time |
|-------|-----------|---------|-------------|------|
| **Phase 1** | 4 skills | 3 scripts | 8 tasks | 5h |
| **Phase 2** | 3 skills | 2 scripts | 5 tasks | 4h |
| **Phase 3** | 3 skills | 4 scripts | 9 tasks | 4h |
| **TOTAL** | **10 skills** | **9 scripts** | **22 tasks** | **13h** |

---

## ✅ SUCCESS CRITERIA

### Pre-Execution Validation
```bash
✅ All 50+ skills preserved in .agents/skills/
✅ Test suite passing (98.7% = 1811/1834)
✅ Builds green (after ved-6bdg, ved-gdvp, ved-o1cw fixed)
✅ Beads Trinity operational (bd + bv + mcp_agent_mail)
✅ Git clean (no uncommitted changes)
```

### Post-Execution Validation
```bash
✅ Root directory: ≤15 .md files
✅ All tests still passing (98.7%+)
✅ Zero broken links
✅ EdTech knowledge 100% preserved
✅ All skills accessible
✅ Archive structure complete
✅ Documentation organized
✅ Git committed and pushed
```

---

## 🚨 RISK MITIGATION

### Risk 1: File Deletion Errors
**Mitigation:**
- ALWAYS dry-run first (`$DryRun = "true"`)
- Git commit before each phase
- Backup to R2 before starting

### Risk 2: Broken Links
**Mitigation:**
- Automated link checker
- Update links before moving files
- Verification phase

### Risk 3: Knowledge Loss
**Mitigation:**
- AI extraction with human review
- Preserve original SPEC.md
- Archive rather than delete

### Risk 4: Test Failures
**Mitigation:**
- Run tests after each phase
- Fix immediately if fails
- Rollback capability via git

---

## 📋 EXECUTION CHECKLIST

### Pre-Session
- [ ] Read this plan completely
- [ ] Fix Phase 0 blockers (ved-6bdg, ved-gdvp, ved-o1cw)
- [ ] Backup to R2: `scripts/backup-to-r2.ps1`
- [ ] Git commit all current work
- [ ] Verify Gemini API key in .env

### Session 1 (5 hours)
- [ ] Create AI categorization script
- [ ] Run categorization (dry-run)
- [ ] Review categorization output
- [ ] Create archive structure
- [ ] Execute archive move (dry-run)
- [ ] Execute archive move (live)
- [ ] Verify archive integrity
- [ ] Git commit: "chore: Archive historical reports"

### Session 2 (4 hours)
- [ ] Extract EdTech knowledge from SPEC.md
- [ ] Create behavioral-design/ structure
- [ ] Generate EdTech documentation
- [ ] Move test reports
- [ ] Review extracted knowledge
- [ ] Git commit: "docs: Extract EdTech behavioral design knowledge"

### Session 3 (4 hours)
- [ ] Create docs/ structure
- [ ] Consolidate documentation (dry-run)
- [ ] Consolidate documentation (live)
- [ ] Update all links
- [ ] Run verification suite
- [ ] Final audit
- [ ] Git commit: "docs: Complete documentation cleanup"

### Post-Session
- [ ] Run beads sync
- [ ] Git push
- [ ] Close all 22 beads tasks
- [ ] Update README.md with new structure
- [ ] Celebrate! 🎉

---

**Created:** 2026-01-03 05:00  
**Total Effort:** 13 hours (3 sessions)  
**Resources:** 10 AI skills + 9 scripts + 22 beads tasks  
**Expected Reduction:** 201 → 15 files (93%)  
**Status:** 🎯 **READY FOR EXECUTION**
