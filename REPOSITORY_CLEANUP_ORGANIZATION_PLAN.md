# Repository Cleanup & Organization Plan

**Project**: V-EdFinance  
**Goal**: Clean, professional, production-ready repository  
**Status**: Post-security cleanup → Organization phase

---

## Current Repository Issues

### 1. Root Directory Clutter (60+ files)
**Problem**: Too many markdown files in root making navigation difficult

**Files to organize**:
```
Root level (current mess):
- 40+ planning documents (AI_OPTIMIZATION_*, TRACK*.md, UI_UX_*.md)
- 15+ session handoffs (SESSION_HANDOFF_*.md)
- 10+ execution summaries (*_SUMMARY.md, *_COMPLETE.md)
- 8+ audit reports (PROJECT_AUDIT_*.md)
- Temporary scripts (temp_*.ps1, *.bat)
```

### 2. Multiple Duplicate/Obsolete Folders
- `archive/` (good, but needs organization)
- `history/` (duplicate of archive?)
- `tracks/` (execution planning - needed?)
- `runbooks/` (operational docs)
- `templates/` (templates for what?)
- `patterns/` (code patterns?)

### 3. Build Artifacts & Temp Files
- `bfg.jar` (cleanup tool, not needed in repo)
- `beads.exe`, `bv.exe` (already in .gitignore but exists)
- `go_installer.msi` (build artifact)
- Various `.bat`, `.ps1` scripts for one-time tasks

---

## Cleanup Strategy (3 Phases)

### Phase 1: Archive Historical Documents (30 min)

**Create organized archive structure**:
```
docs/archive/
├── 2025-12/
│   ├── audits/
│   ├── planning/
│   └── sessions/
├── 2026-01/
│   ├── audits/
│   ├── planning/
│   ├── sessions/
│   └── execution/
└── README.md (archive index)
```

**Move these patterns**:
- `AI_OPTIMIZATION_*.md` → `docs/archive/2025-12/planning/`
- `TRACK*.md` → `docs/archive/2026-01/execution/`
- `UI_UX_*.md` → `docs/archive/2026-01/planning/`
- `SESSION_HANDOFF_*.md` → `docs/archive/2026-01/sessions/`
- `PROJECT_AUDIT_*.md` → `docs/archive/2026-01/audits/`
- `*_SUMMARY.md`, `*_COMPLETE.md` → `docs/archive/2026-01/execution/`

**Keep in root**:
- `README.md` ✅
- `SPEC.md` ✅
- `ARCHITECTURE.md` ✅
- `AGENTS.md` ✅
- `SECURITY.md` ✅
- `SECRETS_ROTATION.md` ✅
- `.env.example` ✅
- `CONTRIBUTING.md` (to create) ✅
- `CHANGELOG.md` (to create) ✅

---

### Phase 2: Organize Documentation (20 min)

**New docs structure**:
```
docs/
├── getting-started/
│   ├── README.md (quick start)
│   ├── installation.md
│   ├── development.md
│   └── deployment.md
├── architecture/
│   ├── README.md
│   ├── frontend.md (Next.js structure)
│   ├── backend.md (NestJS structure)
│   ├── database.md (Prisma schema)
│   └── deployment.md (VPS + Cloudflare)
├── api/
│   ├── README.md
│   ├── authentication.md
│   ├── courses.md
│   ├── gamification.md
│   └── payments.md
├── guides/
│   ├── contributing.md
│   ├── testing.md
│   ├── security.md
│   └── troubleshooting.md
├── operations/
│   ├── deployment-runbook.md
│   ├── monitoring.md
│   ├── backup-restore.md
│   └── incident-response.md
└── archive/ (historical docs)
```

**Consolidate existing docs**:
- Merge `runbooks/` → `docs/operations/`
- Move `FRONTEND_*.md` → `docs/architecture/frontend.md`
- Move `DATABASE_*.md` → `docs/architecture/database.md`
- Move `VPS_*.md` → `docs/operations/`

---

### Phase 3: Clean Temp Files & Scripts (15 min)

**Remove from repository**:
```bash
# Build artifacts (already in .gitignore but committed)
bfg.jar
beads.exe
bv.exe
go_installer.msi

# Temporary scripts (one-time use)
temp_*.ps1
temp_*.bat
ARCHIVE_CLEANUP.ps1
AUTO_SEED_COMPLETE.bat
SIMPLE_SEED_TEST.bat

# Obsolete execution scripts
EXECUTE_*.ps1
QUICK_*.ps1
```

