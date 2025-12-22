# 🤖 Agent Commit Authority & Guidelines

**Version:** 1.0  
**Effective Date:** 2025-12-22  
**Scope:** All AI Agents working on v-edfinance

---

## 📜 Agent Authority Declaration

### ✅ **Full Authority Granted to AI Agents**

**User (luaho) hereby grants AI Agents FULL AUTHORITY to:**

1. **Commit Code**
   - Implement features per task specifications
   - Write tests (unit, integration, E2E)
   - Refactor code for quality improvements
   - Fix bugs and issues
   - Update documentation

2. **Execute Workflow**
   - Run automated workflow scripts
   - Stage changes (`git add`)
   - Create commits (`git commit`)
   - Push to remote (`git push`)
   - Close beads tasks (`beads close`)
   - Sync beads metadata (`beads sync`)

3. **Code Generation & Regeneration**
   - Generate new code files
   - Regenerate code based on Amp review feedback
   - Refactor existing code
   - Delete obsolete code (with documentation)

4. **Quality Control**
   - Run tests and linters
   - Fix TypeScript errors
   - Address build failures
   - Implement Amp review suggestions

---

## 🚫 Restrictions (Agent MUST Ask First)

**Agent MUST get user approval for:**

1. **Breaking Changes**
   - API endpoint changes that break clients
   - Database schema changes (migrations)
   - Major refactoring (>500 lines)
   - Dependency version upgrades (major versions)

2. **Data Operations**
   - Deleting database tables
   - Dropping columns
   - Data migrations affecting production

3. **Infrastructure Changes**
   - Dockerfile modifications
   - CI/CD pipeline changes
   - Environment variable changes
   - Deployment configurations

4. **Security-Sensitive Changes**
   - Authentication/authorization logic
   - Secrets management
   - CORS policies
   - Rate limiting rules

5. **File Deletions**
   - Deleting existing features
   - Removing entire modules
   - Deleting test files

---

## 🎯 Mandatory Workflow for Commits

### **RULE: NO MANUAL COMMITS**

**Agent MUST use workflow script for ALL commits:**

```bash
# Windows PowerShell
.\scripts\amp-beads-workflow.ps1 -TaskId "ved-XXX" -Message "Description"

# Linux/Mac
./scripts/amp-beads-workflow.sh ved-XXX "Description"
```

### **Why This Matters:**

```bash
# ❌ NEVER do this (bypasses quality gates)
git add -A
git commit -m "feat: implement feature"
git push

# ✅ ALWAYS do this (enforces quality)
.\scripts\amp-beads-workflow.ps1 -TaskId "ved-XXX" -Message "implement feature"
# → Tests run
# → Amp reviews code
# → Beads task closed
# → Metadata synced
# → All pushed together
```

---

## 🔒 Git Hook Protection

### Pre-commit Hook (Installed)

**Location:** `.git/hooks/pre-commit`

**What it does:**
- Blocks direct `git commit` commands
- Enforces use of workflow script
- Allows commits ONLY from workflow script (via `AMP_BEADS_WORKFLOW=1` env var)

**Bypass (Emergency Only):**
```bash
# For emergency hotfixes
export AMP_BEADS_WORKFLOW=1
git commit -m "emergency: ..."
git push

# ⚠️ Still must sync beads after:
./beads.exe close ved-XXX --reason "Emergency: ..."
./beads.exe sync
```

---

## 📋 Agent Session Workflow

### **Complete Session Example:**

