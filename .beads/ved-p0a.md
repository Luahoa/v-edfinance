# VED-P0A: Resolve root package.json merge conflict

**Status**: open  
**Priority**: 0 (Critical)  
**Track**: P0 Gate  
**Estimate**: 15 minutes

## Description

Fix merge conflict in `package.json` (root) blocking `pnpm install`.

## Resolution Strategy

Keep upstream (Updated) version - more comprehensive scripts
- Preserve workspaces config from stashed: `["apps/*", "packages/*"]`
- Keep all devDependencies
- Keep comprehensive scripts (lint, format, test:*, smoke:*)

## Acceptance Criteria

- [ ] No merge conflict markers in package.json
- [ ] `pnpm install` completes without errors
- [ ] workspaces array present

## Commands

```bash
git checkout --theirs package.json
# Manually add workspaces array if missing
pnpm install  # Verify
```
