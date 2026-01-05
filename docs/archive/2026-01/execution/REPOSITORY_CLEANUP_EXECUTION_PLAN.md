# Repository Cleanup & Organization - Optimized Execution Plan

**Generated**: 2026-01-05  
**Method**: Planning + Orchestrator Skills  
**Epic**: Repository Organization (ved-repo-cleanup)  
**Priority**: P1 (High - Professional presentation)

---

## Phase 1: Discovery & Risk Assessment ✅

### 1.1 Architecture Snapshot

**Current State**:
```
Root Directory: 62 files (40+ markdown, 8+ scripts, 5+ executables)
Documentation: Scattered across root, docs/, runbooks/, templates/
Archive: Exists but disorganized (2025-12/, 2026-01/)
Scripts: Mixed utility, temp, and deployment scripts
```

**Technical Constraints**:
- Must preserve git history
- Cannot break existing references in docs
- VPS deployment scripts must remain functional
- Beads system dependencies (.beads/ directory)

### 1.2 Risk Map

| Component | Risk | Reason | Mitigation |
|-----------|------|--------|------------|
| Move historical docs | LOW | Just git mv | Verify no broken links |
| Delete temp files | LOW | Already in .gitignore | Double-check not in use |
| Reorganize docs/ | MEDIUM | May break internal links | Update all references |
| Create new docs | LOW | Standard markdown | Follow template |
| Update README | MEDIUM | Public-facing | Review with Oracle |

---

## Phase 2: Execution Plan (Multi-Track)

### Epic Structure

```bash
# Create epic bead
bd create "Repository Cleanup & Organization" -t epic -p 1

# Get epic ID (assume ved-repo-cleanup)
EPIC_ID="ved-repo-cleanup"
```

### Track Assignment

| Track | Agent | Focus | File Scope | Beads | Duration |
|-------|-------|-------|------------|-------|----------|
| 1 | **CrimsonArchive** | Archive historical docs | `docs/archive/**` | 3 beads | 30 min |
| 2 | **SapphireDocs** | Organize documentation | `docs/**` (excluding archive) | 4 beads | 40 min |
| 3 | **AmberClean** | Remove temp files & scripts | Root + `scripts/` | 3 beads | 20 min |
| 4 | **EmeraldEssentials** | Create essential files | Root README, CONTRIBUTING, etc. | 4 beads | 40 min |

**Total Parallel Duration**: ~40 minutes (longest track)  
**Sequential Fallback**: ~130 minutes

---

## Track 1: CrimsonArchive (Historical Docs) 

**Agent**: CrimsonArchive  
**File Scope**: `docs/archive/**`, root `*_SUMMARY.md`, `*_COMPLETE.md`, etc.  
**Duration**: 30 minutes

### Beads

#### ved-arc-01: Create archive structure
```markdown
**Task**: Create organized archive directory structure

**Acceptance Criteria**:
- [ ] `docs/archive/2025-12/{audits,planning,sessions}/` created
- [ ] `docs/archive/2026-01/{audits,planning,sessions,execution}/` created
- [ ] `docs/archive/README.md` with index created

**Files**: `docs/archive/` (new directories)
```

#### ved-arc-02: Move 2025-12 historical docs
```markdown
**Task**: Archive all 2025-12 planning and audit docs

**Move Pattern**:
- `AI_OPTIMIZATION_*.md` → `docs/archive/2025-12/planning/`
- `COMPREHENSIVE_AUDIT_*.md` → `docs/archive/2025-12/audits/`
- `SESSION_HANDOFF_*.md` (2025-12 dated) → `docs/archive/2025-12/sessions/`

**Acceptance Criteria**:
- [ ] All 2025-12 docs moved via `git mv`
- [ ] Update links in archive README.md
- [ ] Verify no broken references

**Files**: Root markdown files → `docs/archive/2025-12/`
```

#### ved-arc-03: Move 2026-01 execution docs
```markdown
**Task**: Archive 2026-01 execution and audit docs

**Move Pattern**:
- `TRACK*.md`, `MULTI_TRACK_*.md` → `docs/archive/2026-01/execution/`
- `UI_UX_*.md`, `YOUTUBE_*.md` → `docs/archive/2026-01/planning/`
- `PROJECT_AUDIT_2026-01*.md` → `docs/archive/2026-01/audits/`
- `SESSION_HANDOFF_*.md` (2026-01) → `docs/archive/2026-01/sessions/`

**Acceptance Criteria**:
- [ ] All 2026-01 docs moved
- [ ] Archive README.md updated with full index
- [ ] Root directory has <15 markdown files

**Files**: Root markdown files → `docs/archive/2026-01/`
```

