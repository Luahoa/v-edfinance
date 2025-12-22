# 🤖 Amp Auto-Regenerate Workflow Guide

## 📋 Tổng Quan

**Amp Auto-Regenerate Workflow** tự động chấp nhận mọi đề xuất từ Amp review và regenerate code cho đến khi Amp approve.

### 🎯 Mục Tiêu

- ✅ Agent tự động regenerate code theo Amp suggestions
- ✅ Không cần user can thiệp (trừ khi max iterations)
- ✅ Quality gates tự động (tests, Amp review, commit)
- ✅ Iterative improvement (max 3 lần)

---

## 🚀 Sử Dụng

### **Basic Usage**
```powershell
# Windows PowerShell
.\scripts\amp-auto-workflow.ps1 -TaskId "ved-XXX" -Message "Feature description"

# Workflow tự động:
# Iteration 1: Tests → Diff → Amp review → Regenerate
# Iteration 2: Tests → Diff → Amp review → Regenerate
# Iteration 3: Tests → Diff → Amp review → APPROVED → Commit
```

### **Advanced Options**
```powershell
# Skip tests (faster iteration)
.\scripts\amp-auto-workflow.ps1 -TaskId "ved-XXX" -Message "..." -SkipTests

# Custom commit type
.\scripts\amp-auto-workflow.ps1 -TaskId "ved-XXX" -Message "..." -CommitType "fix"

# Increase max iterations
.\scripts\amp-auto-workflow.ps1 -TaskId "ved-XXX" -Message "..." -MaxIterations 5
```

---

## 🔄 Workflow Flow

```
┌─────────────────────────────────────────────────────────────┐
│             AMP AUTO-REGENERATE WORKFLOW                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   START                                                      │
│     ↓                                                        │
│   [Iteration 1]                                             │
│     ├─ Run Tests                                            │
│     ├─ Generate Diff                                        │
│     ├─ Amp Review                                           │
│     └─ Decision?                                            │
│         ├─ APPROVED → COMMIT ✅                             │
│         ├─ NEEDS WORK → REGENERATE → [Iteration 2]         │
│         └─ CANCEL → EXIT ❌                                 │
│                                                              │
│   [Iteration 2]                                             │
│     ├─ Run Tests (on regenerated code)                     │
│     ├─ Generate Diff                                        │
│     ├─ Amp Review                                           │
│     └─ Decision?                                            │
│         ├─ APPROVED → COMMIT ✅                             │
│         ├─ NEEDS WORK → REGENERATE → [Iteration 3]         │
│         └─ CANCEL → EXIT ❌                                 │
│                                                              │
│   [Iteration 3]                                             │
│     ├─ Run Tests                                            │
│     ├─ Generate Diff                                        │
│     ├─ Amp Review                                           │
│     └─ Decision?                                            │
│         ├─ APPROVED → COMMIT ✅                             │
│         ├─ NEEDS WORK → MAX REACHED → OVERRIDE?            │
│         └─ CANCEL → EXIT ❌                                 │
│                                                              │
│   COMMIT PHASE                                              │
│     ├─ Git Commit                                           │
│     ├─ Beads Close Task                                     │
│     ├─ Beads Sync                                           │
│     └─ Git Push                                             │
│                                                              │
│   ✅ COMPLETE                                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Iteration Process

### **Iteration 1**

```powershell
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ITERATION 1 / 3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[STEP 1] Running Tests...
  → Building... ✅
  → Testing... ✅

[STEP 2] Generating Code Review...
  → Review file: review-ved-XXX.txt

[STEP 3] Amp Auto-Review...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🤖 AMP REVIEW MODE: AUTOMATED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Review File: review-ved-XXX.txt
Task: ved-XXX
Iteration: 1 / 3

Instructions for Amp:
  1. Review the diff in review-ved-XXX.txt
  2. If code is PERFECT:
     → Say 'APPROVED' or 'LGTM'
     → Workflow will commit and push

  3. If code NEEDS IMPROVEMENT:
     → Provide specific line-by-line suggestions
     → Agent will AUTOMATICALLY regenerate code
     → Loop continues until approved

