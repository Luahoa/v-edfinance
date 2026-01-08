# GitHub Repository Cleanup & Optimization Plan (Beads-Based)

**Date**: 2026-01-05  
**Method**: Beads Workflow + Auto-commit  
**Epic**: GitHub Repository Professional Optimization

---

## Current Status Assessment

### ✅ Completed Work
- Repository cleanup (108 files organized)
- Root directory: 8 essential files only
- Security hardening (SSH key removal, .gitignore)
- Essential docs created (CONTRIBUTING, CHANGELOG, LICENSE)
- Professional README with badges

### ⚠️ Remaining Issues

**GitHub Repository Settings** (Manual configuration needed):
1. Description not set
2. Topics not configured  
3. About section empty
4. Features not optimized (Wiki, Discussions)
5. No social preview image
6. Branch protection not configured (Phase 4 pending)
7. Secret scanning not enabled (Phase 4 pending)

**Code Quality**:
1. Some docs in `docs/guides/` could be consolidated
2. `docs/getting-started/` needs actual content (currently empty)
3. Temp submodule folders still present (temp_ai_gallery, etc.)
4. Missing docs/architecture/ content
5. No API documentation

**Repository Metadata**:
1. No GitHub releases/tags (should create v0.1.0)
2. No repository image/logo
3. No project boards set up
4. No issue templates
5. No PR templates

---

## Epic Breakdown (Beads)

### Epic: ved-repo-optimize - GitHub Repository Professional Optimization

**Goal**: Transform repository into production-ready, collaborative platform

**Success Criteria**:
- GitHub repository fully configured
- All documentation complete
- Auto-commit workflow functional
- Ready for public showcase

---

## Track 1: GitHub Configuration (Manual - Can't Automate)

### ved-gh-01: Configure Repository Settings
**Type**: task  
**Priority**: 0 (High)  
**Estimated**: 10 min  

**Description**:
Configure GitHub repository settings via web interface.

**Steps**:
1. Navigate to https://github.com/Luahoa/v-edfinance
2. Click "About" settings (⚙️ icon)
3. Add description:
   ```
   EdTech platform for financial education with gamification, AI mentor, and interactive simulations. Built with Next.js, NestJS, Prisma.
   ```
4. Add topics (space-separated):
   ```
   nextjs nestjs prisma edtech fintech gamification education financial-literacy typescript postgresql react tailwindcss i18n ai-mentor
   ```
5. Check features:
   - [x] Issues
   - [x] Discussions  
   - [ ] Wiki (disable - use docs/)
   - [x] Projects

**Acceptance**:
- [ ] Description visible on repository home
- [ ] 14 topics added
- [ ] Features configured

---

### ved-gh-02: Enable GitHub Security Features
**Type**: task  
**Priority**: 0 (High)  
**Estimated**: 15 min  
**Blocks**: ved-gh-01

**Description**:
Enable GitHub Advanced Security features (Phase 4 from security cleanup).

**Reference**: docs/archive/2026-01/planning/GITHUB_SECURITY_SETTINGS_GUIDE.md

**Steps**:
1. Go to Settings → Code security and analysis
2. Enable:
   - [x] Dependabot alerts
   - [x] Dependabot security updates
   - [x] Secret scanning (if available)
   - [x] Push protection (if available)
3. Go to Settings → Branches
4. Add branch protection rule for `main`:
   - [x] Require pull request before merging
   - [x] Require status checks to pass
   - [x] Require conversation resolution
   - [x] Include administrators
   - [x] Restrict force pushes

**Acceptance**:
- [ ] Security features enabled
- [ ] Branch protection active
- [ ] Verified in Security tab

---

## Track 2: Documentation Completion (Auto-commit)

### ved-doc-01: Create Getting Started Guide
**Type**: task  
**Priority**: 1 (Medium)  
**Estimated**: 20 min

**Description**:
Write comprehensive getting-started documentation.

**Files to create**:
- `docs/getting-started/README.md` (overview)
- `docs/getting-started/installation.md` (detailed setup)
- `docs/getting-started/development.md` (dev workflow)
- `docs/getting-started/first-contribution.md` (onboarding)

**Content structure**:
```markdown
# Getting Started with V-EdFinance

Quick start guide for developers.

## Prerequisites
- Node.js 18+, pnpm 8+, PostgreSQL 14+

## Installation
1. Clone repo
2. Install dependencies
3. Setup .env
4. Run migrations
5. Start dev servers

## Next Steps
- [Development Workflow](development.md)
- [Contributing](../../CONTRIBUTING.md)
```