```powershell
# ═══════════════════════════════════════════════════════════
# SESSION START
# ═══════════════════════════════════════════════════════════

# 1. Sync state
git pull --rebase
.\beads.exe sync
.\beads.exe doctor

# 2. Find work
.\beads.exe ready

# 3. Claim task
.\beads.exe update ved-296 --status in_progress

# ═══════════════════════════════════════════════════════════
# IMPLEMENTATION
# ═══════════════════════════════════════════════════════════

# 4. Implement feature
# ... create files ...
# ... write tests ...

# 5. Verify locally
cd apps/api
pnpm build
pnpm test

# ═══════════════════════════════════════════════════════════
# COMMIT (AUTOMATED WORKFLOW)
# ═══════════════════════════════════════════════════════════

# 6. Run workflow script (MANDATORY)
cd ../..
.\scripts\amp-beads-workflow.ps1 `
  -TaskId "ved-296" `
  -Message "Optimization Controller with 5 endpoints + 13 tests"

# Script executes:
# → Pre-flight checks
# → Run tests
# → Stage changes
# → Amp review (PAUSE - interactive)
# → Git commit
# → Beads close
# → Beads sync
# → Git push

# ═══════════════════════════════════════════════════════════
# VERIFICATION
# ═══════════════════════════════════════════════════════════

# 7. Verify completion
.\beads.exe show ved-296     # Status: completed
git log --oneline -3          # See commits
git status                    # Clean, up to date

# ═══════════════════════════════════════════════════════════
# SESSION END
# ═══════════════════════════════════════════════════════════

# 8. Final sync check
.\beads.exe doctor
.\beads.exe ready             # Check for next task
```

---

## 🎨 Commit Message Standards

### **Conventional Commits (MANDATORY)**

```bash
<type>: <description> (<task-id>)

Examples:
feat: Add OptimizationController with RAG search (ved-296)
fix: Resolve TypeScript errors in database service (ved-297)
docs: Update API documentation with new endpoints (ved-298)
refactor: Simplify Drizzle schema definition (ved-299)
test: Add integration tests for Amp review workflow (ved-300)
chore: Update dependencies for security patches (ved-301)
```

### **Type Reference:**

| Type | Usage |
|------|-------|
| `feat` | New features, enhancements |
| `fix` | Bug fixes |
| `docs` | Documentation only |
| `refactor` | Code refactoring (no behavior change) |
| `test` | Test additions/updates |
| `chore` | Build, tooling, dependencies |
| `perf` | Performance improvements |
| `style` | Code style (formatting, no logic change) |

---

## 🔍 Amp Review Integration

### **When Workflow Script Pauses for Review:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  AMP REVIEW CHECKPOINT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Options:
  1. Let Amp review now (recommended)
  2. Skip review and commit
  3. Cancel workflow
```

### **Agent's Response:**

#### **Option 1: Amp Review (Recommended)**

**Agent should:**
1. Inform user: "Pausing for Amp review. Review file: `review-ved-XXX.txt`"
2. Wait for Amp to analyze diff
3. If Amp suggests improvements:
   - Implement improvements
   - Re-run workflow from start
4. If Amp approves:
   - Press Enter to continue workflow

#### **Option 2: Skip Review**

**Agent can skip if:**
- Trivial changes (typo fix, comment update)
- Urgent hotfix (security patch)
- Documentation-only changes

**Agent should:**
- Select option 2
- Document reason: "Skipping review: [reason]"

#### **Option 3: Cancel**

**Agent should cancel if:**
- Realized implementation is wrong
- Need to consult user first
- Breaking change detected

---

## 📊 Quality Gates (Auto-enforced by Workflow)

### **Gate 1: Tests**
```bash
cd apps/api
pnpm build       # Must succeed
pnpm test        # Must pass (or acknowledge failures)
```

### **Gate 2: Code Review**
- Amp analyzes diff
- Suggests improvements
- Agent implements or justifies skipping

### **Gate 3: Beads Coordination**
- Task closed in beads
- Metadata synced to remote
- No orphaned tasks

### **Gate 4: Git Hygiene**
- Clean commit history
- Proper commit messages
- All commits pushed

---

## 🚨 Handling Manual "Commit All" Clicks

### **Scenario: User clicks "Commit All" in VSCode**

**Pre-commit hook will BLOCK it:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ❌ DIRECT COMMIT BLOCKED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Manual commits are not allowed. Use the workflow script:

  Windows PowerShell:
    .\scripts\amp-beads-workflow.ps1 -TaskId "ved-XXX" -Message "..."

  Linux/Mac:
    ./scripts/amp-beads-workflow.sh ved-XXX "..."
```

**If user bypasses hook and commits anyway:**

**Agent should detect and fix:**

