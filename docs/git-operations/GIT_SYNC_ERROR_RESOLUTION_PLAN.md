# Git Sync Error Resolution Plan
**Created:** 2026-01-03  
**Epic:** ved-d5fa  
**Status:** 🔴 CRITICAL - 100+ untracked files blocking GitHub sync

## Problem Analysis

### Current Git Status
- **Branch:** main (up to date with origin/main locally, but massive uncommitted changes)
- **Modified files:** 18 tracked files with changes
- **Untracked files:** 100+ files (documentation, config, test artifacts, temp skills)
- **Submodule conflicts:** 2 submodules with modified/untracked content
  - `.agents/skills/command-suite`
  - `apps/api`

### Root Causes
1. **No .gitignore rules** for temp files, build artifacts, env files
2. **Submodule drift** - submodules not synced properly
3. **Massive feature development** - Multi-Agent Skill v2.0 + AI Testing Army + E2E tests created without incremental commits
4. **Beads metadata not synced** - .beads/issues.jsonl not committed to beads-sync branch

---

## Sprint Plan (Using Multi-Agent Orchestration Skill)

### Epic: Git Sync Error Resolution (ved-d5fa)
**Priority:** P1 (CRITICAL)  
**Goal:** Clean Git state, sync with GitHub, enable multi-agent collaboration

### Task Dependency Graph
```
ved-ql9x (Task 1: Audit) 
    ↓
ved-8rem (Task 2: Submodules) ──┐
    ↓                            │
ved-ymis (Task 3: .gitignore) ──┤
    ↓                            │
ved-kszd (Task 4: Stage) ────────┤
    ↓                            │
ved-591n (Task 6: Commit) ←──────┤ (also depends on ved-7wy4)
    ↓                            │
ved-p4me (Task 7: Push)          │
                                 │
ved-7wy4 (Task 5: Beads Sync) ───┘
```

---

## Task Breakdown

### Task 1: Audit Git Status & Classify Files (ved-ql9x)
**Priority:** P1  
**Estimate:** 30 minutes  
**Owner:** Agent-Audit

**Objective:** Understand what needs to be committed vs ignored

**Actions:**
1. Run `git status --short` to get machine-readable output
2. Classify 100+ untracked files into categories:
   - ✅ **Production code** (MUST commit):
     - `.agents/skills/multi-agent-orchestration/` - Multi-Agent Skill v2.0
     - `tests/e2e/` - E2E test cases
     - `temp_skills/e2e-test-agent/`, `temp_skills/testpilot/` - AI Testing tools
     - Key docs: `BEADS_INTEGRATION_DEEP_DIVE.md`, `MULTI_AGENT_*.md`
   
   - 🔄 **Config/Infrastructure** (selective commit):
     - `.env.e2b.example` - Example config (commit)
     - `.env.e2b`, `.env.testing` - Secrets (NEVER commit)
     - `docker-compose.dev.yml` - Dev infra (commit)
     - `libs/`, `config/netdata/` - Check if needed
   
   - ❌ **Ignore/Delete**:
     - Build artifacts: `api_build_success.txt`, `test-results/`
     - Temp files: `temp_skills/arbigent/`, `temp_skills/qa-use/`
     - Generated reports: `playwright-report/index.html`
     - VPS scripts with hardcoded IPs

3. Generate classification report → `GIT_AUDIT_REPORT.md`

**Success Criteria:**
- All files categorized
- No secrets identified for commit
- Clear list of production code to stage

---

### Task 2: Fix Submodule Conflicts (ved-8rem)
**Priority:** P1  
**Estimate:** 20 minutes  
**Owner:** Agent-Submodule  
**Blocks:** ved-ymis

**Objective:** Resolve submodule drift in `.agents/skills/command-suite` and `apps/api`

**Actions:**
1. Check submodule status:
   ```bash
   git submodule status
   git submodule foreach git status
   ```

2. For each submodule, choose strategy:
   - **Option A (Keep):** Commit submodule changes, update parent repo
     ```bash
     cd .agents/skills/command-suite
     git add -A && git commit -m "Update command suite"
     cd ../.. && git add .agents/skills/command-suite
     ```
   
   - **Option B (Reset):** Discard submodule changes, sync to remote
     ```bash
     git submodule update --init --recursive --force
     ```
   
   - **Option C (Remove):** Convert to regular directory (if not needed as submodule)
     ```bash
     git rm --cached .agents/skills/command-suite
     rm -rf .agents/skills/command-suite/.git
     ```

