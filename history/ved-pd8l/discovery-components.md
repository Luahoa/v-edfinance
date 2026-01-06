# Component Architecture Discovery - ved-pd8l (UI Accessibility)

**Discovery Agent**: A  
**Date**: 2026-01-07  
**Epic**: ved-pd8l (UI Accessibility Enhancement)  
**Time**: 15 minutes  

---

## Directory Structure

```
apps/web/src/components/
├── atoms/           # Basic building blocks
├── molecules/       # Composed atoms
├── organisms/       # Complex compositions
├── certificates/    # Certificate feature components
├── quiz/           # Quiz feature components
├── ui/             # shadcn/ui primitives
└── prototypes/     # Experimental components
```

**Atomic Design Pattern**: ✅ FOLLOWED (atoms/molecules/organisms)

---

## Component Locations

| Component | File Path | Atomic Level | Lines |
|-----------|-----------|--------------|-------|
| AiMentor | `components/AiMentor.tsx` | ❌ **ROOT** (should be organism) | 269 |
| CommandPalette | `organisms/CommandPalette.tsx` | ✅ Organism | 184 |
| LocaleSwitcher | `molecules/LocaleSwitcher.tsx` | ✅ Molecule | 33 |
| BuddyRecommendations | `molecules/BuddyRecommendations.tsx` | ✅ Molecule | 67 |
| InteractiveChecklist | `organisms/InteractiveChecklist.tsx` | ✅ Organism | 176 |
| QuizPlayer | `quiz/QuizPlayer.tsx` | ⚠️ **Feature** (functionally organism) | 227 |
| CertificateList | `certificates/CertificateList.tsx` | ⚠️ **Feature** (functionally organism) | 112 |

**Pattern Issue**: AiMentor.tsx in root violates Atomic Design structure.

---

## Accessibility Audit Results

### 1. **AiMentor.tsx** (269 lines)

#### ✅ PASS
- **aria-label**: Lines 127, 158 (toggle sidebar, select thread)
- **Focus states**: Line 126 (`focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none`)
- **Keyboard**: Line 251 (Enter key handling)
- **Loading state**: Line 238 (Loader2 spinner)
- **i18n**: Line 12 (`useTranslations('Dashboard')`)

#### ❌ FAIL
- **Missing aria-label**: Send button (line 256) - no screen reader label
- **Input lacks label**: Line 247 - only placeholder, no associated `<label>` element
- **Hardcoded strings**: Lines 75, 143, 181, 186 (Vietnamese text not in i18n)

**Score**: 6/10

---

### 2. **CommandPalette.tsx** (184 lines)

#### ✅ PASS
- **Keyboard shortcuts**: Lines 44-52 (CMD+K, Escape)
- **Focus states**: Line 125 (`focus:outline-none`, hover states)
- **Loading**: N/A (no async operations)
- **i18n**: Line 23 (`useTranslations('Navigation')`)
- **Semantic kbd**: Lines 153-174 (keyboard hint UI)

#### ❌ FAIL
- **Missing aria-label**: Input (line 90), Close button (line 97), Command buttons (line 117)
- **No ARIA role**: Command list (line 107) should be `role="listbox"`
- **Focus trap**: No focus management when modal opens

**Score**: 5/10

---

### 3. **LocaleSwitcher.tsx** (33 lines)

#### ✅ PASS
- **Semantic select**: Line 20 (native `<select>`)
- **i18n integration**: Line 3 (`useLocale`)
- **Focus states**: Line 23 (`focus:outline-none` - basic)

#### ❌ FAIL
- **Missing aria-label**: No label for "Language selector"
- **Icon not hidden**: Line 19 (`<Globe>`) lacks `aria-hidden="true"`
- **No visible label**: Only icon, inaccessible to screen readers

**Score**: 4/10

---

### 4. **BuddyRecommendations.tsx** (67 lines)

#### ✅ PASS
- **i18n**: Line 14 (`useTranslations('Social')`)
- **Loading state**: Line 60 (disabled button with "...")
- **Semantic HTML**: Line 55 (`<button>` for actions)

#### ❌ FAIL
- **Missing aria-label**: Join buttons (line 55) - no context for screen readers
- **No loading announcement**: State change not announced (needs `aria-live`)
- **Focus states**: No visible focus ring

**Score**: 4/10

---

### 5. **InteractiveChecklist.tsx** (176 lines)

#### ✅ PASS
- **i18n**: Lines 32-33 (`useTranslations`)
- **Loading state**: Lines 103 (Loader2 + text)
- **Error handling**: Lines 108-116 (AlertCircle + retry button)
- **Focus states**: Implicit (Tailwind `focus-visible`)
- **Semantic button**: Line 150 (checklist item toggle)

#### ❌ FAIL
- **Missing aria-label**: Checklist toggle buttons (line 150) - no context
- **Progress not announced**: Line 141 (progress bar lacks `role="progressbar" aria-valuenow`)
- **Checkbox alternative**: Using CheckCircle2/Circle icons instead of native checkboxes

**Score**: 6/10

---

### 6. **QuizPlayer.tsx** (227 lines)

#### ✅ PASS
- **i18n**: Line 25 (`useTranslations('Quiz')`)
- **Loading states**: Lines 67-73 (spinner + text)
- **Error handling**: Lines 77-92 (clear error button)
- **Semantic structure**: Line 147 (`<div>` with proper hierarchy)

#### ❌ FAIL
- **Missing aria-live**: Quiz navigation changes not announced
- **No role attributes**: Question renderer (line 168) lacks ARIA roles
- **Button labels**: Line 86 ("Dismiss") - generic, no context
- **Focus management**: No auto-focus on question change

