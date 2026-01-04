# Execution Plan: ClaudeKit Frontend Skills Integration (Phase 1)

**Epic:** Integrate ClaudeKit Frontend Skills for UI/UX Excellence  
**Generated:** 2026-01-04  
**Goal:** Install and apply 5 frontend skills to improve design quality across V-EdFinance  
**Duration:** 2 weeks (34 hours total)

---

## 📋 Discovery Summary

### Current State (From Integration Assessment)
```
UI Quality:      ⚠️  Inconsistent (agent-built codebase)
Design System:   ❌  None
Accessibility:   ⚠️  Basic (no WCAG audit)
Performance:     🟡  Good (Lighthouse 80+) but can improve
Tech Stack:      ✅  Next.js 15, React 18, Tailwind CSS
```

### ClaudeKit Frontend Skills Available
1. **frontend-design** - Creative, polished UI (avoid generic AI aesthetics)
2. **frontend-development** - React/TS patterns, Suspense, lazy loading
3. **ui-styling** - shadcn/ui + Tailwind best practices
4. **aesthetic** - Beautiful interfaces (BEAUTIFUL → RIGHT → SATISFYING → PEAK)
5. **web-frameworks** - Next.js App Router, RSC, PPR, SSR/SSG

### Integration Strategy
**Approach:** Install skills → Create design system → Refactor pilot pages → Apply learnings across platform

---

## 🎯 Tracks (Sequential with Parallel Opportunities)

| Track | Agent          | Beads (in order)                              | File Scope                      | Duration |
|-------|----------------|-----------------------------------------------|---------------------------------|----------|
| 1     | SkillsInstall  | ved-fs-1 → ved-fs-2                           | `.claude/skills/frontend/**`    | 2 hrs    |
| 2     | DesignSystem   | ved-fs-3 → ved-fs-4 → ved-fs-5                | `docs/design-system/**`         | 8 hrs    |
| 3     | PilotRefactor  | ved-fs-6 → ved-fs-7 → ved-fs-8 → ved-fs-9 → ved-fs-10 | `apps/web/src/app/**`           | 20 hrs   |
| 4     | Documentation  | ved-fs-11 → ved-fs-12                         | `docs/**`                       | 4 hrs    |

**Total Duration:** 34 hours (2 weeks at 17 hrs/week)

---

## 📦 Track 1: SkillsInstall - Install Frontend Skills

**Agent:** SkillsInstall  
**File Scope:** `.claude/skills/frontend/**`  
**Dependencies:** None  
**Duration:** 2 hours

### Beads

#### ved-fs-1: Copy ClaudeKit frontend skills
**Description:**
Copy 5 frontend skills from `../claudekit-skills/.claude/skills/` to `.claude/skills/`:
- `frontend-design/`
- `frontend-development/`
- `ui-styling/`
- `aesthetic/`
- `web-frameworks/`

**Acceptance Criteria:**
- [ ] All 5 skills copied with complete directory structure
- [ ] SKILL.md files readable
- [ ] Examples and reference files included
- [ ] No file corruption during copy

**Commands:**
```bash
mkdir -p .claude/skills
cp -r ../claudekit-skills/.claude/skills/frontend-design .claude/skills/
cp -r ../claudekit-skills/.claude/skills/frontend-development .claude/skills/
cp -r ../claudekit-skills/.claude/skills/ui-styling .claude/skills/
cp -r ../claudekit-skills/.claude/skills/aesthetic .claude/skills/
cp -r ../claudekit-skills/.claude/skills/web-frameworks .claude/skills/
```

**Verification:**
```bash
ls -R .claude/skills/frontend-design
ls -R .claude/skills/frontend-development
ls -R .claude/skills/ui-styling
ls -R .claude/skills/aesthetic
ls -R .claude/skills/web-frameworks
```

---

#### ved-fs-2: Update AGENTS.md with frontend skills
**Description:**
Add new skills section to AGENTS.md documenting:
- When to use each skill
- Integration with existing workflow (Beads, Amp)
- Examples specific to V-EdFinance (behavioral finance UI)

**Acceptance Criteria:**
- [ ] AGENTS.md updated with frontend skills section
- [ ] Usage examples for each skill
- [ ] Integration points with Nudge/Hooked UI patterns
- [ ] Vietnamese market considerations (fonts, colors, cultural metaphors)

