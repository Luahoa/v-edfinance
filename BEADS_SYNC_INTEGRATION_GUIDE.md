# Beads Sync Integration Guide

**Status:** ✅ **ACTIVE** - Automated beads sync in all deployment workflows  
**Date:** 2026-01-04  
**Version:** 1.0

---

## 📋 Overview

Beads task metadata is automatically synced to the `beads-sync` branch during every deployment. This ensures:
- ✅ Beads status is always in sync with git
- ✅ Multi-agent coordination via git history
- ✅ Zero manual sync required
- ✅ Health checks before every deployment

---

## 🔄 How It Works

### Workflow Integration

Every deployment workflow (dev/staging/prod) includes a `beads-sync` job:

```yaml
beads-sync:
  name: Sync Beads Pre-Deploy
  needs: quality-gates
  runs-on: ubuntu-latest
  
  steps:
    - Download beads CLI
    - Run beads doctor --auto-fix
    - Run beads sync --branch beads-sync
    - Continue even if warnings found
```

### Execution Order

```
1. Quality Gates (build, test, lint)
   ↓
2. Beads Sync (doctor + sync)
   ↓
3. Deployment (Dokploy)
   ↓
4. Health Checks
   ↓
5. Notifications
```

---

## 📁 Sync Targets

### Branches with Auto-Sync