3. Verify clean state:
   ```bash
   git diff --submodule
   ```

**Success Criteria:**
- No "modified content, untracked content" warnings for submodules
- Git status shows clean submodule state

---

### Task 3: Update .gitignore Rules (ved-ymis)
**Priority:** P2  
**Estimate:** 15 minutes  
**Owner:** Agent-Config  
**Blocks:** ved-kszd

**Objective:** Add missing patterns to prevent future clutter

**Actions:**
1. Add to `.gitignore`:
   ```gitignore
   # Env files (secrets)
   .env.e2b
   .env.testing
   .env.local
   
   # Build artifacts
   api_build_success.txt
   coverage_*.txt
   test_output*.txt
   
   # Test results
   test-results/
   playwright-report/
   
   # Temp directories
   temp_skills/arbigent/
   temp_skills/qa-use/
   
   # Generated configs
   config/netdata/
   
   # VPS deployment scripts (project-specific)
   scripts/*-vps-*.ts
   scripts/deploy-*.ps1
   VPS_*.bat
   
   # Libraries (if auto-generated)
   libs/
   ```

2. Apply ignore rules retroactively:
   ```bash
   git rm -r --cached temp_skills/arbigent/
   git rm -r --cached temp_skills/qa-use/
   git rm --cached .env.e2b .env.testing
   ```

3. Verify:
   ```bash
   git status --short | wc -l  # Should drop significantly
   ```

**Success Criteria:**
- .gitignore updated
- Untracked files reduced from 100+ to ~30-40 (production code only)

---

### Task 4: Stage Production Code Only (ved-kszd)
**Priority:** P2  
**Estimate:** 20 minutes  
**Owner:** Agent-Stage  
**Blocks:** ved-591n

**Objective:** Selectively stage ONLY production-ready code

**Actions:**
1. Stage Multi-Agent Skill v2.0:
   ```bash
   git add .agents/skills/multi-agent-orchestration/
   ```

2. Stage E2E testing infrastructure:
   ```bash
   git add tests/e2e/
   git add temp_skills/e2e-test-agent/
   git add temp_skills/testpilot/
   git add run-e2e-tests.ts
   git add quick-test.ts
   ```

3. Stage critical documentation:
   ```bash
   git add BEADS_INTEGRATION_DEEP_DIVE.md
   git add MULTI_AGENT_INTEGRATION_PLAN.md
   git add MULTI_AGENT_SKILL_V2_COMPLETE.md
   git add AI_TESTING_ARMY_*.md
   git add GOOGLE_GEMINI_API_FOR_TESTING.md
   ```

4. Stage config (examples only):
   ```bash
   git add .env.e2b.example
   git add docker-compose.dev.yml
   ```

5. Stage modified production code:
   ```bash
   git add AGENTS.md
   git add apps/web/src/
   git add package.json pnpm-workspace.yaml
   ```

6. **DO NOT STAGE:**
   - Secrets: `.env.e2b`, `.env.testing`
   - Temp reports: `playwright-report/`, `test-results/`
   - VPS-specific scripts with IPs
   - Build artifacts

7. Review staged files:
   ```bash
   git diff --cached --name-only
   git diff --cached --stat
   ```

**Success Criteria:**
- Only production code staged
- No secrets in staged files (verify with `git diff --cached | grep -i "password\|api_key\|secret"`)
- ~30-50 files staged (not 100+)

---

### Task 5: Sync Beads Metadata to Git (ved-7wy4)
**Priority:** P1  
**Estimate:** 10 minutes  
**Owner:** Agent-Beads  
**Blocks:** ved-591n

**Objective:** Commit .beads/issues.jsonl to beads-sync branch

**Actions:**
1. Run beads sync:
   ```bash
   beads.exe sync
   ```

2. Verify sync:
   ```bash
   git log beads-sync -1
   git show beads-sync:.beads/issues.jsonl | grep ved-d5fa
   ```