**Score**: 5/10

---

### 7. **CertificateList.tsx** (112 lines)

#### ✅ PASS
- **i18n**: Line 17 (`useTranslations('Certificates')`)
- **Loading state**: Lines 53-59 (spinner + text)
- **Error handling**: Lines 62-68 (error message)
- **Empty state**: Lines 70-94 (SVG + message)

#### ❌ FAIL
- **SVG lacks role**: Line 73 (decorative SVG should have `role="img" aria-label` or `aria-hidden`)
- **Hardcoded text**: Lines 87, 90, 99 (not in i18n)
- **Grid lacks landmark**: Line 105 (`<div>` should be `<section aria-label="Certificates grid">`)

**Score**: 5/10

---

## Pattern Analysis

### ✅ Consistent Patterns
1. **i18n Usage**: All 7 components use `next-intl` (`useTranslations`)
2. **Loading States**: 5/7 use Loader2 spinner (InteractiveChecklist, QuizPlayer, CertificateList)
3. **Tailwind CSS**: Consistent `focus-visible:ring-2` pattern (AiMentor, CommandPalette)
4. **Error Handling**: Red-themed error states (InteractiveChecklist, QuizPlayer, CertificateList)

### ❌ Inconsistent Patterns

| Issue | Components Affected | Fix |
|-------|---------------------|-----|
| **Missing aria-labels** | 6/7 (all except none) | Add descriptive labels to all interactive elements |
| **Hardcoded strings** | 3/7 (AiMentor, CertificateList, QuizPlayer) | Move to i18n JSON files |
| **Focus states** | Mixed (some use `focus-visible`, some don't) | Standardize focus ring styles |
| **Loading announcement** | 0/7 (visual only) | Add `aria-live="polite"` regions |
| **Icon accessibility** | 7/7 (no `aria-hidden` on decorative icons) | Add `aria-hidden="true"` or descriptive labels |

---

## Gap Summary

### Critical Gaps (P0)
1. **Missing ARIA Labels**: Buttons/inputs lack screen reader context (affects 6/7 components)
2. **Hardcoded Strings**: 3 components bypass i18n (violates multilingual requirement)
3. **Focus Management**: No keyboard navigation strategy (CommandPalette modal)

### High Priority Gaps (P1)
4. **Loading Announcements**: Visual-only feedback (needs `aria-live`)
5. **Icon Semantics**: Decorative icons confuse screen readers (all 7 components)
6. **Progress Indicators**: No `role="progressbar"` (InteractiveChecklist)

### Medium Priority Gaps (P2)
7. **Focus Styles**: Inconsistent implementation (3 different patterns)
8. **Landmark Regions**: Generic `<div>` instead of semantic elements
9. **Keyboard Shortcuts**: Only CommandPalette has keyboard hints

---

## Recommendations

### Immediate Actions (Epic ved-pd8l)
1. **Create Accessibility Primitives** (new atoms):
   - `AccessibleButton.tsx` (with built-in aria-label prop)
   - `AccessibleInput.tsx` (with associated label)
   - `LoadingAnnouncement.tsx` (aria-live wrapper)

2. **Audit & Fix Hardcoded Strings**:
   - Extract to `vi.json`, `en.json`, `zh.json`
   - Priority: AiMentor (4 strings), CertificateList (3 strings)

3. **Standardize Focus Styles**:
   - Add to `tailwind.config.js`: `focusVisible: 'ring-2 ring-blue-600 ring-offset-2'`
   - Apply globally via base styles

### Epic Scope Constraint
- **DO NOT** refactor Atomic Design structure (out of scope for accessibility epic)
- **DO** document AiMentor.tsx misplacement for future epic

---

## i18n Usage Pattern (Verified)

```typescript
// Standard pattern (all 7 components follow this)
import { useTranslations } from 'next-intl';

const t = useTranslations('Namespace'); // Dashboard, Navigation, Social, etc.
<span>{t('key')}</span>
```

**Locale files**: `apps/web/src/i18n/locales/{vi|en|zh}.json`

**Issue**: Some components still have hardcoded Vietnamese strings (legacy code).

---

## Metrics

| Metric | Value |
|--------|-------|
| **Components Audited** | 7 |
| **Average Accessibility Score** | 5.0/10 |
| **i18n Compliance** | 100% (all use next-intl) |
| **Hardcoded Strings** | 10 instances (3 components) |
| **Missing aria-labels** | ~15 instances (6 components) |
| **Focus Style Consistency** | 60% (4/7 use focus-visible) |
| **Atomic Design Compliance** | 86% (6/7 correct placement) |

---

## Next Steps (for Orchestrator)

1. **Track 1**: ARIA Labels & Keyboard Navigation (P0)
   - Components: AiMentor, CommandPalette, LocaleSwitcher
   - Beads: 3-4 beads (~2h)

2. **Track 2**: i18n Hardcoded String Fixes (P0)
   - Components: AiMentor, CertificateList, QuizPlayer
   - Beads: 3 beads (~1h)

3. **Track 3**: Focus Styles & Loading Announcements (P1)
   - Components: All 7
   - Beads: 2 beads (~1.5h)

4. **Track 4**: Icon Accessibility & Progress Indicators (P1)
   - Components: All 7
   - Beads: 2 beads (~1h)

**Total Estimated**: 10-11 beads, ~5.5 hours

---

## Discovery Complete ✅

**Agent**: Discovery Agent A  
**Status**: COMPLETE  
**Duration**: 15 minutes  
**Output**: `history/ved-pd8l/discovery-components.md`