**Template:**
```markdown
## 🎨 Frontend Development Skills

### frontend-design
**When to use:** Creating new pages/components, redesigning existing UI
**Key principle:** Avoid generic AI aesthetics - distinctive, polished

### frontend-development  
**When to use:** Implementing components, optimizing performance
**Patterns:** Suspense, lazy loading, useSuspenseQuery

### ui-styling
**When to use:** Styling components, creating layouts
**Stack:** shadcn/ui + Tailwind CSS

### aesthetic
**When to use:** Design reviews, ensuring visual hierarchy
**Framework:** BEAUTIFUL → RIGHT → SATISFYING → PEAK

### web-frameworks
**When to use:** App Router patterns, SSR/SSG decisions
**Tech:** Next.js 15, RSC, PPR

### V-EdFinance Specific Guidelines
- Use Vietnamese cultural metaphors (rice farming for savings)
- Green primary color (financial growth symbolism)
- High readability (financial data clarity critical)
```

---

## 🎨 Track 2: DesignSystem - Create Design System

**Agent:** DesignSystem  
**File Scope:** `docs/design-system/**`  
**Dependencies:** Track 1 complete  
**Duration:** 8 hours

### Beads

#### ved-fs-3: Design system foundation
**Description:**
Create design system foundation using aesthetic skill principles

**Design System Structure:**
```
docs/design-system/
├── 01-colors.md           # Color palette (green primary, finance-themed)
├── 02-typography.md       # Fonts, hierarchy (Vietnamese + English)
├── 03-spacing.md          # Tailwind spacing scale
├── 04-components.md       # Component inventory
├── 05-patterns.md         # Common UI patterns
└── README.md              # Overview
```

**Acceptance Criteria:**
- [ ] Color palette defined (primary: green for growth, 5 shades)
- [ ] Typography scale (Vietnamese fonts: Inter, English: Inter)
- [ ] Spacing system documented (Tailwind default: 4px base)
- [ ] Accessibility guidelines (WCAG AA minimum)

**Aesthetic Skill Application (BEAUTIFUL Stage):**
- Visual hierarchy: F-pattern for financial data
- Color theory: Green (growth) + Blue (trust) + Red (alerts)
- Micro-interactions: Hover states, loading skeletons
- White space: Generous padding for readability

---

#### ved-fs-4: Component library audit
**Description:**
Audit existing components, categorize by quality

**Categories:**
- ✅ **Keep As-Is** - Well-designed, accessible
- ⚠️ **Needs Polish** - Functional but inconsistent styling
- 🔴 **Redesign** - Poor UX, not accessible

**Audit Criteria (Aesthetic Skill - RIGHT Stage):**
- Functionality: Does it work correctly?
- Accessibility: Keyboard nav, screen reader support
- Responsiveness: Mobile, tablet, desktop
- i18n: Vietnamese, English, Chinese support

**Deliverable:** `docs/design-system/component-audit.md`

---

#### ved-fs-5: Behavioral finance UI patterns
**Description:**
Define UI patterns specific to Nudge + Hooked theories

**Nudge UI Patterns:**
1. **Social Proof Widget**
   ```tsx
   // "1,234 users saved $10,000 this month"
   // Uses real-time data from BehaviorLog
   ```
2. **Loss Aversion Alert**
   ```tsx
   // "Don't lose your 7-day streak! Complete today's lesson."
   // Red color, urgent tone
   ```
3. **Progress Tracker**
   ```tsx
   // Visual progress bar with milestone celebrations
   // Confetti animation at 25%, 50%, 75%, 100%
   ```

**Hooked UI Patterns:**
1. **Variable Reward Cards**
   ```tsx
   // Randomized achievement unlocks
   // "You've unlocked: Budget Master Badge!"
   ```
2. **Investment Tracker**
   ```tsx
   // Show committed time/money (increases stickiness)
   // "You've invested 12 hours in this course"
   ```

**Acceptance Criteria:**
- [ ] 5 Nudge patterns documented with code examples
- [ ] 3 Hooked patterns documented
- [ ] Vietnamese cultural adaptations (rice metaphor for savings)
- [ ] Figma mockups (or ASCII diagrams if no Figma)

---

## 🚀 Track 3: PilotRefactor - Refactor 5 Pilot Pages

**Agent:** PilotRefactor  
**File Scope:** `apps/web/src/app/**`  
**Dependencies:** Track 2 complete (design system ready)  
**Duration:** 20 hours (4 hrs per page)