⏸️  WAITING FOR AMP REVIEW...

Press Enter after Amp has reviewed the code...
```

### **Amp Review (User Input)**

**User pastes diff to Amp:**
```
Amp, review this code:
[Paste content from review-ved-XXX.txt]

Check for:
- TypeScript type safety
- Performance issues
- Security vulnerabilities
- Code quality
```

**Amp Response Option 1: APPROVED**
```
LGTM! Code is production-ready:
✅ Type safety excellent
✅ No performance concerns
✅ Security looks good
✅ Tests comprehensive
```

**Amp Response Option 2: NEEDS WORK**
```
Needs improvements:

1. Line 45: Use `const` instead of `let` (no reassignment)
2. Line 67: Extract magic number to constant
3. Line 89: Add input validation for userId
4. Line 102: Type should be `Promise<User>` not `any`
5. Tests: Add edge case for empty array
```

### **Script Decision Prompt**

```
[STEP 4] Amp Decision...

Did Amp approve the code?
  1. APPROVED - Code is perfect, commit now
  2. NEEDS WORK - Amp provided suggestions, regenerate
  3. CANCEL - Stop workflow

Enter choice (1-3): 2
```

### **Auto-Regeneration (Option 2 Selected)**

```
🔄 Amp requests changes. Auto-regenerating...

[STEP 5] Auto-Regenerating Code...

Instructions for Agent:
  → Implement ALL suggestions from Amp review
  → Fix TypeScript errors
  → Update tests if needed
  → Ensure build passes

⏸️  Agent, please regenerate code now...
Press Enter when regeneration is complete...
```

**Agent implements changes:**
```typescript
// Before (Iteration 1)
let userId = req.params.id; // Line 45 - Amp suggested const

// After (Regeneration)
const userId = req.params.id; // Line 45 - Fixed

// Before
const limit = 100; // Line 67 - Magic number

// After
const DEFAULT_LIMIT = 100; // Line 67 - Extracted constant
const limit = DEFAULT_LIMIT;

// ... etc for all 5 suggestions
```

**Press Enter → Iteration 2 starts**

---

## 🎯 Decision Points

### **Decision 1: Amp Approved**
```
Enter choice (1-3): 1

✅ Amp APPROVED! Proceeding to commit...
[Skips remaining iterations, goes to COMMIT PHASE]
```

### **Decision 2: Needs Work**
```
Enter choice (1-3): 2

🔄 Amp requests changes. Auto-regenerating...
[Agent regenerates code]
[Next iteration starts]
```

### **Decision 3: Cancel**
```
Enter choice (1-3): 3

❌ Workflow cancelled by user
[Unstages changes, exits]
```

---

## 📊 Max Iterations Handling

### **Scenario: 3 Iterations, No Approval**

```
⚠️  Max iterations (3) reached without Amp approval!
Options:
  1. Commit anyway (override)
  2. Cancel workflow

Enter choice (1-2): 1

