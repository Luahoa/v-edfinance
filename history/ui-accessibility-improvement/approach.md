# Approach: UI Accessibility & Polish Improvement

## Gap Analysis

| Component | Current State | WCAG 2.1 AA Requirement | Gap |
|-----------|---------------|-------------------------|-----|
| **Icon Buttons** | Missing aria-labels | All interactive elements need accessible names | Add aria-label to 8+ buttons |
| **Focus States** | Mixed (some outline-none without alternatives) | Visible focus indicators required | Replace outline-none with focus-visible:ring-2 |
| **Loading States** | Inconsistent (Loader2/Skeleton/text) | Perceivable loading feedback | Standardize on Skeleton component |
| **Keyboard Navigation** | Partially working | Full keyboard operability | Add focus management |
| **Touch Targets** | Some buttons may be too small | Minimum 44x44px | Verify and fix mobile sizes |

## Recommended Approach: Pattern-Based Fixes

This is a **LOW-risk refactoring task** because:
- All fixes follow existing patterns in codebase
- No new dependencies required
- Changes are isolated to component styling/props
- Skeleton component already exists

### Strategy: Atomic, Incremental Fixes

**Phase 1: Add Missing aria-labels** (1-2 files per iteration)
- Pattern already exists: `Header.tsx` buttons have correct aria-labels
- Apply same pattern to AiMentor, CommandPalette, BuddyRecommendations

**Phase 2: Fix Focus States** (1-2 files per iteration)
- Pattern already exists: `Sidebar.tsx` uses `focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none`
- Replace bare `outline-none` with this pattern

**Phase 3: Standardize Loading States** (1-2 files per iteration)
- Pattern: Use `Skeleton` component from `@/components/ui/skeleton`
- Replace Loader2 spinners and text-based loading

**Phase 4: Verify Mobile Touch Targets**
- Test on mobile viewport
- Ensure buttons meet 44x44px minimum

## Alternative Approaches (Not Recommended)

### Option B: Big Bang Refactor
- Fix all issues in one large PR
- **Tradeoff**: Higher merge conflict risk, harder to review
- **Why not**: Ralph Loop works best with small, verifiable iterations

### Option C: Create New Component Wrappers
- Build AccessibleButton, AccessibleInput wrappers
- **Tradeoff**: Over-engineering, adds complexity
- **Why not**: Existing shadcn/ui components already accessible if used correctly

## Risk Map

| Component | Risk | Reason | Verification |
|-----------|------|--------|--------------|
| aria-label additions | **LOW** | Props only, no structural changes | Build + manual screen reader test |
| focus-visible fixes | **LOW** | CSS classes only, pattern exists | Build + keyboard navigation test |
| Skeleton replacements | **LOW** | UI component swap, pattern exists | Build + visual test |
| Mobile touch targets | **MEDIUM** | May need responsive breakpoints | Build + mobile device test |
| i18n for aria-labels | **MEDIUM** | Need to verify translation keys exist | Build + test all locales |

## Implementation Plan

### Track 1: Accessibility Labels & Focus (Files 1-5)
**Agent: GreenLeaf**
- Fix AiMentor.tsx (aria-labels + focus states)
- Fix CommandPalette.tsx (aria-labels + focus states)
- Fix LocaleSwitcher.tsx (focus state)
- Fix BuddyRecommendations.tsx (aria-label)
- Fix command.tsx (focus state on input)

### Track 2: Loading States (Files 6-9)
**Agent: BlueSky**
- Fix AiMentor.tsx (replace Loader2 with Skeleton)
- Fix InteractiveChecklist.tsx (add Skeleton)
- Fix QuizPlayer.tsx (replace spinner with Skeleton)
- Fix CertificateList.tsx (replace text with Skeleton)

### Track 3: Mobile Responsive (Files 10+)
**Agent: RedWave**
- Audit touch target sizes
- Add responsive padding/sizing where needed
- Test on mobile viewports (375px, 768px)

## Verification Strategy

### Per-Bead Verification
```bash
# TypeScript build
pnpm --filter web build

# Lint check
pnpm --filter web lint

# Visual regression (if configured)
pnpm --filter web test:visual
```

### Manual Testing Checklist
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Screen reader announces button labels
- [ ] Focus rings visible on all interactive elements
- [ ] Loading states use Skeleton component
- [ ] Mobile touch targets ≥44x44px

### Quality Gates
```bash
# Run full quality gate
bash scripts/quality-gate.sh

# Specific checks
pnpm --filter web build  # TypeScript build
pnpm --filter web test   # Test coverage ≥80%
# No 'any' types allowed
```

## Success Criteria

**All fixes must meet:**
1. ✅ WCAG 2.1 AA compliance (keyboard, screen reader, focus)
2. ✅ TypeScript strict mode (no any types)
3. ✅ ClaudeKit Frontend Skills guidelines (BEAUTIFUL/RIGHT/SATISFYING/PEAK)
4. ✅ Atomic Design pattern maintained
5. ✅ All quality gates pass
6. ✅ No regressions in existing functionality

## i18n Considerations

Some aria-labels need translations:
```typescript
// Pattern for translated aria-labels
aria-label={t('dashboard.aiMentor.sendButton')}
aria-label={t('common.close')}
aria-label={t('dashboard.buddies.joinButton')}
```

Need to add keys to:
- `apps/web/src/i18n/locales/vi.json`
- `apps/web/src/i18n/locales/en.json`
- `apps/web/src/i18n/locales/zh.json`

## Expected Timeline

**Using Ralph Loop v2.0 (Lean UI mode):**
- Track 1: ~6-8 iterations (5 files, batch 2 per iteration)
- Track 2: ~4-6 iterations (4 files, batch 2 per iteration)
- Track 3: ~3-4 iterations (responsive fixes)

**Total: ~15-20 iterations** with parallel tracks

## Key Learnings to Embed in Beads

1. **aria-label Pattern**: Use `t()` for i18n, add keys to all 3 locales
2. **Focus Pattern**: `focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none`
3. **Skeleton Pattern**: Import from `@/components/ui/skeleton`, use for content placeholders
4. **Touch Target**: Minimum `p-2` (8px) or `p-3` (12px) on mobile
