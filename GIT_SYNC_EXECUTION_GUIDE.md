# Git Sync Error Resolution - Execution Guide
**Using Multi-Agent Orchestration Skill v2.0**

## 🎯 Overview

Kế hoạch đã được tạo trong [GIT_SYNC_ERROR_RESOLUTION_PLAN.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/GIT_SYNC_ERROR_RESOLUTION_PLAN.md). Bây giờ sử dụng **Multi-Agent Orchestration Skill** để thực thi.

---

## 🚀 Phase 1: Setup & Validation

### Step 1: Verify Beads Tasks Created

```bash
# Check all Git sync tasks
beads.exe list --title-contains "Git" --status open

# Expected output:
# ved-d5fa - EPIC: Git Sync Error Resolution
# ved-ql9x - Task 1: Audit Git Status & Classify Files
# ved-8rem - Task 2: Fix Submodule Conflicts
# ved-ymis - Task 3: Update .gitignore Rules
# ved-kszd - Task 4: Stage Production Code Only
# ved-7wy4 - Task 5: Sync Beads Metadata to Git
# ved-591n - Task 6: Commit with Semantic Message
# ved-p4me - Task 7: Force Push with Lease (Safe)
```

### Step 2: Run Graph Audit (CRITICAL!)

**Purpose:** Validate task dependencies, detect cycles, calculate priorities

```bash
# NOTE: Script is bash, need WSL or Git Bash
# For Windows PowerShell, use manual beads_viewer commands below

# Option A: If you have bash/WSL
bash .agents/skills/multi-agent-orchestration/scripts/beads-graph-audit.sh ved-d5fa

# Option B: Manual beads_viewer commands (Windows-compatible)
# Install beads_viewer first if not installed:
# pip install beads_viewer

# Run audit checks
bv --robot-insights --format json > graph-insights.json
bv --robot-alerts --severity critical
bv --robot-suggest --top 5
```

**Expected Output:**
```
✅ Graph Health: HEALTHY
✅ Cycles: 0
✅ Orphaned Issues: 0
✅ Critical Path: ved-ql9x → ved-8rem → ved-ymis → ved-kszd → ved-591n → ved-p4me
✅ Bottlenecks: None
```

**If Errors Found:**
```bash
# Apply automatic fixes
bash .agents/skills/multi-agent-orchestration/scripts/beads-apply-recommendations.sh --auto-apply
```

---

## 🤖 Phase 2: Agent Deployment

### Deployment Strategy: Sequential Execution
**Reason:** Git tasks have strict dependencies - must run in order

| Step | Agent | Task ID | Estimated Time |
|------|-------|---------|----------------|
| 1 | Agent-Audit | ved-ql9x | 30 min |
| 2 | Agent-Submodule | ved-8rem | 20 min |
| 3 | Agent-Config | ved-ymis | 15 min |
| 4 | Agent-Stage | ved-kszd | 20 min |
| 5 | Agent-Beads | ved-7wy4 | 10 min |
| 6 | Agent-Commit | ved-591n | 10 min |
| 7 | Agent-Deploy | ved-p4me | 5 min |

**Total Time:** ~2 hours (if sequential)

---

## 📋 Task Execution Workflow

### Template for Each Task

```bash
# ═══════════════════════════════════════════════════════════
# STEP 1: Smart Task Selection
# ═══════════════════════════════════════════════════════════
# Uses AI (PageRank + Betweenness) to select best task
bash .agents/skills/multi-agent-orchestration/scripts/beads-smart-select.sh Agent-Audit

# Returns: ved-ql9x (highest priority + unblocked)

# ═══════════════════════════════════════════════════════════
# STEP 2: Claim Task (Atomic + File Lock)
# ═══════════════════════════════════════════════════════════
bash .agents/skills/multi-agent-orchestration/scripts/beads-claim-task.sh ved-ql9x Agent-Audit

# This does:
# 1. Sets task status to "in_progress"
# 2. Sets assignee to "Agent-Audit"
# 3. Creates advisory file lock (prevents conflicts)
# 4. Sends message to mcp_agent_mail (notifies other agents)

# ═══════════════════════════════════════════════════════════
# STEP 3: Execute Task Work
# ═══════════════════════════════════════════════════════════
# (Agent performs actual work - see task details below)

# ═══════════════════════════════════════════════════════════
# STEP 4: Release Task (Close + Unlock)
# ═══════════════════════════════════════════════════════════
bash .agents/skills/multi-agent-orchestration/scripts/beads-release-task.sh \
  ved-ql9x \
  completed \
  "File audit complete: 35 production files identified, 65 files to ignore"

# This does:
# 1. Sets task status to "completed"
# 2. Releases file locks
# 3. Sends completion notification
# 4. Syncs to beads-sync branch
```

---

## 🔧 Manual Execution (Windows PowerShell)

**If bash scripts don't work**, use manual beads commands:

### Task 1: Audit Git Status (ved-ql9x)