### Pilot Pages Selected

**Criteria for Selection:**
- High user traffic
- Critical to user journey
- Diverse component types
- Current quality issues

**Selected Pages:**
1. **Homepage** (`apps/web/src/app/[locale]/page.tsx`) - First impression
2. **Dashboard** (`apps/web/src/app/[locale]/dashboard/page.tsx`) - Daily use
3. **Course Detail** (`apps/web/src/app/[locale]/courses/[id]/page.tsx`) - Conversion critical
4. **Lesson Player** (`apps/web/src/app/[locale]/lessons/[id]/page.tsx`) - Core experience
5. **Prediction Game** (`apps/web/src/app/[locale]/prediction/page.tsx`) - Engagement hook

---

### Beads (One per Page)

#### ved-fs-6: Refactor Homepage
**Description:**
Apply frontend-design + aesthetic skills to homepage

**Before:**
- Generic AI-generated hero section
- Inconsistent spacing
- No clear call-to-action hierarchy

**After (Aesthetic Framework):**
- **BEAUTIFUL:** Clean hero with Vietnamese rice field imagery (metaphor)
- **RIGHT:** Prominent CTA ("Start Your Financial Journey"), accessible keyboard nav
- **SATISFYING:** Smooth scroll animations, hover micro-interactions
- **PEAK:** Success story carousel (social proof)

**Acceptance Criteria:**
- [ ] Lighthouse score: 95+
- [ ] Accessibility: 100 (WCAG AA)
- [ ] Vietnamese cultural elements present
- [ ] Mobile-first responsive
- [ ] Loading time \u003c 2s (LCP)

**Frontend Development Patterns:**
```tsx
// Suspense for data fetching
<Suspense fallback={<HeroSkeleton />}>
  <HeroSection />
</Suspense>

// Lazy load below-fold content
const SuccessStories = lazy(() => import('./SuccessStories'));
```

---

#### ved-fs-7: Refactor Dashboard
**Description:**
Apply ui-styling + web-frameworks skills

**Components to Refactor:**
- `QuickActionsGrid` - shadcn/ui Card components
- `ProgressRing` - Accessible SVG progress with ARIA labels
- `RecentActivity` - Skeleton loading states

**Acceptance Criteria:**
- [ ] shadcn/ui components used consistently
- [ ] Dark mode support (toggle in navbar)
- [ ] Real-time updates (WebSocket for activity feed)
- [ ] Nudge widgets displayed (social proof, loss aversion)

---

#### ved-fs-8: Refactor Course Detail Page
**Description:**
Apply frontend-design for conversion optimization

**Key Changes:**
- Larger, more compelling course thumbnails (AI-generated in future)
- Clear pricing display (free vs paid)
- Social proof ("1,234 students enrolled")
- Preview video with play button (not autoplay)
- Sticky CTA button (follow scroll)

**Acceptance Criteria:**
- [ ] Conversion-optimized layout
- [ ] Video player accessible (keyboard controls)
- [ ] Enrollment CTA visible on scroll
- [ ] Mobile-optimized (thumb-friendly buttons)

---

#### ved-fs-9: Refactor Lesson Player
**Description:**
Apply frontend-development + web-frameworks (RSC patterns)

**Architecture:**
- Server Component: Lesson metadata, video URL
- Client Component: Video player (interactive)
- Suspense boundaries: Prevent blocking on video load

**Acceptance Criteria:**
- [ ] Video playback smooth (no jank)
- [ ] Progress tracking works (BehaviorLog integration)
- [ ] Keyboard shortcuts (space = pause, arrow keys = seek)
- [ ] Captions support (Vietnamese + English)

---

#### ved-fs-10: Refactor Prediction Game
**Description:**
Apply aesthetic + ui-styling for engaging gamification

**Gamification Enhancements:**
- Confetti animation on correct prediction
- Leaderboard with avatar + rank
- Streak counter (Hooked pattern - Investment)
- Variable rewards (random bonus points)

**Acceptance Criteria:**
- [ ] Animations smooth (60 FPS)
- [ ] Leaderboard real-time (WebSocket)
- [ ] Accessible (keyboard navigation for games)
- [ ] Vietnamese number formatting (1.234 instead of 1,234)

---

## 📚 Track 4: Documentation - Document Learnings

**Agent:** Documentation  
**File Scope:** `docs/**`  
**Dependencies:** Track 3 complete (pilot refactors done)  
**Duration:** 4 hours

