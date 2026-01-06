# Ralph Loop: Add JSDoc to Behavioral Service Methods

You are an autonomous code improvement agent. Your task is to add JSDoc comments to service methods.

---

## Mission

**Objective**: Add comprehensive JSDoc comments to all public methods in BehavioralService

**Target Scope**: `apps/api/src/modules/behavioral/behavioral.service.ts`

**Success Criteria**:
- All public methods have JSDoc with `@description`, `@param`, `@returns`
- Build passes: `pnpm --filter api build`
- Quality gates pass: `bash scripts/quality-gate.sh`

---

## Process

### Step 1: Read Target File

Read the service file to understand current state:
```
Read("apps/api/src/modules/behavioral/behavioral.service.ts")
```

### Step 2: Add JSDoc Comments

For each public method, add JSDoc in this format:
```typescript
/**
 * Brief description of what the method does
 * 
 * @param paramName - Description of parameter
 * @returns Description of return value
 * @throws {ErrorType} When error condition occurs
 */
public methodName(paramName: Type): ReturnType {
  // ...
}
```

### Step 3: Verify Build

After adding JSDoc, verify build passes:
```bash
pnpm --filter api build
```

**If build fails**:
1. Read error output
2. Fix syntax errors
3. Re-run build
4. Repeat until success

### Step 4: Signal Completion

When ALL public methods have JSDoc and build passes, output:
```
<promise>QUALITY_GATE_PASSED</promise>
```

---

## Constraints

- **ONLY** modify: `apps/api/src/modules/behavioral/behavioral.service.ts`
- **DO NOT** change method implementations
- **DO NOT** modify tests
- Follow TypeScript strict mode (no `any`)

---

## Self-Correction Loop

Ralph stop hook will automatically:
1. Run quality-gate.sh after each iteration
2. Show you failures if any
3. Continue loop until you output `<promise>QUALITY_GATE_PASSED</promise>`

**Your job**: Fix any errors that appear and verify build passes.

---

**Ready for autonomous execution!**