**Keep useful scripts**:
- `scripts/vps-toolkit/*` ✅
- `scripts/database/*` ✅ (if exists)
- `START_DEV.bat` ✅

**Organize remaining scripts**:
```
scripts/
├── development/
│   ├── START_DEV.bat
│   └── setup-local.sh
├── vps-toolkit/
│   ├── deploy-*.bat
│   ├── vps-connection.js
│   └── README.md
├── database/
│   ├── seed.ts
│   ├── backup.sh
│   └── README.md
└── deployment/
    └── deploy-production.sh
```

---

## New Root Directory Structure (After Cleanup)

```
v-edfinance/
├── .github/              # GitHub configs (workflows, templates)
├── .husky/               # Git hooks
├── apps/                 # Applications
│   ├── web/             # Next.js frontend
│   └── api/             # NestJS backend
├── docs/                 # Documentation (organized)
├── scripts/              # Utility scripts (organized)
├── prisma/               # Database schema
├── monitoring/           # Monitoring configs
├── config/               # App configurations
│   
├── .env.example          # Environment template ✅
├── .gitignore            # Git ignore (hardened) ✅
├── package.json          # Root package
├── pnpm-workspace.yaml   # Workspace config
├── turbo.json            # Turborepo config
│   
├── README.md             # Project overview ✅
├── SPEC.md               # Product specification ✅
├── ARCHITECTURE.md       # System architecture ✅
├── AGENTS.md             # AI agent instructions ✅
├── SECURITY.md           # Security policy ✅
├── SECRETS_ROTATION.md   # Security incidents ✅
├── CONTRIBUTING.md       # Contribution guide (NEW) ✅
├── CHANGELOG.md          # Version history (NEW) ✅
└── LICENSE               # License file (NEW) ✅
```

---

## Phase 4: Create Missing Essential Files (30 min)

### 4.1 CONTRIBUTING.md

**Content**:
- How to set up development environment
- Code style guide (from AGENTS.md)
- Git workflow (feature branches → PR → main)
- Testing requirements
- Documentation standards
- PR review process

### 4.2 CHANGELOG.md

**Format**: Keep-a-changelog standard

```markdown
# Changelog

## [Unreleased]

### Added
- GitHub security cleanup (secret scanning, branch protection)
- Comprehensive security documentation
- VPS deployment toolkit

### Security
- Removed SSH private key from git history
- Enhanced .gitignore with 70+ secret patterns
- SSH key rotation scripts

## [0.1.0] - 2025-12-XX

### Added
- Initial project setup
- Frontend UI/UX implementation
- Backend API structure
- Database schema
```

### 4.3 LICENSE

**Recommendation**: MIT License (flexible for educational project)

Or use another license based on your needs:
- GPL-3.0 (copyleft, must open source derivatives)
- Apache-2.0 (permissive, patent grant)
- Proprietary (closed source)

### 4.4 README.md Enhancement

**Current README needs**:
- Better project description
- Tech stack badges
- Quick start guide
- Documentation links
- Contribution guidelines link

**Structure**:
```markdown
# V-EdFinance 🎓💰

> Edtech platform for financial education and management

[![Next.js](badge)](link)
[![NestJS](badge)](link)
[![Prisma](badge)](link)

## Features

- 🎮 Gamified learning
- 💡 AI-powered mentor
- 📊 Interactive simulations
- 🏆 Achievement system
- 🌍 Multi-language (vi/en/zh)

## Quick Start

[Installation guide](docs/getting-started/installation.md)

## Documentation

- [Architecture](ARCHITECTURE.md)
- [API Docs](docs/api/)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)

## Tech Stack

- Frontend: Next.js 15, React 19, Tailwind CSS
- Backend: NestJS, Prisma, PostgreSQL
- Deployment: Cloudflare Pages + VPS

## License

MIT
```

---

## GitHub Repository Settings

### 4.5 Repository Description & Topics

**Settings → General → Description**:
```
Edtech platform for financial education with gamification, AI mentor, and interactive simulations. Built with Next.js, NestJS, Prisma.
```

**Topics** (for discoverability):
```
nextjs, nestjs, prisma, edtech, fintech, gamification, 
education, financial-literacy, typescript, postgresql,
react, tailwind-css, i18n
```