**Auto-commit**:
```bash
git add docs/getting-started/
git commit -m "docs: add comprehensive getting-started guides

- Installation guide with prerequisites
- Development workflow documentation  
- First contribution onboarding
- Quick start overview

Refs: ved-doc-01"
```

**Acceptance**:
- [ ] 4 getting-started docs created
- [ ] Clear, actionable steps
- [ ] Linked from README
- [ ] Auto-committed to git

---

### ved-doc-02: Create Architecture Documentation
**Type**: task  
**Priority**: 1 (Medium)  
**Estimated**: 30 min  
**Blocks**: ved-doc-01

**Description**:
Document system architecture in detail.

**Files to create**:
- `docs/architecture/README.md` (overview)
- `docs/architecture/frontend.md` (Next.js structure)
- `docs/architecture/backend.md` (NestJS structure)
- `docs/architecture/database.md` (Prisma schema)
- `docs/architecture/deployment.md` (VPS + Cloudflare)

**Content** (extract from existing ARCHITECTURE.md):
- Frontend: App Router structure, component hierarchy
- Backend: Module structure, API endpoints
- Database: Entity relationships, migrations
- Deployment: VPS setup, monitoring

**Auto-commit**:
```bash
git add docs/architecture/
git commit -m "docs: add detailed architecture documentation

- Frontend structure (Next.js App Router)
- Backend modules (NestJS)
- Database schema (Prisma)
- Deployment architecture (VPS + Cloudflare)

Refs: ved-doc-02"
```

**Acceptance**:
- [ ] 5 architecture docs created
- [ ] Diagrams included (if applicable)
- [ ] Linked from main ARCHITECTURE.md
- [ ] Auto-committed

---

### ved-doc-03: Create API Documentation Stub
**Type**: task  
**Priority**: 2 (Low)  
**Estimated**: 15 min  
**Blocks**: ved-doc-02

**Description**:
Create API documentation structure (detailed API docs can come later).

**Files to create**:
- `docs/api/README.md` (API overview)
- `docs/api/authentication.md` (auth endpoints)
- `docs/api/courses.md` (course endpoints stub)
- `docs/api/gamification.md` (gamification endpoints stub)

**Auto-commit**:
```bash
git add docs/api/
git commit -m "docs: add API documentation structure

- API overview and conventions
- Authentication endpoints
- Course management endpoints (stub)
- Gamification endpoints (stub)

Full OpenAPI spec to be added later

Refs: ved-doc-03"
```

**Acceptance**:
- [ ] API doc structure created
- [ ] Placeholders for future expansion
- [ ] Linked from README
- [ ] Auto-committed

---

## Track 3: Repository Metadata (Auto-commit)

### ved-meta-01: Create GitHub Issue Templates
**Type**: task  
**Priority**: 1 (Medium)  
**Estimated**: 15 min

**Description**:
Create issue templates for bug reports and feature requests.

**Files to create**:
- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_request.md`
- `.github/ISSUE_TEMPLATE/config.yml`

**Template structure** (bug_report.md):
```yaml
---
name: Bug Report
about: Create a report to help us improve
title: '[BUG] '
labels: bug
assignees: ''
---

**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment**
- OS: [e.g. Windows 11]
- Browser: [e.g. Chrome 120]
- Version: [e.g. 0.1.0]
```

**Auto-commit**:
```bash
git add .github/ISSUE_TEMPLATE/
git commit -m "chore: add GitHub issue templates

- Bug report template
- Feature request template
- Template configuration

Makes it easier for contributors to report issues

Refs: ved-meta-01"
```

**Acceptance**:
- [ ] Bug report template created
- [ ] Feature request template created
- [ ] Templates work on GitHub
- [ ] Auto-committed

---

### ved-meta-02: Create Pull Request Template
**Type**: task  
**Priority**: 1 (Medium)  
**Estimated**: 10 min  
**Blocks**: ved-meta-01

**Description**:
Create PR template to standardize contributions.

**File to create**:
- `.github/pull_request_template.md`

**Template content**:
```markdown
## Description
<!-- Brief description of changes -->

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix/feature causing existing functionality to break)
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guide (AGENTS.md)
- [ ] All tests pass (`pnpm test`)
- [ ] No console.log() statements
- [ ] Documentation updated
- [ ] i18n translations added (if UI changes)

## Screenshots (if applicable)
<!-- Add screenshots for UI changes -->

## Related Issues
Closes #
```

**Auto-commit**:
```bash
git add .github/pull_request_template.md
git commit -m "chore: add pull request template

Standardizes PR submissions with:
- Change description
- Testing checklist
- Code quality checks