### Beads

#### ved-fs-11: Create integration guide
**Description:**
Document frontend skills integration for future agents

**Guide Structure:**
```markdown
# Frontend Skills Integration Guide

## Skills Overview
[Brief description of each skill]

## Design System Usage
[How to use docs/design-system/]

## Common Patterns
[Reusable patterns from pilot refactors]

## Troubleshooting
[Common issues + solutions]

## Examples
[Code snippets from pilot pages]
```

**Acceptance Criteria:**
- [ ] Integration guide created
- [ ] Examples from all 5 pilot pages
- [ ] Screenshots/diagrams included
- [ ] Vietnamese + English versions

---

#### ved-fs-12: Update AGENTS.md with learnings
**Description:**
Add Phase 1 learnings to AGENTS.md

**Learnings to Document:**
- Which skill works best for which scenario
- Vietnamese cultural adaptations
- Performance optimization tips
- Accessibility checklist

**Acceptance Criteria:**
- [ ] AGENTS.md updated
- [ ] Code quality checklist includes frontend skills
- [ ] Beads workflow includes design review step

---

## 🔗 Cross-Track Dependencies

```
Track 1 (SkillsInstall)
    ↓
Track 2 (DesignSystem)
    ↓
Track 3 (PilotRefactor) ─────────┐
    ├─ ved-fs-6 (Homepage)        │
    ├─ ved-fs-7 (Dashboard)       │ (can parallelize)
    ├─ ved-fs-8 (Course Detail)   │
    ├─ ved-fs-9 (Lesson Player)   │
    └─ ved-fs-10 (Prediction)     │
                                  ↓
                        Track 4 (Documentation)
```

**Critical Path:** Track 1 → Track 2 → ved-fs-6 (first refactor) → Track 4

**Parallel Opportunities:**
- ved-fs-7 through ved-fs-10 can run in parallel (different files)
- Track 4 can start after first 2 refactors complete (early documentation)

---

## 🎓 Key Learnings (Embedded from Debugging Skills)

### Systematic Approach
1. **Install skills first** - Don't refactor without proper tools
2. **Create design system** - Consistency before creativity
3. **Pilot refactors** - Test patterns on 5 pages before scaling
4. **Document learnings** - Capture knowledge for future use

### Defense-in-Depth for UI
- **Layer 1:** Design system (consistent foundation)
- **Layer 2:** Component audit (quality gate)
- **Layer 3:** Accessibility testing (WCAG compliance)
- **Layer 4:** Performance monitoring (Lighthouse scores)

### Verification Before Completion
- **Lighthouse CI** - Automated performance/accessibility checks
- **Visual regression tests** - Percy or Chromatic
- **User testing** - 5 Vietnamese users test pilot pages
- **Evidence** - Screenshots + metrics in bead close reasons

---

## 📊 Success Metrics

**Phase 1 Exit Criteria:**
```
✅ All 5 frontend skills installed
✅ Design system documented (8 guides)
✅ 5 pilot pages refactored
✅ Lighthouse scores 95+ (all pages)
✅ Accessibility scores 100 (WCAG AA)
✅ User engagement +20% (A/B test)
```

**Verification Commands:**
```bash
# Lighthouse CI (all 5 pages)
pnpm lighthouse-ci --urls /,/dashboard,/courses/1,/lessons/1,/prediction

# Accessibility audit
pnpm axe-scan apps/web

# Visual regression (if Percy installed)
percy snapshot apps/web

# Bundle size
pnpm analyze-bundle
```

---

## 🚀 Orchestrator Quick Start

**When ready to execute:**

1. Load orchestrator skill: `/skill orchestrator`
2. Read this plan: `Read("history/claudekit-ecosystem/frontend-execution-plan.md")`
3. Initialize Agent Mail
4. Spawn 4 workers:
   - Track 1: SkillsInstall (sequential)
   - Track 2: DesignSystem (sequential, depends on Track 1)
   - Track 3: PilotRefactor (parallel 5 agents after Track 2)
   - Track 4: Documentation (sequential, depends on Track 3)
5. Monitor via epic thread: `frontend-skills-phase1`
6. Verify Phase 1 complete

**Estimated Wall Time:** 1 week (with 5 parallel agents in Track 3)

---

**Report Generated:** 2026-01-04  
**By:** ClaudeKit Integration Planning Agent  
**Status:** Ready for Execution (Pending User Approval)