### 4.6 Repository Details

- [x] Homepage URL: https://v-edfinance.com (if deployed)
- [x] Releases: Enable (create v0.1.0 tag)
- [x] Packages: Disable (not publishing packages)
- [x] Deployments: Enable (link to Cloudflare Pages)
- [x] Issues: Enable (bug tracking)
- [x] Projects: Enable (roadmap tracking)
- [x] Wiki: Disable (use docs/ instead)
- [x] Discussions: Enable (community Q&A)

---

## Execution Plan (90 minutes total)

### Session 1: Archive & Organize (50 min)

**Step 1**: Create new docs structure
```bash
mkdir -p docs/{getting-started,architecture,api,guides,operations}
mkdir -p docs/archive/{2025-12,2026-01}/{audits,planning,sessions,execution}
```

**Step 2**: Move historical documents
```bash
# Script to move files based on patterns
git mv AI_OPTIMIZATION_*.md docs/archive/2025-12/planning/
git mv TRACK*.md docs/archive/2026-01/execution/
# ... (full list in execution script)
```

**Step 3**: Remove temp files
```bash
git rm bfg.jar beads.exe bv.exe
git rm temp_*.ps1 temp_*.bat
git rm EXECUTE_*.ps1 QUICK_*.ps1
```

**Step 4**: Commit cleanup
```bash
git add -A
git commit -m "chore: reorganize repository structure

- Archive historical docs to docs/archive/
- Remove temporary files and build artifacts
- Create organized docs structure
- Clean up root directory (60+ files → 10 essential)

Refs: REPOSITORY_CLEANUP_ORGANIZATION_PLAN.md"
```

### Session 2: Create Essential Files (40 min)

**Step 5**: Create CONTRIBUTING.md, CHANGELOG.md, LICENSE

**Step 6**: Enhance README.md with badges, better structure

**Step 7**: Update repository settings (description, topics)

**Step 8**: Final commit and push
```bash
git add CONTRIBUTING.md CHANGELOG.md LICENSE README.md
git commit -m "docs: add essential repository files

- Add CONTRIBUTING.md with development guide
- Add CHANGELOG.md (Keep-a-changelog format)
- Add MIT LICENSE
- Enhance README.md with badges and better structure

Repository now production-ready"
git push origin main
```

---

## Verification Checklist

### Repository Structure
- [ ] Root directory has <15 essential files
- [ ] All historical docs archived in docs/archive/
- [ ] Documentation organized in docs/ subdirectories
- [ ] Scripts organized in scripts/ subdirectories
- [ ] No build artifacts or temp files

### Essential Files Present
- [ ] README.md (enhanced with badges)
- [ ] SPEC.md
- [ ] ARCHITECTURE.md
- [ ] AGENTS.md
- [ ] SECURITY.md
- [ ] SECRETS_ROTATION.md
- [ ] CONTRIBUTING.md
- [ ] CHANGELOG.md
- [ ] LICENSE
- [ ] .env.example
- [ ] .gitignore (hardened)

### GitHub Settings
- [ ] Repository description set
- [ ] Topics added (12+ tags)
- [ ] Issues enabled
- [ ] Discussions enabled
- [ ] Branch protection configured
- [ ] Secret scanning enabled

### Documentation Quality
- [ ] All docs have clear purpose
- [ ] Navigation is intuitive
- [ ] Links are working
- [ ] Code examples are current
- [ ] README links to all major docs

---

## Before/After Comparison

### Before Cleanup
```
Root directory: 60+ files
- Unclear which docs are current
- Mix of planning, execution, archives
- Temp files scattered
- Hard to navigate
```

### After Cleanup
```
Root directory: 10 essential files
- Clear purpose for each file
- Historical docs archived
- Active docs organized
- Professional appearance
```

---

## Next Steps After Cleanup

1. **Create first release**: Tag v0.1.0
2. **Set up Projects**: Create roadmap board
3. **Enable Discussions**: Community Q&A
4. **Write contributor guide**: Onboarding new devs
5. **Document deployment**: Production runbook

---

**Prepared by**: Amp Repository Manager  
**Priority**: P1 (High - Professional presentation)  
**Estimated Time**: 90 minutes  
**Dependencies**: Security cleanup complete ✅