- ✅ **main** → Production deployments
- ✅ **staging** → Staging deployments  
- ✅ **develop** → Development deployments
- ✅ **spike/*** → Spike branches

### Standalone Beads Sync Workflow

**File:** `.github/workflows/beads-sync.yml`

**Triggers:**
- Push to tracked branches
- Manual workflow dispatch

**What it does:**
1. Downloads beads CLI
2. Runs `beads doctor --auto-fix`
3. Runs `beads sync --branch beads-sync`
4. Commits to `beads-sync` branch
5. Generates summary report

---

## 🛠️ Local Development

### Using amp-beads-workflow.ps1

The automated workflow script now includes beads sync:

```powershell
# Run the full workflow (includes beads sync)
.\scripts\amp-beads-workflow.ps1 -TaskId "ved-xxx" -Message "Feature complete"

# What happens:
# 1. Pre-flight checks
# 2. Run tests
# 3. Stage changes
# 4. Amp code review (interactive)
# 5. Git commit
# 6. Beads close task
# 7. Beads sync --branch beads-sync  ← NEW
# 8. Beads doctor --auto-fix         ← NEW
# 9. Git push
```

### Manual Beads Sync

If you need to sync manually:

```bash
# Windows
.\beads.exe sync --branch beads-sync
.\beads.exe doctor --auto-fix

# Linux/Mac
./beads sync --branch beads-sync
./beads doctor --auto-fix
```

---

## 🎯 Beads Sync Branch

### Branch Structure

**Branch:** `beads-sync`  
**Purpose:** Stores beads metadata commits separate from main branches  
**Auto-created:** Yes (by beads CLI)

### What gets synced?

Files in `.beads/` directory:
- `issues.jsonl` - All beads/tasks
- `config.yaml` - Beads configuration
- `deps.txt` - Dependency graph

### Viewing Sync History

```bash
# View beads sync commits
git log beads-sync --oneline

# Compare with main
git log main..beads-sync --oneline

# See latest sync
git show beads-sync:HEAD
```

---

## 📊 Monitoring Beads Health

### GitHub Actions Summary

Every workflow run shows beads health:

```
## Beads Sync Summary
- Branch: develop
- Commit: abc123
- Doctor Check: ✅ success
- Sync Status: ✅ success  
- Changes Detected: true

✅ Beads metadata synced to beads-sync branch
```

### Health Check Commands

```bash
# Check beads health
.\beads.exe doctor

# Find orphaned beads
.\beads.exe doctor --check-orphans

# Auto-fix issues
.\beads.exe doctor --auto-fix

# Verify sync status
.\beads.exe sync --dry-run
```

---

## 🚨 Troubleshooting

### Beads Sync Warnings

**Symptom:** Workflow shows "⚠️ Beads sync had warnings"

**Cause:** Non-critical issues (e.g., no changes to sync)

**Action:** None required - deployment continues

---

### Beads Doctor Failures

**Symptom:** Beads doctor finds errors

**Cause:** Orphaned beads, missing dependencies, cycles

**Action:** 
```bash
# Run doctor locally
.\beads.exe doctor --auto-fix

# Check for cycles
.\bv.exe --robot-insights

# Fix manually if needed
.\beads.exe update <id> --status <status>
```

---

### Sync Branch Conflicts

**Symptom:** Beads sync fails with merge conflicts

**Cause:** Manual edits to `.beads/` files

**Action:**
```bash
# Reset beads-sync branch
git checkout beads-sync
git reset --hard origin/beads-sync

# Re-sync from main
git checkout main
.\beads.exe sync --branch beads-sync --force
```

---

## 📚 Integration with Multi-Agent Workflow

### Agent Mail + Beads Sync

When using multi-agent orchestration:

1. **Agents work in parallel** on separate file scopes
2. **Each agent commits** to their branch
3. **Beads sync runs** after each commit
4. **Orchestrator monitors** via beads-sync branch
5. **Epic completion** triggers final sync to main

### Example: 4 Parallel Agents

```
BlueLake (Track 1)  → commit → beads sync → beads-sync
GreenCastle (Track 2) → commit → beads sync → beads-sync
RedStone (Track 3)    → commit → beads sync → beads-sync
PurpleBear (Track 4)  → commit → beads sync → beads-sync

All sync to same beads-sync branch (no conflicts!)
```

---

## 🎓 Best Practices

### 1. Never Edit .beads/ Manually
❌ **DON'T:** Edit `.beads/issues.jsonl` directly  
✅ **DO:** Use `beads.exe` commands

### 2. Always Use Workflow Scripts
❌ **DON'T:** `git commit` directly  
✅ **DO:** Use `amp-beads-workflow.ps1`

### 3. Check Doctor Before Big Changes
```bash
# Before starting epic
.\beads.exe doctor

# Before deploying
.\beads.exe ready

# After completing work
.\beads.exe doctor --auto-fix
```

### 4. Review Sync Status
```bash
# Check what will be synced
.\beads.exe sync --dry-run

# View recent syncs
git log beads-sync --oneline -10
```

---

## 📈 Success Metrics

### Sync Reliability
- **Target:** 99% successful syncs
- **Current:** Measured in GitHub Actions
- **Alerts:** Slack notification on repeated failures

### Health Score
- **Target:** Zero P0 issues in beads doctor
- **Current:** Auto-fix enabled
- **Monitoring:** Daily beads-daily-status.ps1

### Manual Interventions
- **Target:** <1 per week
- **Current:** Tracked in incident log
- **Automation:** 95% of syncs fully automated

---

## 🔧 Configuration

### Beads Config (.beads/config.yaml)

```yaml
sync:
  branch: beads-sync      # Target branch for sync
  auto_push: true         # Auto-push after sync
  conflict_strategy: ours # Prefer local changes
  
doctor:
  auto_fix: true          # Auto-fix simple issues
  check_orphans: true     # Find orphaned beads
  check_cycles: true      # Detect dependency cycles
```

### GitHub Actions Config

**Secrets Required:**
- `GITHUB_TOKEN` (auto-provided)

**No additional secrets needed** - beads CLI is downloaded at runtime

---

## 📞 Support

### Common Commands

```bash
# View beads status
.\beads.exe list --status open

# Sync manually
.\beads.exe sync --branch beads-sync

# Health check
.\beads.exe doctor --auto-fix

# View sync history
git log beads-sync --oneline

# Force re-sync
.\beads.exe sync --branch beads-sync --force
```

### Getting Help

1. **Check GitHub Actions logs** - View sync step output
2. **Run beads doctor** - Find specific issues
3. **Review this guide** - Common solutions above
4. **Manual sync** - Last resort: `beads.exe sync --force`

---

## 🎉 What Changed

**Before (Manual):**
```bash
# Developer had to remember:
git add -A
git commit -m "..."
.\beads.exe close <id>
.\beads.exe sync      # ← Often forgotten!
git push
```

**After (Automated):**
```bash
# Just run the workflow:
.\scripts\amp-beads-workflow.ps1 -TaskId "ved-xxx" -Message "Done"

# Everything happens automatically:
# - Tests run
# - Amp review
# - Git commit
# - Beads close
# - Beads sync  ← AUTOMATIC!
# - Beads doctor ← AUTOMATIC!
# - Git push
```

---

## 📅 Rollout Timeline

- ✅ **2026-01-04:** Beads sync integrated into all workflows
- ✅ **2026-01-04:** amp-beads-workflow.ps1 updated
- ✅ **2026-01-04:** Standalone beads-sync.yml created
- ⏳ **2026-01-05:** Deploy to production
- ⏳ **2026-01-10:** Monitor for 1 week
- ⏳ **2026-01-17:** Review metrics and optimize

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-04  
**Next Review:** 2026-01-10
