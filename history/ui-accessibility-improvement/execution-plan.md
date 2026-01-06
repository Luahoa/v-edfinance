# Execution Plan: UI Accessibility & Polish Improvement

Epic: ved-pd8l
Generated: 2026-01-06

## Tracks

| Track | Agent | Beads (in order) | File Scope |
|-------|-------|------------------|------------|
| 1 | GreenLeaf | ved-a6or → ved-pjtl → ved-wbji | `apps/web/src/components/organisms/**`, `apps/web/src/components/molecules/**` |
| 2 | BlueSky | ved-4o7q → ved-4f3z → ved-tftp | `apps/web/src/components/**` (AiMentor, InteractiveChecklist, QuizPlayer, CertificateList) |
| 3 | RedWave | ved-1yhd → ved-j0zv | `apps/web/src/i18n/**`, All responsive testing |

## Track Details

### Track 1: GreenLeaf - Accessibility Labels & Focus States

**File scope**: `apps/web/src/components/organisms/**`, `apps/web/src/components/molecules/**`

**Beads**:
1. `ved-a6or`: Fix AiMentor.tsx - aria-labels + focus states
   - Add aria-label to send button, minimize button
   - Replace outline-none with focus-visible:ring-2 pattern from Sidebar.tsx
   - Pattern: `focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none`

2. `ved-pjtl`: Fix CommandPalette.tsx - aria-labels + focus states
   - Add aria-label to close button
   - Replace outline-none on input and command items with focus-visible:ring-2 pattern

3. `ved-wbji`: Fix LocaleSwitcher.tsx + BuddyRecommendations.tsx
   - LocaleSwitcher: Replace focus:outline-none with focus-visible:ring-2
   - BuddyRecommendations: Add aria-label to join button with i18n

### Track 2: BlueSky - Loading States Standardization

**File scope**: `apps/web/src/components/**`

**Beads**:
1. `ved-4o7q`: Fix AiMentor.tsx - replace Loader2 with Skeleton
   - Import Skeleton from @/components/ui/skeleton
   - Replace Loader2 spinner in loading state with Skeleton component

2. `ved-4f3z`: Fix InteractiveChecklist.tsx + QuizPlayer.tsx - add Skeleton
   - InteractiveChecklist: Add Skeleton for loading state
   - QuizPlayer: Replace custom spinner with Skeleton component

3. `ved-tftp`: Fix CertificateList.tsx - replace text loading with Skeleton
   - Replace "Loading certificates..." text with Skeleton component showing placeholder cards

### Track 3: RedWave - i18n & Mobile Verification

**File scope**: `apps/web/src/i18n/**`, All responsive testing

**Beads**:
1. `ved-1yhd`: Add i18n translations for aria-labels
   - Add translation keys to vi.json, en.json, zh.json:
     - dashboard.aiMentor.sendButton
     - dashboard.aiMentor.minimizeButton
     - common.close
     - dashboard.buddies.joinButton

2. `ved-j0zv`: Verify mobile touch targets and responsive design
   - Test on mobile viewports (375px, 768px)
   - Ensure all buttons meet 44x44px touch target minimum
   - Add responsive padding if needed

## Cross-Track Dependencies

- Track 1 beads (ved-a6or, ved-pjtl, ved-wbji) need translation keys from Track 3 (ved-1yhd)
- **Recommendation**: Complete ved-1yhd first, then run Track 1 and Track 2 in parallel
- Track 3 (ved-j0zv) can run independently after all other beads complete

## Execution Strategy

**Phase 1: Foundations**
1. Complete ved-1yhd (i18n translations) - Blocks Track 1

**Phase 2: Parallel Work**
2. Track 1 (GreenLeaf) - All 3 beads in sequence
3. Track 2 (BlueSky) - All 3 beads in sequence
4. Tracks 1 & 2 can run in parallel (no file overlap)

**Phase 3: Verification**
5. Complete ved-j0zv (mobile testing) after all fixes done

## Key Learnings (Embedded in Beads)

**aria-label Pattern**:
```typescript
aria-label={t('dashboard.aiMentor.sendButton')}
```
- Always use i18n with `t()` function
- Add keys to all 3 locale files (vi, en, zh)

**Focus Pattern**:
```typescript
className="focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
```
- Replace bare `outline-none` with this pattern
- Pattern already exists in Sidebar.tsx, Header.tsx

**Skeleton Pattern**:
```typescript
import { Skeleton } from "@/components/ui/skeleton"
// Use for content placeholders
<Skeleton className="h-12 w-full" />
```

**Touch Target Minimum**:
- Mobile: 44x44px minimum
- Use `p-2` (8px) or `p-3` (12px) on mobile breakpoints

## Quality Gates

Each bead must pass:
```bash
pnpm --filter web build  # TypeScript build
pnpm --filter web lint   # Lint check
```

Full epic must pass:
```bash
bash scripts/quality-gate.sh
```

## Success Criteria

✅ All aria-labels added with i18n translations
✅ All focus states visible (no bare outline-none)
✅ All loading states use Skeleton component
✅ Mobile touch targets ≥44x44px
✅ TypeScript build passes
✅ Lint passes
✅ No regressions in existing functionality
✅ WCAG 2.1 AA compliance achieved
