# Discovery Report: UI Accessibility & Polish Improvement

## Architecture Snapshot

**Relevant packages:**
- `apps/web` - Next.js 15.1.2 frontend with App Router
- React 18.3.1 + TypeScript (strict mode)
- shadcn/ui + Tailwind CSS for styling
- next-intl for i18n (vi, en, zh)

**Key modules:**
- `apps/web/src/components/organisms/` - Complex UI components (Header, Sidebar, CommandPalette, InteractiveChecklist)
- `apps/web/src/components/molecules/` - Medium complexity (LocaleSwitcher, BuddyRecommendations)
- `apps/web/src/components/atoms/` - Base components
- `apps/web/src/components/ui/` - shadcn/ui primitives
- `apps/web/src/app/[locale]/dashboard/` - Main dashboard page

**Entry points:**
- Dashboard: `apps/web/src/app/[locale]/dashboard/page.tsx`
- Layout: `apps/web/src/app/[locale]/layout.tsx`

## Existing Patterns

**Accessibility patterns found:**
- Some components use `aria-label` correctly (e.g., Header navigation)
- Focus rings implemented using Tailwind's `focus-visible:ring-2`
- Keyboard navigation partially implemented

**Loading state patterns:**
- **Inconsistent**: Mix of Skeleton components, Loader2 spinners, and text-based loading
- Project has `Skeleton` component available in `apps/web/src/components/ui/skeleton.tsx`
- Best practice: Use Skeleton for content placeholders

**Focus state patterns:**
- Some components suppress focus with `outline-none` without alternatives
- Best practice: Use `focus-visible:ring-2 focus-visible:ring-offset-2`

## Technical Constraints

**Node/Package versions:**
- Node.js 18+ required
- pnpm workspace setup
- TypeScript strict mode (no `any` types allowed)

**Build requirements:**
- Must pass: `pnpm --filter web build`
- Must pass: `pnpm --filter web lint`
- Quality gates: TypeScript build, test coverage ≥80%, zero any types

**UI Framework constraints:**
- shadcn/ui + Tailwind CSS (no arbitrary values like `w-[350px]`)
- Atomic Design pattern (atoms/molecules/organisms)
- BEAUTIFUL/RIGHT/SATISFYING/PEAK framework
- ClaudeKit Frontend Skills guidelines

## Accessibility Issues Found

### Critical Issues (Keyboard/Screen Reader Blockers)

1. **Missing aria-labels on icon buttons:**
   - `AiMentor.tsx` - Send button, minimize button
   - `CommandPalette.tsx` - Close button
   - `BuddyRecommendations.tsx` - Join buddy button

2. **Suppressed focus states without alternatives:**
   - `LocaleSwitcher.tsx` - `focus:outline-none` on select element
   - `CommandPalette.tsx` - `outline-none` on close button and command items
   - `command.tsx` (shadcn primitive) - `outline-none` on input

3. **Inconsistent loading states:**
   - `AiMentor.tsx` - Uses Loader2 spinner instead of Skeleton
   - `InteractiveChecklist.tsx` - No loading skeleton
   - `QuizPlayer.tsx` - Custom spinner instead of Skeleton
   - `CertificateList.tsx` - Text-based loading

### Medium Priority Issues

4. **Missing focus rings:**
   - `InteractiveChecklist.tsx` - Checklist item buttons lack focus rings
   - `BuddyRecommendations.tsx` - Join button lacks focus state

5. **Responsive design gaps:**
   - Mobile navigation needs improvement
   - Touch target sizes may be too small on mobile

## Naming Conventions

**Components:**
- PascalCase: `AiMentor.tsx`, `InteractiveChecklist.tsx`
- Follows Atomic Design: atoms/, molecules/, organisms/

**Utilities:**
- camelCase for functions
- kebab-case for files

**i18n keys:**
- Namespace pattern: `t('dashboard.stats.totalSavings')`

## External References

**Accessibility standards:**
- WCAG 2.1 AA compliance required
- Minimum contrast ratio: 4.5:1 for text
- Touch target size: 44x44px minimum (mobile)

**shadcn/ui docs:**
- Skeleton component: [shadcn/ui/skeleton](https://ui.shadcn.com/docs/components/skeleton)
- Accessible button patterns: Built-in with Radix UI primitives

**ClaudeKit Frontend Skills:**
- aesthetic.md - BEAUTIFUL/RIGHT/SATISFYING/PEAK framework
- ui-styling.md - Tailwind + shadcn/ui best practices
- frontend-development.md - Suspense + Skeleton for loading states

## Risk Assessment Preview

**LOW risk (existing patterns):**
- Adding aria-labels to buttons
- Replacing Loader2 with Skeleton components
- Adding focus-visible rings

**MEDIUM risk (variations):**
- Fixing focus states on form elements (may affect styling)
- Mobile responsive improvements (need testing on devices)

**HIGH risk (novel):**
- None identified - all issues follow existing patterns in codebase