3. If conflicts, resolve:
   ```bash
   git checkout beads-sync
   git pull --rebase origin beads-sync
   git checkout main
   beads.exe sync  # Retry
   ```

**Success Criteria:**
- `.beads/issues.jsonl` committed to beads-sync branch
- All tasks (ved-d5fa, ved-ql9x, etc.) visible in remote

---

### Task 6: Commit with Semantic Message (ved-591n)
**Priority:** P2  
**Estimate:** 10 minutes  
**Owner:** Agent-Commit  
**Blocks:** ved-p4me  
**Depends on:** ved-kszd (staging), ved-7wy4 (beads sync)

**Objective:** Create meaningful commit following Conventional Commits

**Actions:**
1. Verify all changes staged:
   ```bash
   git status --short
   ```

2. Create commit with detailed message:
   ```bash
   git commit -m "feat(orchestration): Add Multi-Agent Skill v2.0 + E2E testing infrastructure

   BREAKING CHANGES:
   - Introduced Multi-Agent Orchestration Skill (beads + beads_viewer + mcp_agent_mail)
   - Added AI Testing Army (e2e-test-agent with Gemini API, testpilot)
   - Created 7 production scripts for 100-agent coordination
   - Updated AGENTS.md with Beads Trinity workflow

   New Features:
   - Phase 1: CREATE - beads-plan-sprint.sh for sprint planning
   - Phase 2: REVIEW - beads-graph-audit.sh + beads-apply-recommendations.sh
   - Phase 3: EXECUTE - beads-smart-select.sh, beads-claim-task.sh
   - E2E tests with natural language test cases (6 tests: auth + courses)

   Documentation:
   - BEADS_INTEGRATION_DEEP_DIVE.md - Full integration architecture
   - MULTI_AGENT_INTEGRATION_PLAN.md - Deployment guide
   - AI_TESTING_ARMY_INTEGRATION_PLAN.md - Testing strategy

   Related Tasks:
   - ved-d5fa (Epic: Git Sync Error Resolution)
   - ved-ql9x, ved-8rem, ved-ymis, ved-kszd, ved-7wy4, ved-p4me
   "
   ```

3. Verify commit:
   ```bash
   git log -1 --stat
   git show --name-only
   ```

**Success Criteria:**
- Commit message follows Conventional Commits format
- All staged files included
- Beads task IDs referenced

---

### Task 7: Force Push with Lease (Safe) (ved-p4me)
**Priority:** P1  
**Estimate:** 5 minutes  
**Owner:** Agent-Deploy  
**Depends on:** ved-591n

**Objective:** Push to GitHub using safe force-push method

**Actions:**
1. Fetch latest remote state:
   ```bash
   git fetch origin main
   ```

2. Use `--force-with-lease` (safer than `--force`):
   ```bash
   git push --force-with-lease origin main
   ```
   
   **Why `--force-with-lease`?**
   - Checks if remote has new commits before overwriting
   - Prevents accidentally destroying others' work
   - Fails if someone pushed while you were working

3. If rejected (someone else pushed):
   ```bash
   git pull --rebase origin main
   # Resolve conflicts if any
   git push origin main  # Normal push, no force needed
   ```

4. Verify on GitHub:
   - Check commit appears in history
   - Verify files visible in repo
   - Confirm no secrets exposed

**Success Criteria:**
- Push succeeds to origin/main
- GitHub shows latest commit with Multi-Agent Skill
- No secrets visible in public repo

---

## Phase 2: Validation (Using Multi-Agent Skill)

### Run Graph Audit (beads-graph-audit.sh)
**When:** After creating all tasks  
**Purpose:** Pre-flight checks using beads_viewer

**Checks:**
- ✅ No circular dependencies
- ✅ All blockers defined
- ✅ Critical path identified
- ✅ PageRank priorities calculated

**Command:**
```bash
.agents/skills/multi-agent-orchestration/scripts/beads-graph-audit.sh ved-d5fa
```

### Apply Recommendations (beads-apply-recommendations.sh)
**When:** If audit finds issues  
**Purpose:** Auto-fix dependency issues

**Actions:**
- Fix missing dependencies
- Resolve priority conflicts
- Rebalance task graph

