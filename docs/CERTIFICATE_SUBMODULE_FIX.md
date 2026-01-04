# Certificate System - Submodule Issue Fix

## Problem

The `apps/api` directory is incorrectly registered as a git submodule (gitlink) in the index, preventing new files from being tracked.

Evidence:
```bash
git ls-files -s apps/api | findstr "^160000"
# Output: 160000 c031d084d271296f1d510161d8cbf10bb7433e75 0       apps/api
```

Mode `160000` = gitlink (submodule pointer), not a regular directory.

## Impact

- New certificate files created in `apps/api/src/modules/certificates/` are invisible to git
- `git add apps/api/src/modules/certificates/` fails with "Pathspec is in submodule 'apps/api'"
- Commits only include beads metadata changes, not the actual code

## Solution

**Option 1: De-submodule apps/api (RECOMMENDED)**

```bash
# Backup current state
git stash

# Remove submodule entry from index
git rm --cached apps/api

# Re-add as normal directory
git add apps/api/

# Commit the fix
git commit -m "fix: Remove apps/api submodule, convert to normal directory"

# Restore stashed changes
git stash pop
```

**Option 2: Initialize the submodule properly (NOT RECOMMENDED)**

```bash
# This assumes apps/api SHOULD be a submodule
git submodule init
git submodule update
cd apps/api
git add src/modules/certificates/
git commit -m "feat: Add certificate system"
cd ../..
git add apps/api
git commit -m "Update apps/api submodule"
```

## Files Created (Currently Untracked)

These files exist in the working tree but are invisible to git:

```
apps/api/src/modules/certificates/
├── README.md                           # Complete documentation
├── certificate.module.ts               # NestJS module
├── certificate.controller.ts           # API endpoints
├── dto/
│   └── certificate.dto.ts              # Request/response DTOs
├── services/
│   ├── certificate.service.ts          # Main service
│   ├── pdf-generator.service.ts        # PDFKit PDF generation
│   └── r2-storage.service.ts           # Cloudflare R2 uploads
└── templates/
    ├── certificate-template.html       # HTML template
    ├── locales.json                    # i18n strings
    ├── template-renderer.ts            # Template utils
    └── preview-generator.ts            # Test script

apps/api/src/app.module.ts              # Updated with CertificateModule import
```

## Verification

After applying Solution 1:

```bash
# Check that apps/api is now a normal directory (mode 040000)
git ls-files -s apps/api | findstr "^040000"

# Verify new files are tracked
git status apps/api/src/modules/certificates/
# Should show: new file: apps/api/src/modules/certificates/...
```

## Next Steps

1. User applies **Solution 1** (recommended)
2. Run `git add apps/api/`
3. Run `git commit -m "feat(certificates): Add certificate system files"`
4. Run `git push`
5. Verify builds pass: `pnpm --filter api build`
6. Continue with remaining P0 tasks

## Alternative (Manual File Creation)

If de-submodule is too risky, the user can manually create the files from the README documentation and commit them directly.