```powershell
# Claim task
beads.exe update ved-ql9x --status in_progress --assignee "Agent-Audit"

# Perform work
git status --short > git-status-output.txt

# Classify files (manual or script)
# Create: GIT_AUDIT_REPORT.md with file classifications

# Complete task
beads.exe close ved-ql9x --reason "Audit complete: 35 production, 65 ignored"
beads.exe sync
```

**Deliverable:** `GIT_AUDIT_REPORT.md` with file classifications

---

### Task 2: Fix Submodule Conflicts (ved-8rem)

```powershell
# Claim task
beads.exe update ved-8rem --status in_progress --assignee "Agent-Submodule"

# Check submodule status
git submodule status
git submodule foreach git status

# Strategy: Reset submodules (safest option)
git submodule update --init --recursive --force

# Verify clean
git status

# Complete task
beads.exe close ved-8rem --reason "Submodules synced to remote HEAD"
beads.exe sync
```

**Acceptance:** `git status` shows no submodule warnings

---

### Task 3: Update .gitignore (ved-ymis)

```powershell
# Claim task
beads.exe update ved-ymis --status in_progress --assignee "Agent-Config"

# Add to .gitignore (see plan for full list)
Add-Content .gitignore @"
# Secrets
.env.e2b
.env.testing

# Build artifacts
api_build_success.txt
test_output*.txt

# Temp directories
temp_skills/arbigent/
temp_skills/qa-use/
"@

# Apply ignore rules retroactively
git rm -r --cached temp_skills/arbigent/
git rm -r --cached temp_skills/qa-use/
git rm --cached .env.e2b .env.testing

# Verify
git status --short

# Complete task
beads.exe close ved-ymis --reason "Added 15 .gitignore patterns, untracked files reduced to 40"
beads.exe sync
```

**Acceptance:** Untracked files < 50

---

### Task 4: Stage Production Code (ved-kszd)

```powershell
# Claim task
beads.exe update ved-kszd --status in_progress --assignee "Agent-Stage"

# Stage Multi-Agent Skill
git add .agents/skills/multi-agent-orchestration/

# Stage E2E tests
git add tests/e2e/
git add temp_skills/e2e-test-agent/
git add temp_skills/testpilot/
git add run-e2e-tests.ts

# Stage critical docs
git add BEADS_INTEGRATION_DEEP_DIVE.md
git add MULTI_AGENT_INTEGRATION_PLAN.md
git add MULTI_AGENT_SKILL_V2_COMPLETE.md
git add AI_TESTING_ARMY_*.md

# Stage config examples
git add .env.e2b.example
git add docker-compose.dev.yml

# Stage modified code
git add AGENTS.md
git add apps/web/src/
git add package.json pnpm-workspace.yaml

# Security check: No secrets
git diff --cached | Select-String "password|api_key|secret|token" -CaseSensitive

# Review staged files
git diff --cached --name-only
git diff --cached --stat

# Complete task
beads.exe close ved-kszd --reason "Staged 42 production files, 0 secrets detected"
beads.exe sync
```

**Acceptance:** Secret scan returns 0 matches

---

### Task 5: Sync Beads Metadata (ved-7wy4)

```powershell
# Claim task
beads.exe update ved-7wy4 --status in_progress --assignee "Agent-Beads"

# Sync to beads-sync branch
beads.exe sync

# Verify
git log beads-sync -1
git show beads-sync:.beads/issues.jsonl | Select-String "ved-d5fa"

# Complete task
beads.exe close ved-7wy4 --reason "Beads metadata synced to beads-sync branch"
```

**Acceptance:** Git sync tasks visible in `beads-sync` branch

---

### Task 6: Commit with Semantic Message (ved-591n)

```powershell
# Claim task
beads.exe update ved-591n --status in_progress --assignee "Agent-Commit"

# Verify all changes staged
git status --short

# Create commit
git commit -m @"
feat(orchestration): Add Multi-Agent Skill v2.0 + E2E testing infrastructure

BREAKING CHANGES:
- Introduced Multi-Agent Orchestration Skill (beads + beads_viewer + mcp_agent_mail)
- Added AI Testing Army (e2e-test-agent with Gemini API, testpilot)
- Created 7 production scripts for 100-agent coordination
- Updated AGENTS.md with Beads Trinity workflow

New Features:
- Phase 1: CREATE - beads-plan-sprint.sh
- Phase 2: REVIEW - beads-graph-audit.sh + beads-apply-recommendations.sh
- Phase 3: EXECUTE - beads-smart-select.sh, beads-claim-task.sh
- E2E tests with natural language (6 tests: auth + courses)

Documentation:
- BEADS_INTEGRATION_DEEP_DIVE.md
- MULTI_AGENT_INTEGRATION_PLAN.md
- AI_TESTING_ARMY_INTEGRATION_PLAN.md

Related Tasks: ved-d5fa, ved-ql9x, ved-8rem, ved-ymis, ved-kszd, ved-7wy4, ved-p4me
"@

# Verify commit
git log -1 --stat

# Complete task
beads.exe close ved-591n --reason "Semantic commit created following Conventional Commits"
beads.exe sync
```