Refs: ved-meta-02"
```

**Acceptance**:
- [ ] PR template created
- [ ] Works on GitHub PRs
- [ ] Auto-committed

---

### ved-meta-03: Create GitHub Release v0.1.0
**Type**: task  
**Priority**: 1 (Medium)  
**Estimated**: 10 min  
**Blocks**: ved-meta-02

**Description**:
Create first GitHub release to mark MVP baseline.

**Steps**:
1. Create git tag:
   ```bash
   git tag -a v0.1.0 -m "Release v0.1.0 - MVP

   Initial MVP release with:
   - Frontend (Next.js 15, React 19)
   - Backend (NestJS, Prisma, PostgreSQL)
   - Gamification system
   - AI mentor integration
   - Multi-language support (vi/en/zh)
   - Payment integration (Stripe)
   
   See CHANGELOG.md for details"
   ```

2. Push tag:
   ```bash
   git push origin v0.1.0
   ```

3. Create release on GitHub:
   - Go to Releases → Draft new release
   - Choose tag: v0.1.0
   - Title: "v0.1.0 - MVP Release"
   - Description: Copy from CHANGELOG.md v0.1.0 section
   - Mark as "pre-release" if not production-ready

**Acceptance**:
- [ ] Git tag v0.1.0 created
- [ ] Tag pushed to GitHub
- [ ] Release published on GitHub
- [ ] Release notes complete

---

## Track 4: Final Cleanup (Auto-commit)

### ved-clean-01: Remove Temp Submodule Folders
**Type**: task  
**Priority**: 2 (Low)  
**Estimated**: 10 min

**Description**:
Remove temporary submodule folders that aren't needed.

**Folders to remove**:
- `temp_ai_gallery/`
- `temp_beads_viewer/`
- `temp_gemini_chatbot/`
- `temp_indie_tools/`
- `temp_skills/`

**Steps**:
```bash
# Remove submodules properly
git rm -r temp_ai_gallery temp_beads_viewer temp_gemini_chatbot temp_indie_tools temp_skills

# Or if not submodules, just delete
rm -rf temp_ai_gallery temp_beads_viewer temp_gemini_chatbot temp_indie_tools temp_skills

# Ensure in .gitignore
echo "temp_*/" >> .gitignore
```

**Auto-commit**:
```bash
git add -A
git commit -m "chore: remove temporary submodule folders

Removed unused temp folders:
- temp_ai_gallery
- temp_beads_viewer  
- temp_gemini_chatbot
- temp_indie_tools
- temp_skills

Added temp_*/ to .gitignore

Refs: ved-clean-01"
```

**Acceptance**:
- [ ] Temp folders removed
- [ ] .gitignore updated
- [ ] Auto-committed

---

### ved-clean-02: Consolidate Docs in docs/guides/
**Type**: task  
**Priority**: 2 (Low)  
**Estimated**: 15 min  
**Blocks**: ved-clean-01

**Description**:
Consolidate and organize documents in `docs/guides/`.

**Current files** (13 files - could be merged):
- BITVISE_IMPORT_KEY.md
- CERTIFICATE_SUBMODULE_FIX.md
- DEBUGGING_SKILLS_INTEGRATION.md
- DEBUG_SPEC.md
- DEVOPS_TOOLS_INVENTORY.md
- FRONTEND_SKILLS_INTEGRATION_GUIDE.md
- INCIDENTS.md
- MIGRATION_DRY_RUN_CHECKLIST.md
- SCHEMA_FIX_GUIDE.md
- WEB_BUILD_FIX.md
- implementation_plan.md
- incident-retrospective-template.md
- task.md

**Consolidation**:
1. Create `docs/guides/troubleshooting.md` (merge fix guides)
2. Create `docs/guides/skills-integration.md` (merge skill guides)
3. Keep incident templates as-is
4. Archive obsolete guides to docs/archive/

**Auto-commit**:
```bash
git add docs/guides/
git commit -m "docs: consolidate and organize guides

- Merged troubleshooting guides
- Consolidated skills integration docs
- Improved navigation
- Archived obsolete content

Refs: ved-clean-02"
```

**Acceptance**:
- [ ] Guides consolidated
- [ ] Clear navigation
- [ ] No duplicate content
- [ ] Auto-committed

---

## Execution Strategy

### Beads Workflow

**Step 1: Create Epic and Beads**
```bash
# Create epic
bd create "GitHub Repository Professional Optimization" -t epic -p 0

# Track 1: Manual GitHub config (can't automate)
bd create "Configure Repository Settings" -t task --blocks ved-repo-optimize -p 0
bd create "Enable GitHub Security Features" -t task --blocks ved-repo-optimize -p 0

