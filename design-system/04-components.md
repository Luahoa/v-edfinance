# 04. Component Library Audit

**Date:** 2026-01-04
**Status:** Audit Complete
**Strategy:** Migrate custom components to `shadcn/ui` where possible.

## 🧱 Atoms (Basic Building Blocks)

| Component | Status | Action | Notes |
|-----------|--------|--------|-------|
| `Badge.tsx` | ⚠️ Refactor | Replace | Use `shadcn/ui/badge` |
| `BuddyAvatar.tsx` | ⚠️ Refactor | Wrap | Use `shadcn/ui/avatar` |
| `Button.tsx` | ⚠️ Refactor | Replace | Use `shadcn/ui/button` |
| `Card.tsx` | ⚠️ Refactor | Replace | Use `shadcn/ui/card` |
| `Input.tsx` | ⚠️ Refactor | Replace | Use `shadcn/ui/input` |
| `NavLink.tsx` | ✅ Keep | Style | Apply new active states |
| `ProgressRing.tsx` | ✅ Keep | Polish | Update colors to Green/Blue theme |
| `Skeleton.tsx` | ⚠️ Refactor | Replace | Use `shadcn/ui/skeleton` |
| `GlobalErrorBoundary.tsx` | ✅ Keep | Enhance | Add "Report Issue" button |

## 🧬 Molecules (Combinations)

| Component | Status | Action | Notes |
|-----------|--------|--------|-------|
| `BuddyRecommendations.tsx` | ⚠️ Polish | Refactor | Use Cards + Avatars |
| `CourseCard.tsx` | ⚠️ Polish | Refactor | Use `shadcn/card`, add progress bar |
| `LocaleSwitcher.tsx` | ⚠️ Polish | Refactor | Use `shadcn/dropdown-menu` |
| `NudgeBanner.tsx` | 🔴 Redesign | Replace | Use `shadcn/alert` or custom variant |
| `SmartNudgeBanner.tsx` | 🔴 Redesign | Merge | Merge with NudgeBanner |
| `QuickActions.tsx` | ⚠️ Polish | Refactor | Grid layout update |
| `SocialPostCard.tsx` | ⚠️ Polish | Refactor | Align with Facebook/social style |
| `YouTubeEmbed.tsx` | ✅ Keep | Optimize | Add lazy loading facade |

## 🦠 Organisms (Complex Sections)

| Component | Status | Action | Notes |
|-----------|--------|--------|-------|
| `AchievementCelebration.tsx` | ✅ Keep | Polish | Use new animation tokens |
| `AchievementModal.tsx` | ⚠️ Refactor | Replace | Use `shadcn/dialog` |
| `AdminLessonForm.tsx` | ⚠️ Refactor | Form | Use `react-hook-form` + `zod` |
| `CommandPalette.tsx` | ⚠️ Refactor | Replace | Use `shadcn/command` (cmdk) |
| `Footer.tsx` | ✅ Keep | Update | Update links and copyright |
| `Header.tsx` | ⚠️ Refactor | Layout | Sticky header with glassmorphism |
| `InteractiveChecklist.tsx` | ⚠️ Refactor | Refactor | Use `shadcn/checkbox` |
| `Navigation.tsx` | ⚠️ Refactor | Update | Mobile responsive menu |
| `QuickActionsGrid.tsx` | ⚠️ Polish | Update | Consistent icon usage |
| `Sidebar.tsx` | ⚠️ Refactor | Replace | Use `shadcn/sheet` for mobile |
| `SocialFeed.tsx` | ⚠️ Polish | Update | Virtual scrolling for performance |

## 🎮 Feature: Quiz System (New)

| Component | Status | Action | Notes |
|-----------|--------|--------|-------|
| `QuizPlayer.tsx` | ✅ New | Polish | Add Nudge animations |
| `QuizBuilderForm.tsx` | ✅ New | Form | Validate complex logic |
| `Matching.tsx` | ✅ New | A11y | Drag & Drop accessibility |
| `MultipleChoice.tsx` | ✅ New | Style | Keyboard navigation |
| `ShortAnswer.tsx` | ✅ New | Style | Input validation visual |
| `TrueFalse.tsx` | ✅ New | Style | Big touch targets |
| `QuizProgress.tsx` | ✅ New | Style | Animated progress bar |
| `QuizNavigation.tsx` | ✅ New | Style | Sticky bottom on mobile |

## 📥 shadcn/ui Components Needed

Run the following to install required base components:

```bash
npx shadcn@latest add button card badge avatar input skeleton dialog sheet command dropdown-menu alert checkbox progress tabs toast
```
