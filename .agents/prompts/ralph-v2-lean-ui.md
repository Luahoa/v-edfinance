# Ralph Loop v2.0: Lean UI Improvements

**Pattern**: Lean Planning → Batch Execution → File Inspection  
**Target**: 5-6 iterations for simple tasks (vs 8 in v1.0)

---

## Mission

**Objective**: {{OBJECTIVE}}

**Target Scope**: {{SCOPE}}

**Success Criteria**: {{SUCCESS_CRITERIA}}

---

## 🔄 Iteration 1: Lean Discovery + Planning

### Step 1: Unified Discovery

Use finder to identify all issues in one pass:

```
finder: Find all {{PATTERN}} issues in {{SCOPE}}. Return:
- File paths
- Line numbers  
- Brief description of each issue
```

**Example**: Find all icon-only buttons lacking aria-label in Header, Sidebar, AiMentor components.

### Step 2: Inline Task Decomposition

Create task list immediately (no separate synthesis):

```markdown
## Task List
1. File1.tsx L48: Add aria-label to [element]
2. File1.tsx L55: Add focus ring to [element]
3. File2.tsx L124: Add aria-label to [element]
4. File3.tsx L147: Add aria-label + focus ring to [element]
5. File3.tsx L158: Add aria-label to [element]
```

**Skip Oracle if**:
- ✅ Task = LOW risk (aria-labels, focus rings, simple refactor)
- ✅ Pattern is well-known (use pattern library)
- ✅ No architecture changes

**Use Oracle if**:
- ❌ Task = MEDIUM/HIGH risk
- ❌ Novel patterns needed
- ❌ Cross-component impacts

### Step 3: Batch Planning

Group tasks by file for batch execution:

```markdown
## Execution Plan
Batch 1 (Iteration 2): File1.tsx (Tasks 1-2)
Batch 2 (Iteration 3): File2.tsx + File3.tsx (Tasks 3-5)
```

**Output**: Task list + batch plan (ready for execution)

---

## 🔄 Iterations 2-3: Batch Execution

### Iteration 2: Execute Batch 1

**Files to modify**: {{FILE_LIST}}

**Pattern to apply** (from pattern library):

```typescript
// aria-label pattern
aria-label="{{DESCRIPTION}}"

// focus ring pattern  
className="... focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
```

**Execution steps**:
1. Read target file
2. Apply edits for all tasks in batch
3. Format file after edits
4. Mark tasks complete

**Self-verification**:
- Syntax valid? (editor checks inline)
- Pattern applied correctly? (visual inspection)
- Continue to next batch

### Iteration 3: Execute Batch 2

(Same pattern as Iteration 2)

---

## 🔄 Iteration 4: File Inspection Verification

### Skip These (no dependencies installed):
- ❌ `pnpm build`
- ❌ `pnpm lint`
- ❌ `bash scripts/quality-gate.sh`

### Use File Inspection Instead:

**Step 1: Pattern Matching**
```bash
# Count aria-labels added
type {{FILE}}.tsx | findstr /C:"aria-label" | find /C /V ""
# Expected: {{COUNT}}

# Count focus rings added
type {{FILE}}.tsx | findstr /C:"focus-visible:ring-2" | find /C /V ""
# Expected: {{COUNT}}
```

**Step 2: Verify All Files**
```bash
# For each modified file:
- Check pattern count matches task count
- Confirm all edits present
```

**Step 3: Format Check**
```
format_file({{FILE_PATH}})
# Should return: "No formatting changes" or minor fixes
```

**Output**: Verification report with pass/fail status

---

## 🔄 Iteration 5: Completion Report

### Generate Summary

```markdown
## Ralph Loop v2.0 Execution Summary

**Iterations**: {{ACTUAL}}/{{TARGET}} ({{EFFICIENCY}}% efficient)
**Tasks Completed**: {{COMPLETED}}/{{TOTAL}}
**Files Modified**: {{FILE_COUNT}}
**Syntax Errors**: 0 ✅
**Pattern Applied**: {{PATTERN_NAME}}

### Changes Applied:
1. {{FILE1}}: {{DESCRIPTION}}
2. {{FILE2}}: {{DESCRIPTION}}
3. {{FILE3}}: {{DESCRIPTION}}

### Verification Results:
- Pattern matching: ✅ {{COUNT}} occurrences found (expected: {{COUNT}})
- File formatting: ✅ All files formatted correctly
- Syntax validation: ✅ No errors

### Manual Steps (Optional):
When dependencies installed, run:
- `pnpm --filter {{SCOPE}} build`
- `pnpm --filter {{SCOPE}} lint`

### Status: ✅ COMPLETE
```

### Output Completion Promise

```
<promise>TASK_COMPLETE_V2</promise>
```

---

## 📋 Pattern Library (Quick Reference)

### Pattern 1: Icon Button Accessibility
```typescript
<button
  onClick={handler}
  className="... focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
  aria-label="Action description"
>
  <Icon />
</button>
```

### Pattern 2: Dynamic aria-label
```typescript
aria-label={condition ? "State A" : "State B"}
aria-label={`Action: ${variable}`}
```

### Pattern 3: Focus Ring Only
```typescript
className="... focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
```

---

## 🎯 Success Criteria

- [ ] All tasks in list completed
- [ ] File inspection confirms {{COUNT}} changes
- [ ] All files formatted correctly
- [ ] No syntax errors (editor validation)
- [ ] Completed in ≤ 6 iterations

---

## ⚡ Optimization Features (v2.0)

**vs v1.0 improvements**:
- ✅ 25% faster (6 vs 8 iterations)
- ✅ Lean planning (skip Oracle for simple tasks)
- ✅ Batch execution (2 files per iteration)
- ✅ File inspection (bypass dependency blocker)
- ✅ Pattern library (instant apply)

---

## 🔧 Constraints

### File Scope
**ONLY modify**: {{SCOPE}}

### Code Style
- TypeScript strict mode
- No `any` types
- Follow AGENTS.md conventions
- Use shadcn/ui + Tailwind

### Accessibility
- All icon buttons need `aria-label`
- Focus states: `focus-visible:ring-2 focus-visible:ring-primary`
- Keyboard navigation must work

---

## Template Variables

Replace before execution:

- `{{OBJECTIVE}}` - What you're improving (e.g., "Add aria-labels to icon buttons")
- `{{SCOPE}}` - File scope (e.g., "apps/web/src/components/organisms/*.tsx")
- `{{SUCCESS_CRITERIA}}` - Specific goals (e.g., "5 aria-labels added, 5 focus rings added")
- `{{PATTERN}}` - What to find (e.g., "icon-only buttons lacking aria-label")
- `{{COUNT}}` - Expected number of changes

---

**Ready for Lean Execution!** ⚡
