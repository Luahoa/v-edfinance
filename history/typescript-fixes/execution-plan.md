# Execution Plan: TypeScript Error Fixes

Epic: TypeScript Debt Cleanup
Generated: 2026-01-04

## Error Summary

**Total Errors:** 68 TypeScript errors
**Affected Files:** 4 files
- `scenario-generator.service.spec.ts`: 26 errors (implicit any, null checks, type mismatches)
- `YouTubeErrorBoundary.test.tsx`: 27 errors (missing dependency, JSX component types, missing methods)
- `auth.service.spec.ts`: 1 error (type mismatch)
- `dynamic-config.service.spec.ts`: 4 errors (missing properties)
- `social.service.spec.ts`: 1 error (null check)
- `ai-course-flow.e2e-spec.ts`: 9 errors (implicit any, missing properties, type mismatches)

## Tracks

| Track | Agent | Beads | File Scope | Error Count |
|-------|-------|-------|------------|-------------|
| 1 | BlueLake | ved-ts1 → ved-ts2 | `apps/api/src/modules/simulation/**` | 26 |
| 2 | GreenCastle | ved-ts3 → ved-ts4 → ved-ts5 | `apps/web/src/components/ui/__tests__/**` | 27 |
| 3 | RedStone | ved-ts6 → ved-ts7 → ved-ts8 | `apps/api/src/**/*.spec.ts` (auth, config, social) | 6 |
| 4 | PurpleBear | ved-ts9 | `apps/api/test/integration/**` | 9 |

## Track Details

### Track 1: BlueLake - Simulation Service Type Safety

**File scope**: `apps/api/src/modules/simulation/**`
**Beads**:

1. `ved-ts1`: Fix implicit any types in scenario-generator.service.spec.ts
   - Fix 4 `Parameter 'call' implicitly has an 'any' type` errors (lines 278, 308, 545, 596, 687, 717, 744)
   - Fix 2 `Parameter 'type'/'data' implicitly has an 'any' type` errors (line 554)
   
2. `ved-ts2`: Fix null checks and array type assertions
   - Fix 9 `'result.decisions' is possibly 'null'` errors
   - Fix 6 `Element implicitly has an 'any' type` errors for array indexing
   - Fix 1 `Property 'length' does not exist` error

### Track 2: GreenCastle - YouTube Error Boundary Tests

**File scope**: `apps/web/src/components/ui/__tests__/**`
**Beads**:

3. `ved-ts3`: Install @testing-library/react dependency
   - Add missing `@testing-library/react` package
   - Verify Vitest setup for web tests

4. `ved-ts4`: Fix ThrowError component JSX type
   - Change ThrowError to return ReactNode instead of void
   - Fix all 8 JSX component type errors

5. `ved-ts5`: Add missing Vitest matchers
   - Add `toBeInTheDocument` (18 occurrences)
   - Add `toHaveAttribute` (3 occurrences)
   - Configure @testing-library/jest-dom or vitest matchers

### Track 3: RedStone - Unit Test Type Fixes

**File scope**: `apps/api/src/**/*.spec.ts` (auth, config, social)
**Beads**:

6. `ved-ts6`: Fix auth.service.spec.ts type mismatch
   - Add missing User properties in mock data (createdAt, name, points, etc.)

7. `ved-ts7`: Fix dynamic-config.service.spec.ts missing properties
   - Add `description` property to 4 config mock objects

8. `ved-ts8`: Fix social.service.spec.ts null check
   - Add null guard for `result` property

### Track 4: PurpleBear - E2E Test Type Safety

**File scope**: `apps/api/test/integration/**`
**Beads**:

9. `ved-ts9`: Fix ai-course-flow.e2e-spec.ts type errors
   - Fix implicit any type for `context` parameter
   - Add `thumbnailKey` property to 2 Course mock objects
   - Remove invalid `category` property
   - Fix `lessons` property access (not in type definition)

## Cross-Track Dependencies

- **No blocking dependencies** - All tracks can run in parallel
- Track 2 (GreenCastle) may need to install package, but won't block others

## Validation Criteria

For each track, worker must verify:
```bash
# Type check specific module
cd apps/api && pnpm exec tsc --noEmit
cd apps/web && pnpm exec tsc --noEmit

# Run affected tests
pnpm test <test-file-pattern>
```

## Key Learnings

From error analysis:
1. **Strict null checks enabled** - Must guard all nullable properties
2. **No implicit any** - All parameters must be typed
3. **Vitest matchers** - Need proper setup for DOM testing library
4. **Prisma types** - Mock objects must match full schema including optional fields

## Success Metrics

- ✅ 0 TypeScript errors in all 4 modules
- ✅ All affected tests still pass
- ✅ No new `@ts-expect-error` suppressions added