---

## Track 2: SapphireDocs (Documentation Organization)

**Agent**: SapphireDocs  
**File Scope**: `docs/**` (excluding archive)  
**Duration**: 40 minutes

### Beads

#### ved-doc-01: Create new docs structure
```markdown
**Task**: Create standardized documentation hierarchy

**Structure**:
```
docs/
├── getting-started/
│   ├── README.md
│   ├── installation.md
│   └── development.md
├── architecture/
│   ├── README.md
│   ├── frontend.md
│   ├── backend.md
│   └── database.md
├── guides/
│   ├── testing.md
│   ├── security.md
│   └── troubleshooting.md
└── operations/
    ├── deployment.md
    ├── monitoring.md
    └── backup.md
```

**Acceptance Criteria**:
- [ ] All directories created
- [ ] Each has README.md stub
- [ ] Navigation structure documented

**Files**: `docs/` (new structure)
```

#### ved-doc-02: Consolidate architecture docs
```markdown
**Task**: Merge scattered architecture docs into unified structure

**Sources**:
- `ARCHITECTURE.md` (keep in root, reference from docs)
- `FRONTEND_*.md` → consolidate into `docs/architecture/frontend.md`
- `DATABASE_*.md` → consolidate into `docs/architecture/database.md`
- `VPS_*.md` → `docs/operations/deployment.md`

**Acceptance Criteria**:
- [ ] Architecture docs consolidated
- [ ] No duplicate information
- [ ] Cross-references updated

**Files**: Root docs → `docs/architecture/**`
```

#### ved-doc-03: Migrate operational docs
```markdown
**Task**: Move runbooks and operational guides

**Move**:
- `runbooks/**` → `docs/operations/`
- `DEPLOYMENT_*.md` → `docs/operations/deployment.md`
- `MONITORING_*.md` → `docs/operations/monitoring.md`

**Acceptance Criteria**:
- [ ] All operational docs in `docs/operations/`
- [ ] Runbooks consolidated
- [ ] Old directories removed

**Files**: `runbooks/`, root ops docs → `docs/operations/**`
```

#### ved-doc-04: Create getting-started guides
```markdown
**Task**: Write beginner-friendly getting-started documentation

**Create**:
- `docs/getting-started/installation.md` (from README setup section)
- `docs/getting-started/development.md` (local dev workflow)
- `docs/getting-started/README.md` (quick start index)

**Acceptance Criteria**:
- [ ] Clear step-by-step guides
- [ ] Tested commands
- [ ] Linked from main README

**Files**: `docs/getting-started/**` (new content)
```

---

## Track 3: AmberClean (Temp Files & Scripts)

**Agent**: AmberClean  
**File Scope**: Root temp files, `scripts/**`  
**Duration**: 20 minutes

### Beads

#### ved-clean-01: Remove build artifacts
```markdown
**Task**: Delete build artifacts and executables

**Remove**:
- `bfg.jar` (cleanup tool, already used)
- `beads.exe`, `bv.exe` (user has global install)
- `go_installer.msi` (build artifact)
- `secret_scan.txt` (temporary scan output)

**Acceptance Criteria**:
- [ ] Files removed via `git rm`
- [ ] Verify in .gitignore to prevent re-add
- [ ] No build artifacts remain in root

**Files**: Root executables and artifacts
```

#### ved-clean-02: Remove temporary scripts
```markdown
**Task**: Delete one-time use scripts

**Remove**:
- `temp_*.ps1`, `temp_*.bat`
- `ARCHIVE_CLEANUP.ps1`, `ARCHIVE_CLEANUP_PLAN.md`
- `AUTO_SEED_COMPLETE.bat`, `SIMPLE_SEED_TEST.bat`
- `EXECUTE_*.ps1`, `QUICK_*.ps1`
- Scripts in root that are one-off tasks

**Keep**:
- `START_DEV.bat` (active dev tool)
- `scripts/vps-toolkit/**` (VPS deployment)

**Acceptance Criteria**:
- [ ] Temp scripts removed
- [ ] Active scripts remain
- [ ] scripts/ directory organized

**Files**: Root scripts, cleanup temp files
```

#### ved-clean-03: Organize scripts directory
```markdown
**Task**: Create organized script structure

**Structure**:
```
scripts/
├── development/
│   └── START_DEV.bat (moved from root)
├── vps-toolkit/ (keep as is)
├── database/ (if scripts exist)
└── README.md (index of all scripts)
```

**Acceptance Criteria**:
- [ ] Scripts categorized
- [ ] README.md documents each script
- [ ] Execution instructions clear

**Files**: `scripts/**`
```

---

## Track 4: EmeraldEssentials (Essential Files)

**Agent**: EmeraldEssentials  
**File Scope**: Root `README.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `LICENSE`  
**Duration**: 40 minutes

### Beads

#### ved-ess-01: Create CONTRIBUTING.md
```markdown
**Task**: Write comprehensive contribution guide

**Sections**:
1. Development setup (link to docs/getting-started)
2. Code style guide (reference AGENTS.md)
3. Git workflow (feature branch → PR → main)
4. Testing requirements (from AGENTS.md)
5. PR review process
6. Security guidelines (link to SECURITY.md)

**Reference**: AGENTS.md for code standards

**Acceptance Criteria**:
- [ ] All sections complete
- [ ] Clear examples
- [ ] Links to detailed docs

**Files**: `CONTRIBUTING.md` (new)
```

#### ved-ess-02: Create CHANGELOG.md
```markdown
**Task**: Initialize CHANGELOG using Keep-a-changelog format

**Structure**:
```markdown
# Changelog

## [Unreleased]

### Added
- Repository cleanup and organization
- GitHub security features (secret scanning, branch protection)
- Comprehensive documentation structure

### Security
- Removed SSH private key from git history
- Enhanced .gitignore with 70+ secret patterns

## [0.1.0] - 2026-01-XX
... (historical changes)
```

**Acceptance Criteria**:
- [ ] Keep-a-changelog format
- [ ] Current work documented
- [ ] Version 0.1.0 baseline

**Files**: `CHANGELOG.md` (new)
```

#### ved-ess-03: Add LICENSE file
```markdown
**Task**: Add MIT License to repository

**Content**: Standard MIT License template with:
- Year: 2025-2026
- Copyright holder: V-EdFinance contributors

**Acceptance Criteria**:
- [ ] LICENSE file created
- [ ] Referenced in README.md
- [ ] GitHub detects license automatically

**Files**: `LICENSE` (new)
```

#### ved-ess-04: Enhance README.md
```markdown
**Task**: Upgrade README to professional standard

**Add**:
- Project description and tagline
- Tech stack badges (Next.js, NestJS, Prisma)
- Features list (gamification, AI mentor, multi-language)
- Quick start section (link to docs/getting-started)
- Documentation links (Architecture, API, Contributing)
- License badge and link
- Deployment status badge (if applicable)

**Acceptance Criteria**:
- [ ] Professional appearance
- [ ] All badges working
- [ ] Clear navigation
- [ ] Links verified

**Files**: `README.md` (enhance)
```

---

## Cross-Track Dependencies

### Dependency Graph
```
Track 1 (Archive) ──┐
                    ├──> Track 2 (Docs) ──> Track 4 (README)
Track 3 (Clean) ────┘

Track 1 → Track 2: Archive first so docs/ is clean for reorganization
Track 2 → Track 4: Docs structure needed for README links
Track 3 → Track 2: Clean temp files before organizing scripts
```

### Execution Order
1. **Parallel**: Track 1 (Archive) + Track 3 (Clean)
2. **After T1+T3**: Track 2 (Docs organization)
3. **After T2**: Track 4 (README + essentials)

---

## Execution Commands

### Step 1: Create Epic and Beads

```bash
# Create epic
bd create "Repository Cleanup & Organization" -t epic -p 1

# Track 1 beads (CrimsonArchive)
bd create "Create archive structure" -t task --blocks ved-repo-cleanup
bd create "Move 2025-12 historical docs" -t task --blocks ved-repo-cleanup
bd create "Move 2026-01 execution docs" -t task --blocks ved-repo-cleanup

# Track 2 beads (SapphireDocs)
bd create "Create new docs structure" -t task --blocks ved-repo-cleanup
bd create "Consolidate architecture docs" -t task --blocks ved-repo-cleanup
bd create "Migrate operational docs" -t task --blocks ved-repo-cleanup
bd create "Create getting-started guides" -t task --blocks ved-repo-cleanup

# Track 3 beads (AmberClean)
bd create "Remove build artifacts" -t task --blocks ved-repo-cleanup
bd create "Remove temporary scripts" -t task --blocks ved-repo-cleanup
bd create "Organize scripts directory" -t task --blocks ved-repo-cleanup

# Track 4 beads (EmeraldEssentials)
bd create "Create CONTRIBUTING.md" -t task --blocks ved-repo-cleanup
bd create "Create CHANGELOG.md" -t task --blocks ved-repo-cleanup
bd create "Add LICENSE file" -t task --blocks ved-repo-cleanup
bd create "Enhance README.md" -t task --blocks ved-repo-cleanup

# Add dependencies
bd dep add ved-arc-03 ved-doc-01  # Archive before docs reorg
bd dep add ved-clean-02 ved-doc-03  # Clean before organizing
bd dep add ved-doc-04 ved-ess-04  # Docs before README
```

### Step 2: Validate Plan

```bash
bv --robot-insights  # Check for cycles
bv --robot-plan  # Get execution tracks
```

### Step 3: Execute (Choose Mode)

**Option A: Manual Sequential**
```bash
# Work through beads in dependency order
bd update ved-arc-01 --status in_progress
# ... complete work ...
bd close ved-arc-01 --reason "Archive structure created"
# Continue...
```

**Option B: Orchestrated Parallel** (using orchestrator skill)
```bash
# Let orchestrator spawn parallel workers
# See orchestrator.md for full protocol
```

---

## Verification Checklist

### Repository Structure ✅
- [ ] Root directory has <15 essential files
- [ ] All historical docs in `docs/archive/2025-12/` and `docs/archive/2026-01/`
- [ ] Documentation organized in `docs/{getting-started,architecture,guides,operations}/`
- [ ] Scripts organized in `scripts/{development,vps-toolkit,database}/`
- [ ] No build artifacts (`.jar`, `.exe`, `.msi`)
- [ ] No temp files (`temp_*.ps1`, `EXECUTE_*.ps1`)

### Essential Files Present ✅
- [ ] `README.md` (enhanced with badges, clear structure)
- [ ] `SPEC.md` ✅ (already exists)
- [ ] `ARCHITECTURE.md` ✅ (already exists)
- [ ] `AGENTS.md` ✅ (already exists)
- [ ] `SECURITY.md` ✅ (created in security cleanup)
- [ ] `SECRETS_ROTATION.md` ✅ (created in security cleanup)
- [ ] `CONTRIBUTING.md` (new)
- [ ] `CHANGELOG.md` (new)
- [ ] `LICENSE` (new)
- [ ] `.env.example` ✅ (created in security cleanup)
- [ ] `.gitignore` ✅ (hardened in security cleanup)

### Documentation Quality ✅
- [ ] Archive README.md has complete index
- [ ] All docs/ subdirectories have README.md
- [ ] Navigation is intuitive
- [ ] No broken links
- [ ] Code examples are current

### Git Hygiene ✅
- [ ] All moves done via `git mv` (preserves history)
- [ ] Deletions done via `git rm`
- [ ] Commit messages follow conventional commits
- [ ] No accidental file loss

---

## Success Metrics

### Before Cleanup
- Root files: 62 (40+ markdown, hard to navigate)
- Documentation: Scattered, duplicated
- Scripts: Mixed with temp files
- Professional appearance: Low

### After Cleanup
- Root files: 10-15 (essential only)
- Documentation: Organized, clear hierarchy
- Scripts: Categorized, documented
- Professional appearance: High
- Ready for: Public sharing, collaboration, onboarding

---

## Output Artifacts

| Artifact | Location | Purpose |
|----------|----------|---------|
| Archive Index | `docs/archive/README.md` | Historical doc navigation |
| Getting Started | `docs/getting-started/` | Onboarding new developers |
| Architecture Docs | `docs/architecture/` | System design reference |
| Operations Runbooks | `docs/operations/` | Deployment and maintenance |
| Contributing Guide | `CONTRIBUTING.md` | Contribution standards |
| Changelog | `CHANGELOG.md` | Version history |
| License | `LICENSE` | Legal clarity |
| Enhanced README | `README.md` | Project overview |

---

**Prepared by**: Amp Planning + Orchestrator  
**Method**: Systematic discovery → risk assessment → track decomposition  
**Estimated Time**: 40 minutes (parallel) / 130 minutes (sequential)  
**Ready for Execution**: ✅ Yes (beads defined, dependencies mapped, validation criteria clear)