Proceeding with commit (manual override)...
[Commits with note: "3 iterations with Amp review"]
```

### **Override Commit Message**
```
feat: Optimization Controller (ved-296) - 3 iterations with Amp review
```

---

## 📝 Output Files

### **1. Review File: `review-ved-XXX.txt`**
Contains git diff for each iteration
```diff
diff --git a/apps/api/src/controller.ts b/apps/api/src/controller.ts
index a1b2c3d..e4f5g6h 100644
--- a/apps/api/src/controller.ts
+++ b/apps/api/src/controller.ts
@@ -45,7 +45,7 @@
- let userId = req.params.id;
+ const userId = req.params.id;
```

### **2. Regeneration Log: `regeneration-ved-XXX.log`**
Tracks all iterations
```
2025-12-22 21:00:00 - Starting iteration 1
2025-12-22 21:01:30 - Tests passed at iteration 1
2025-12-22 21:02:00 - Generated diff for iteration 1
2025-12-22 21:03:00 - Paused for Amp review at iteration 1
2025-12-22 21:05:00 - Amp requested changes at iteration 1 - auto-regenerating
2025-12-22 21:07:00 - Code regenerated at iteration 1
2025-12-22 21:07:10 - Starting iteration 2
2025-12-22 21:08:40 - Tests passed at iteration 2
2025-12-22 21:09:00 - Generated diff for iteration 2
2025-12-22 21:09:30 - Paused for Amp review at iteration 2
2025-12-22 21:10:00 - Amp approved code at iteration 2
2025-12-22 21:10:30 - Committed: a1b2c3d - feat: Optimization Controller (ved-296)
2025-12-22 21:10:45 - Beads task closed
2025-12-22 21:11:00 - Beads synced
2025-12-22 21:11:15 - Pushed to remote
```

---

## 🎓 Best Practices

### **1. Clear Amp Instructions**

**Good Prompt:**
```
Amp, review this code for VED-296:
[Paste diff]

Check:
1. TypeScript type safety (no any)
2. NestJS best practices
3. Performance (N+1 queries, caching)
4. Security (input validation)
5. Test coverage

If PERFECT: Say "APPROVED"
If NEEDS WORK: Provide line-by-line suggestions
```

### **2. Agent Regeneration Workflow**

```typescript
// Step 1: Read Amp suggestions
// Step 2: For each suggestion:
//   - Locate the code
//   - Implement fix
//   - Verify syntax
// Step 3: Run tests locally
// Step 4: Press Enter in script
```

### **3. Iteration Strategy**

```
Iteration 1: Implement feature (agent's best attempt)
Iteration 2: Fix Amp suggestions (refine code quality)
Iteration 3: Final polish (edge cases, optimization)
```

### **4. When to Override**

```
✅ OVERRIDE (commit anyway) if:
- Amp suggestions are subjective (style preferences)
- Feature is urgent (hotfix)
- Suggestions require breaking changes (out of scope)

❌ DON'T OVERRIDE if:
- Security vulnerabilities detected
- Tests failing
- TypeScript errors present
```

---

## 🚨 Troubleshooting

### **Problem 1: Tests fail after regeneration**

**Solution:**
```powershell
# Agent should fix tests in regeneration step
# Then re-run workflow
.\scripts\amp-auto-workflow.ps1 -TaskId "ved-XXX" -Message "..."
```

### **Problem 2: Amp keeps rejecting (infinite loop)**

**Solution:**
```powershell
# Increase max iterations
.\scripts\amp-auto-workflow.ps1 -TaskId "ved-XXX" -Message "..." -MaxIterations 5

# Or consult with user
# "Amp rejected 3 times. Manual review needed."
```

### **Problem 3: Regeneration introduces new bugs**

**Solution:**
```bash
# Roll back to previous iteration
git reset --soft HEAD~1

# Fix manually
# Then restart workflow
```

---

## 📚 Comparison: Auto vs Manual

| Feature | Auto-Regenerate | Manual Review |
|---------|-----------------|---------------|
| Speed | ⚡ Fast (3-5 min/iteration) | 🐌 Slow (10+ min) |
| User Input | ✅ Minimal (Amp decisions only) | ❌ High (every decision) |
| Code Quality | ✅ High (Amp-approved) | ✅ High (Amp-approved) |
| Iterations | ✅ Auto-loops | ❌ Manual restart |
| Best For | Production code | Learning/exploration |

---

## ✅ Success Criteria

**Workflow succeeds when:**
- ✅ Amp approves code (or max iterations override)
- ✅ Tests pass
- ✅ Code committed
- ✅ Beads task closed
- ✅ Metadata synced
- ✅ Pushed to remote

---

**Created:** 2025-12-22  
**Last Updated:** 2025-12-22  
**Version:** 1.0