**Command:**
```bash
.agents/skills/multi-agent-orchestration/scripts/beads-apply-recommendations.sh --auto-apply
```

---

## Phase 3: Execution (Multi-Agent Deployment)

### Agent Assignment Strategy

| Agent | Task | Reason |
|-------|------|--------|
| Agent-Audit | ved-ql9x | Needs file system analysis skills |
| Agent-Submodule | ved-8rem | Git submodule expertise |
| Agent-Config | ved-ymis | .gitignore pattern knowledge |
| Agent-Stage | ved-kszd | Careful file selection, security awareness |
| Agent-Beads | ved-7wy4 | Beads CLI expertise |
| Agent-Commit | ved-591n | Git commit best practices |
| Agent-Deploy | ved-p4me | GitHub push permissions |

### Execution Commands

**1. Smart Task Selection:**
```bash
.agents/skills/multi-agent-orchestration/scripts/beads-smart-select.sh Agent-Audit
# Returns: ved-ql9x (highest PageRank + unblocked)
```

**2. Claim Task:**
```bash
.agents/skills/multi-agent-orchestration/scripts/beads-claim-task.sh ved-ql9x Agent-Audit
```

**3. Execute Work:**
```bash
# Agent performs task actions...
```

**4. Release Task:**
```bash
.agents/skills/multi-agent-orchestration/scripts/beads-release-task.sh ved-ql9x completed "File audit complete: 35 production files, 65 ignored"
```

**5. Monitor Progress:**
```bash
.agents/skills/multi-agent-orchestration/scripts/beads-unified-dashboard.sh
```

---

## Success Metrics

### Definition of Done
- [ ] All 7 tasks completed (ved-ql9x → ved-p4me)
- [ ] Git status shows clean working directory
- [ ] GitHub repo updated with Multi-Agent Skill v2.0
- [ ] Beads metadata synced to beads-sync branch
- [ ] No secrets exposed in public repo
- [ ] .gitignore prevents future clutter

### Quality Gates
- [ ] No submodule conflicts
- [ ] `git status` returns clean
- [ ] `git log origin/main..HEAD` shows 0 commits (after push)
- [ ] Beads graph has no cycles
- [ ] All agents can run `bd ready` and see unblocked work

---

## Risk Mitigation

### Risk 1: Secrets Exposed
**Mitigation:** 
- Task 4 includes secret scanning
- Manual review before commit
- GitHub secret scanning enabled

### Risk 2: Submodule Breaking
**Mitigation:**
- Option B (reset) is safest
- Test after submodule changes
- Document submodule strategy

### Risk 3: Force Push Destroys Work
**Mitigation:**
- Use `--force-with-lease` not `--force`
- Fetch before push
- Backup branch: `git branch backup-main`

### Risk 4: Beads Sync Conflicts
**Mitigation:**
- Sync early in workflow
- Use `beads.exe doctor` to verify health
- Manual resolution guide in BEADS_GUIDE.md

---

## Next Steps After Resolution

1. **Enable GitHub Actions:**
   - Automated testing on every push
   - Beads sync validation
   - Secret scanning

2. **Setup Multi-Agent CI/CD:**
   - Deploy agents in parallel
   - Quality gates per task
   - Automated merge requests

3. **Document Workflow:**
   - Update AGENTS.md with Git best practices
   - Create GIT_WORKFLOW_GUIDE.md
   - Train agents on commit protocol

---

## References

- **Multi-Agent Skill:** [.agents/skills/multi-agent-orchestration/SKILL.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/.agents/skills/multi-agent-orchestration/SKILL.md)
- **Beads Integration:** [BEADS_INTEGRATION_DEEP_DIVE.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/BEADS_INTEGRATION_DEEP_DIVE.md)
- **Beads Guide:** [BEADS_GUIDE.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/BEADS_GUIDE.md)
- **Agent Protocol:** [AGENTS.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/AGENTS.md)

---

**Created by:** Multi-Agent Orchestration Skill v2.0  
**Epic Tracker:** `beads.exe show ved-d5fa`  
**Dashboard:** `.agents/skills/multi-agent-orchestration/scripts/beads-unified-dashboard.sh`
