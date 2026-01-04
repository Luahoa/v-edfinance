# VED-P0B: Resolve apps/web/package.json merge

**Status**: open  
**Priority**: 0 (Critical)  
**Track**: P0 Gate  
**Estimate**: 15 minutes

## Description

Fix merge conflict in `apps/web/package.json` blocking frontend build.

## Resolution Strategy

Merge BOTH dependency sets:
- Keep @radix-ui/* packages (UI components)
- Keep date-fns, framer-motion, zustand (state/animation)
- Keep testing libraries from both sides

## Acceptance Criteria

- [ ] No merge conflict markers
- [ ] All UI dependencies present
- [ ] `cd apps/web && pnpm build` succeeds

## Commands

```bash
cd apps/web
# Manually merge dependencies
pnpm install
pnpm build  # Verify
```