**Acceptance:** Commit message includes task IDs

---

### Task 7: Force Push with Lease (ved-p4me)

```powershell
# Claim task
beads.exe update ved-p4me --status in_progress --assignee "Agent-Deploy"

# Fetch latest remote
git fetch origin main

# Safe force push (checks remote state first)
git push --force-with-lease origin main

# If rejected (someone else pushed):
# git pull --rebase origin main
# git push origin main

# Verify on GitHub
Start-Process "https://github.com/Luahoa/v-edfinance/commits/main"

# Complete task
beads.exe close ved-p4me --reason "Successfully pushed to GitHub, no secrets exposed"
beads.exe sync
```

**Acceptance:** GitHub shows latest commit

---

## 📊 Monitoring Dashboard

### Real-time Progress Tracking

```bash
# Watch live dashboard (updates every 5 seconds)
bash .agents/skills/multi-agent-orchestration/scripts/beads-unified-dashboard.sh

# Output shows:
# - Active agents
# - Tasks in progress
# - Completed tasks
# - File locks
# - Recent messages
```

### Manual Status Check (Windows)

```powershell
# Check ready tasks
beads.exe ready

# Check in-progress tasks
beads.exe list --status in_progress

# Check completed tasks
beads.exe list --status completed --title-contains "Git"

# View Epic progress
beads.exe show ved-d5fa
```

---

## ✅ Validation & Success Criteria

### After Each Task

```powershell
# Run beads health check
beads.exe doctor

# Check for blockers
beads.exe ready | Select-String "ved-"
```

### Final Validation (After Task 7)

```powershell
# 1. Git status clean
git status
# Expected: "nothing to commit, working tree clean"

# 2. GitHub sync verified
git log origin/main..HEAD
# Expected: (empty - no local commits)

# 3. All tasks completed
beads.exe list --title-contains "Git" --status completed
# Expected: 7 tasks + 1 epic

# 4. Beads sync verified
git show beads-sync:.beads/issues.jsonl | Select-String "ved-d5fa"
# Expected: Shows Epic in beads-sync branch
```

---

## 🔥 Troubleshooting

### Problem: Bash scripts don't run on Windows

**Solution 1:** Install Git Bash
```powershell
# Run scripts with Git Bash
& "C:\Program Files\Git\bin\bash.exe" .agents/skills/multi-agent-orchestration/scripts/beads-smart-select.sh MyAgent
```

**Solution 2:** Use manual PowerShell commands (shown above)

**Solution 3:** Install WSL
```powershell
wsl --install
# Restart, then run scripts in WSL
```

---

### Problem: Submodules won't sync

**Solution:**
```powershell
# Nuclear option - remove submodules
git rm --cached .agents/skills/command-suite
git rm --cached apps/api
rm -r -Force .agents/skills/command-suite/.git
rm -r -Force apps/api/.git

# Treat as regular directories
git add .agents/skills/command-suite/
git add apps/api/
```

---

### Problem: Force push rejected

**Solution:**
```powershell
# Someone else pushed while you worked
git fetch origin main
git rebase origin/main

# Resolve conflicts if any
git status
# Fix conflicts, then:
git rebase --continue

# Try push again (no force needed after rebase)
git push origin main
```

---

### Problem: Secrets detected in staged files

**Solution:**
```powershell
# Find the secret
git diff --cached | Select-String "AIza|sk-|ghp_|xox" -Context 2

# Unstage file
git reset HEAD path/to/file

# Remove secret from file
# Edit file to remove secret

# Re-stage
git add path/to/file
```

---

## 🎯 Quick Start (TL;DR)

```powershell
# 1. Verify tasks created
beads.exe list --title-contains "Git" --status open

# 2. Execute tasks sequentially (manual mode)
beads.exe update ved-ql9x --status in_progress
# ... perform Task 1 work ...
beads.exe close ved-ql9x --reason "Complete"

beads.exe update ved-8rem --status in_progress
# ... perform Task 2 work ...
beads.exe close ved-8rem --reason "Complete"

# ... repeat for tasks 3-7 ...

# 3. Final validation
git status  # Should be clean
git push --force-with-lease origin main
beads.exe list --title-contains "Git" --status completed
```

---

## 📚 References

- **Main Plan:** [GIT_SYNC_ERROR_RESOLUTION_PLAN.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/GIT_SYNC_ERROR_RESOLUTION_PLAN.md)
- **Multi-Agent Skill:** [.agents/skills/multi-agent-orchestration/SKILL.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/.agents/skills/multi-agent-orchestration/SKILL.md)
- **Beads Guide:** [BEADS_GUIDE.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/BEADS_GUIDE.md)
- **Agent Protocol:** [AGENTS.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/AGENTS.md)

---

**Next Step:** Execute Task 1 (ved-ql9x) - Audit Git Status