# Track 2: Documentation (auto-commit)
bd create "Create Getting Started Guide" -t task --blocks ved-repo-optimize -p 1
bd create "Create Architecture Documentation" -t task --blocks ved-repo-optimize -p 1
bd create "Create API Documentation Stub" -t task --blocks ved-repo-optimize -p 2

# Track 3: Repository metadata (auto-commit)
bd create "Create GitHub Issue Templates" -t task --blocks ved-repo-optimize -p 1
bd create "Create Pull Request Template" -t task --blocks ved-repo-optimize -p 1
bd create "Create GitHub Release v0.1.0" -t task --blocks ved-repo-optimize -p 1

# Track 4: Final cleanup (auto-commit)
bd create "Remove Temp Submodule Folders" -t task --blocks ved-repo-optimize -p 2
bd create "Consolidate Docs in docs/guides/" -t task --blocks ved-repo-optimize -p 2

# Add dependencies
bd dep add ved-gh-01 ved-gh-02
bd dep add ved-doc-01 ved-doc-02
bd dep add ved-doc-02 ved-doc-03
bd dep add ved-meta-01 ved-meta-02
bd dep add ved-meta-02 ved-meta-03
bd dep add ved-clean-01 ved-clean-02
```

**Step 2: Execute with Beads Sync**
```bash
# Start work on first bead
bd update ved-gh-01 --status in_progress

# Complete and sync
bd close ved-gh-01 --reason "Repository settings configured - description, topics, features"
bd sync  # Auto-commit to git

# Continue with next beads...
```

**Step 3: Auto-commit Pattern**

For each documentation/code bead:
1. Do the work
2. Add files: `git add <files>`
3. Close bead with descriptive reason
4. Run `bd sync` to auto-commit
5. Beads sync will create commit with bead context

---

## Auto-commit Workflow

### Using Beads Sync

**Beads sync automatically**:
- Creates conventional commits
- Includes bead ID in commit message
- Tracks progress in git history
- Syncs with GitHub

**Example flow**:
```bash
# Work on ved-doc-01
bd update ved-doc-01 --status in_progress

# Create files
mkdir -p docs/getting-started
echo "# Installation Guide" > docs/getting-started/installation.md
# ... create other files ...

# Add to git
git add docs/getting-started/

# Close bead (beads sync will commit)
bd close ved-doc-01 --reason "Created getting-started guides: installation, development, first-contribution"

# Sync to git (auto-commit)
bd sync

# Push to GitHub
git push origin spike/simplified-nav
```

---

## Success Criteria

### GitHub Repository
- [x] Description set
- [x] Topics configured (14 topics)
- [x] Features optimized (Issues, Discussions enabled)
- [x] Branch protection active
- [x] Secret scanning enabled

### Documentation
- [x] Getting-started guides complete
- [x] Architecture docs detailed
- [x] API documentation structure created
- [x] All docs linked from README

### Repository Metadata
- [x] Issue templates created
- [x] PR template created
- [x] v0.1.0 release published
- [x] Tags and releases visible

### Code Quality
- [x] Temp folders removed
- [x] Docs consolidated
- [x] Clear navigation
- [x] No redundant files

### Git Hygiene
- [x] All work committed via beads sync
- [x] Conventional commit messages
- [x] Clear git history
- [x] All changes pushed to GitHub

---

## Timeline Estimate

| Track | Tasks | Total Time | Can Parallelize? |
|-------|-------|------------|------------------|
| Track 1 (Manual) | 2 tasks | 25 min | No (sequential) |
| Track 2 (Docs) | 3 tasks | 65 min | No (dependencies) |
| Track 3 (Meta) | 3 tasks | 35 min | Partial |
| Track 4 (Cleanup) | 2 tasks | 25 min | No (dependencies) |

**Total Sequential**: ~150 minutes (2.5 hours)  
**With Beads Workflow**: Organized, trackable, auto-committed

---

## Execution Plan

### Session 1: Manual Configuration (30 min)
1. Execute Track 1 beads (manual GitHub settings)
2. Verify security features enabled
3. Close beads, sync to git

### Session 2: Documentation (60 min)
1. Execute Track 2 beads (getting-started, architecture, API)
2. Auto-commit each bead via `bd sync`
3. Verify docs linked properly

### Session 3: Metadata & Cleanup (60 min)
1. Execute Track 3 beads (templates, release)
2. Execute Track 4 beads (cleanup, consolidation)
3. Final auto-commit and push
4. Verify repository on GitHub

---

**Prepared by**: Amp Planning Agent  
**Method**: Beads Workflow + Auto-commit  
**Ready to Execute**: ✅ Yes  
**Next Step**: Create epic and beads, begin execution
