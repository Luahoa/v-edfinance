# Web Build Fix - Task Report

**Date**: 2026-01-05  
**Status**: ⚠️ PARTIAL - Utilities Created, Merge Conflicts Block Build

---

## ✅ Completed Tasks

### 1. Fixed BuddyAvatar.tsx JSX Syntax Error
- **File**: `apps/web/src/components/atoms/BuddyAvatar.tsx`
- **Issue**: Merge conflict markers on lines 34-39
- **Fix**: Removed conflict markers, kept `loading="lazy"` prop
- **Result**: ✅ Fixed

### 2. Created Missing Utility Files

**apps/web/src/lib/cn.ts** ✅
```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

**apps/web/src/lib/utils.ts** ✅
```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

**apps/web/src/lib/icons.ts** ✅
```typescript
// Icon exports for Sidebar
export {
  Home,
  BookOpen,
  Trophy,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  User,
  Bell,
  Search
} from 'lucide-react';
```

### 3. Installed Missing Dependencies
- ✅ `clsx@2.1.1` (already installed)
- ✅ `tailwind-merge@3.4.0` (newly installed)

---

## ❌ Blocking Issues Found

### Critical Merge Conflicts (Build-Blocking)

#### 1. **apps/web/src/app/[locale]/courses/[id]/lessons/[lessonId]/page.tsx**
- Lines 3-33: Import statement merge conflict
- Duplicate imports for React hooks and icons
- **Impact**: Syntax error prevents compilation

#### 2. **apps/web/src/app/[locale]/courses/[id]/page.tsx**
- Lines 1-30: Entire file header has merge conflict
- Duplicate getCourse function definitions
- **Impact**: Module parse error

#### 3. **apps/web/src/app/[locale]/page.tsx**
- Lines 14+: JSX merge conflict in return statement
- **Impact**: Expression expected error

#### 4. **apps/web/src/messages/en.json**
- Line 38: JSON merge conflict in Navigation object
- Lines 38-50: Duplicate "simulation" key
- **Impact**: JSON parse error

#### 5. **apps/web/src/messages/vi.json**
- Line 38: JSON merge conflict in Navigation object
- Lines 38-50: Duplicate "simulation" key
- **Impact**: JSON parse error

---

## Build Output Summary

### Errors Remaining: **5**

1. ❌ `page.tsx` (lessons) - Merge conflict markers
2. ❌ `page.tsx` (courses/id) - Merge conflict markers  
3. ❌ `page.tsx` (root) - Merge conflict markers
4. ❌ `en.json` - JSON parse error at line 38
5. ❌ `vi.json` - JSON parse error at line 38

### Errors Fixed: **4**

1. ✅ Missing `@/lib/cn` (created)
2. ✅ Missing `@/lib/icons` (created)
3. ✅ Missing `@/lib/utils` (created)
4. ✅ BuddyAvatar.tsx JSX syntax error (fixed)

---

## Required Manual Actions

### Immediate (P0)
1. **Resolve merge conflicts in 3 page.tsx files**
   - Choose between "Updated upstream" vs "Stashed changes"
   - Remove conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)

2. **Fix JSON translation files**
   - Remove duplicate "simulation" keys in en.json line 38-50
   - Remove duplicate "simulation" keys in vi.json line 38-50
   - Decide which Navigation properties to keep

### Commands to Run After Manual Fixes
```bash
# Verify build passes
pnpm --filter web build

# Check for remaining conflicts (PowerShell)
Get-ChildItem -Path "apps/web/src" -Recurse | Select-String "<<<<<<< "

# Run diagnostics
pnpm --filter web lint
```

---

## Root Cause Analysis

**Issue**: Incomplete git merge resolution from previous spike/simplified-nav merge  
**Affected Branches**: `Updated upstream` vs `Stashed changes`  
**Timeline**: Likely occurred during VED-DO76 or earlier navigation refactor

### Prevention
- Add pre-commit hook to detect conflict markers
- Use `git diff --check` before commits
- Add CI step to fail on conflict markers

---

## Files Modified

### Created
- ✅ `apps/web/src/lib/cn.ts`
- ✅ `apps/web/src/lib/utils.ts`
- ✅ `apps/web/src/lib/icons.ts`

### Fixed
- ✅ `apps/web/src/components/atoms/BuddyAvatar.tsx`

### Dependencies Added
- ✅ `tailwind-merge@3.4.0`

### Requires Manual Fix
- ⚠️ `apps/web/src/app/[locale]/courses/[id]/lessons/[lessonId]/page.tsx`
- ⚠️ `apps/web/src/app/[locale]/courses/[id]/page.tsx`
- ⚠️ `apps/web/src/app/[locale]/page.tsx`
- ⚠️ `apps/web/src/messages/en.json`
- ⚠️ `apps/web/src/messages/vi.json`

---

## Next Steps

1. Manually resolve 5 merge conflicts listed above
2. Run `pnpm --filter web build` to verify
3. Create beads task for merge conflict resolution process improvement
4. Update AGENTS.md with conflict detection protocol