```powershell
# Detect manual commit
$lastCommit = git log -1 --oneline

# Check if beads was synced
$beadsStatus = .\beads.exe show ved-XXX 2>&1

if ($beadsStatus -notmatch "completed") {
    Write-Host "⚠️ Detected manual commit without beads sync!"
    Write-Host "Fixing workflow..."
    
    # Rollback commit (keep changes)
    git reset --soft HEAD~1
    
    # Run proper workflow
    .\scripts\amp-beads-workflow.ps1 -TaskId "ved-XXX" -Message "..."
}
```

---

## 🎓 Best Practices for Agents

### **1. Always Verify Before Committing**

```bash
# Pre-commit checklist
✅ Tests pass
✅ Build succeeds
✅ No TypeScript errors
✅ Lint clean
✅ Task ID known (ved-XXX)
✅ Commit message ready
```

### **2. Descriptive Commit Messages**

```bash
# ❌ BAD
feat: update code (ved-296)

# ✅ GOOD
feat: Add OptimizationController with 5 admin endpoints, RAG search, and 13 passing tests (ved-296)
```

### **3. Atomic Commits**

```bash
# One logical change per commit
feat: Add OptimizationController (ved-296)
test: Add controller tests (ved-296)
docs: Update API documentation (ved-296)

# NOT a single giant commit with everything
```

### **4. Test-Driven Development**

```bash
# Write tests BEFORE implementation
1. Create test file: optimization.controller.spec.ts
2. Write failing tests
3. Implement controller to make tests pass
4. Run workflow script (tests will pass)
```

### **5. Respond to Amp Review Feedback**

```bash
# If Amp suggests improvements
1. Acknowledge: "Implementing Amp's suggestion to use const instead of let"
2. Make changes
3. Re-run tests
4. Re-run workflow (Amp review again)
5. Continue when approved
```

---

## 📝 Decision Matrix: When to Ask User

| Scenario | Agent Decision | Ask User? |
|----------|----------------|-----------|
| Implement new feature (task in beads) | Proceed | ❌ No |
| Write unit tests | Proceed | ❌ No |
| Fix TypeScript errors | Proceed | ❌ No |
| Commit via workflow script | Proceed | ❌ No |
| Regenerate code (Amp review feedback) | Proceed | ❌ No |
| Refactor <500 lines | Proceed | ❌ No |
| Update documentation | Proceed | ❌ No |
| ─────────────────── | ────── | ────── |
| Database migration (schema change) | STOP | ✅ Yes |
| Delete existing feature | STOP | ✅ Yes |
| Major refactor >500 lines | STOP | ✅ Yes |
| Change API endpoints (breaking) | STOP | ✅ Yes |
| Upgrade major dependencies | STOP | ✅ Yes |
| Modify CI/CD pipeline | STOP | ✅ Yes |

---

## 🔗 Related Documents

- [AGENTS.md](../AGENTS.md) - Main agent guidelines
- [AMP_BEADS_INTEGRATION_GUIDE.md](AMP_BEADS_INTEGRATION_GUIDE.md) - Complete workflow guide
- [BEADS_MULTI_AGENT_PROTOCOL.md](BEADS_MULTI_AGENT_PROTOCOL.md) - Multi-agent coordination
- [STRATEGIC_DEBT_PAYDOWN_PLAN.md](../STRATEGIC_DEBT_PAYDOWN_PLAN.md) - Quality standards

---

## ✅ Agent Acknowledgment

**By executing tasks in this repository, AI Agents acknowledge:**

1. ✅ Full authority to commit code via workflow script
2. ✅ Obligation to use ONLY the workflow script (no manual commits)
3. ✅ Responsibility to run tests and ensure quality
4. ✅ Requirement to respond to Amp review feedback
5. ✅ Duty to sync beads metadata after each commit
6. ✅ Commitment to ask user for breaking changes
7. ✅ Understanding of restrictions (database migrations, etc.)

---

**Authority Granted By:** User (luaho)  
**Effective Date:** 2025-12-22  
**Last Updated:** 2025-12-22  
**Version:** 1.0
