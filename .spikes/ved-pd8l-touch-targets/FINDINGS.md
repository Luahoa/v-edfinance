# Spike: Touch Target Enforcement (ved-pd8l)

**Duration**: 30 minutes  
**Date**: 2026-01-07  
**Agent**: Amp

---

## Questions Answered

### 1. Does shadcn/ui button component have configurable min sizes?

**YES** - The button component ([button.tsx](file:///e:/Demo%20project/v-edfinance/apps/web/src/components/ui/button.tsx)) uses class-variance-authority (CVA) with three size variants:

```typescript
size: {
  default: "h-10 px-4 py-2",  // 40px height
  sm: "h-9 rounded-md px-3",  // 36px height ❌ Below 44px
  lg: "h-11 rounded-md px-8",  // 44px height ✅ WCAG compliant
  icon: "h-10 w-10",           // 40px square
}
```

**Finding**: `sm` and `default` sizes are below WCAG 2.5.5 minimum (44px).

---

### 2. Can we enforce 44px globally via Tailwind config?

**PARTIAL** - V-EdFinance uses **Tailwind CSS v4** with CSS-first configuration:

- **Config location**: [apps/web/src/app/globals.css](file:///e:/Demo%20project/v-edfinance/apps/web/src/app/globals.css) via `@theme inline` directive
- **No traditional config file**: Tailwind v4 uses CSS `@theme` blocks instead of `tailwind.config.js`
- **Custom utilities possible**: Can add custom height classes in `@layer utilities`

**Approach options**:
1. **Modify button.tsx sizes** directly (simplest)
2. **Add CSS custom properties** in `@theme` block for min-touch-target
3. **Create utility class** `.min-touch` in `@layer utilities`

---

### 3. Will this break existing layouts?

**YES - MODERATE IMPACT** - Grep analysis shows:

#### Button Usage Count
**8 import statements** found across pages:
- VideoControls.tsx
- Teacher revenue page
- Course roster page
- Checkout pages (2)
- Course lessons page
- Certificates page

#### Size Prop Usage
**15 size prop occurrences** found:
- `size="icon"` → 4 uses (VideoControls)
- `size="sm"` → 7 uses (various pages)
- `size="lg"` → 2 uses (course page)

**Breaking changes**:
1. **`size="sm"` buttons** (7 uses) → Need redesign or size increase
2. **Icon buttons** (4 uses) → Already 40px, need +4px
3. **Default buttons** → Need +4px (40px → 44px)

#### Other Touch Targets
**134 matches** for `h-[number]` patterns found:
- Icons: Many use `h-4 w-4` (16px), `h-5 w-5` (20px) - not interactive
- Interactive elements:
  - Tabs: `h-10` (40px) ❌
  - Table headers: `h-12` (48px) ✅
  - Avatar: `h-10 w-10` (40px) ❌
  - Progress bars, separators: decorative, OK

**HIGH RISK**: 
- SimplifiedSidebar nav items (`h-5 w-5` icons, unknown click area)
- VideoControls icon buttons (40px)
- Header nav icons (18px icons, unknown click area)

---

## ANSWER: Can enforce 44px without breaking layouts?

**NO - Requires layout refactoring**

**Reasoning**:
1. 7 pages use `size="sm"` buttons (36px)
2. Icon buttons at 40px need +4px
3. Sidebar/header icons need click area verification
4. No existing design tokens for min-touch-target

---

## Recommended Approach

### Phase 1: Button Component (SAFE)
**Update button.tsx variant defaults**:

```typescript
size: {
  default: "h-11 px-4 py-2",  // 40px → 44px
  sm: "h-11 rounded-md px-3", // 36px → 44px (keep "sm" name for semantics)
  lg: "h-12 rounded-md px-8", // 44px → 48px (maintain hierarchy)
  icon: "h-11 w-11",          // 40px → 44px
}
```

**Impact**: 
- All buttons auto-upgrade to 44px
- May cause vertical spacing issues in tight layouts
- **MOBILE TESTING REQUIRED**

---

### Phase 2: Interactive Icons (COMPLEX)
**Verify click areas** for:
- Sidebar nav items ([Sidebar.tsx](file:///e:/Demo%20project/v-edfinance/apps/web/src/components/organisms/Sidebar.tsx#L79))
- Header nav links ([Header.tsx](file:///e:/Demo%20project/v-edfinance/apps/web/src/components/organisms/Header.tsx#L34-L40))
- Video controls ([VideoControls.tsx](file:///e:/Demo%20project/v-edfinance/apps/web/src/components/atoms/VideoControls.tsx))

**Action**: Add `min-w-11 min-h-11` (44px) to clickable parent elements, even if icon is smaller.

**Example fix**:
```tsx
// Before
<button className="p-2">
  <Icon className="w-5 h-5" /> {/* 20px icon */}
</button>

// After
<button className="p-2 min-w-11 min-h-11 flex items-center justify-center">
  <Icon className="w-5 h-5" /> {/* 20px icon in 44px clickable area */}
</button>
```

---

### Phase 3: Global Utility (FUTURE-PROOF)
**Add to globals.css**:

```css
@layer utilities {
  .min-touch {
    min-width: 2.75rem;  /* 44px */
    min-height: 2.75rem; /* 44px */
  }
}
```

**Usage**: Apply `.min-touch` to any interactive element.

---

## Breaking Changes Summary

| Component | Current Size | Fix Required | Impact |
|-----------|--------------|--------------|--------|
| Button (sm) | 36px | +8px height | 7 pages |
| Button (default) | 40px | +4px height | All pages |
| Button (icon) | 40px | +4px both | VideoControls |
| Tabs | 40px | +4px height | Low |
| Avatar (clickable?) | 40px | Verify if interactive | Medium |
| Sidebar nav | Unknown | Verify click area | High |
| Header nav | Unknown | Verify click area | High |

**Total estimated changes**: 20-30 files

---

## Mobile Testing Strategy

### Viewport Sizes
1. **Mobile**: 375px × 667px (iPhone SE)
2. **Tablet**: 768px × 1024px (iPad)
3. **Desktop**: 1920px × 1080px

### Test Scenarios
1. **Button density**: Checkout page (multiple buttons stacked)
2. **Icon buttons**: VideoControls (play/pause/volume)
3. **Navigation**: Sidebar collapsed/expanded
4. **Forms**: Input fields + submit buttons

### Tools
- Chrome DevTools (mobile emulation)
- Playwright tests with touch event simulation
- Real device testing (iOS/Android)

### Success Criteria
- All interactive elements ≥44px in both dimensions
- No overlapping click areas
- Consistent spacing (no layout shifts)
- Accessible via screen reader

---

## Estimate

| Phase | Task | Hours |
|-------|------|-------|
| 1 | Update button.tsx variants | 0.5 |
| 1 | Fix button usage in 7 pages | 2.0 |
| 1 | Test button layouts (mobile) | 1.0 |
| 2 | Verify icon click areas | 1.5 |
| 2 | Fix Sidebar/Header/VideoControls | 2.5 |
| 2 | Test navigation (mobile) | 1.0 |
| 3 | Add .min-touch utility | 0.5 |
| 3 | Document pattern in AGENTS.md | 0.5 |
| | **TOTAL** | **9.5 hours** |

**Critical path**: Phase 1 (buttons) must complete before Phase 2 to avoid duplicate fixes.

---

## Risks

### HIGH
- **Layout shifts**: Buttons getting taller may break grids/flexbox layouts
- **Design consistency**: Larger buttons may not match Figma designs
- **Regression**: Existing A11y tests may fail if selectors change

### MEDIUM
- **Icon clarity**: Smaller icons in larger buttons may look odd
- **Mobile performance**: More DOM reads for click area verification

### LOW
- **CSS conflicts**: Tailwind v4 `@theme` override issues

---

## Next Steps

1. **Create beads** for 3 phases
2. **Spike completion**: Run `pnpm --filter web build` to verify no TypeScript errors
3. **Mobile test plan**: Write Playwright test for 44px assertion
4. **Design review**: Show button size changes to stakeholders

---

## References

- [WCAG 2.5.5 Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html) - 44×44 CSS pixels minimum
- [Tailwind CSS v4 Docs](https://tailwindcss.com/blog/tailwindcss-v4-alpha) - CSS-first configuration
- [shadcn/ui Button](https://ui.shadcn.com/docs/components/button) - Original component docs

---

## Conclusion

✅ **ANSWER**: **NO** - Cannot enforce 44px without breaking existing layouts  
✅ **APPROACH**: Phased refactor (buttons → icons → global utility)  
✅ **BREAKING CHANGES**: 7 pages with `size="sm"`, 4 VideoControls icon buttons  
✅ **MOBILE TESTING**: 3 viewports × 4 scenarios via Playwright  
✅ **ESTIMATE**: **9.5 hours** (3-phase implementation)

**Recommendation**: Start with Phase 1 (button.tsx) as isolated bead, validate with mobile tests before proceeding to Phase 2.
