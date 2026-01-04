# Frontend Skills Integration Guide

**Date:** 2026-01-04  
**Status:** Active  
**Scope:** V-EdFinance Frontend Architecture

## 📚 Skills Overview

We have installed 5 ClaudeKit frontend skills in `.claude/skills/`:

1.  **frontend-design:** Creative UI/UX patterns (avoids generic AI look).
2.  **frontend-development:** React/TS best practices (Suspense, Lazy Loading).
3.  **ui-styling:** shadcn/ui + Tailwind CSS architecture.
4.  **aesthetic:** Design quality framework (Beautiful → Peak).
5.  **web-frameworks:** Next.js App Router patterns (RSC, PPR).

## 🎨 Design System Usage

### Colors
Use semantic names from `docs/design-system/01-colors.md`:
- **Primary:** `bg-green-600` (Growth)
- **Secondary:** `bg-blue-600` (Trust)
- **Alert:** `bg-red-600` (Loss Aversion)

### Components
Use `shadcn/ui` components from `@/components/ui/`.
DO NOT create custom atoms unless necessary.

**Example:**
```tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function FeatureCard() {
  return (
    <Card>
      <CardContent className="p-6">
        <Button variant="default">Get Started</Button>
      </CardContent>
    </Card>
  );
}
```

## 🧩 Common Patterns

### 1. Lazy Loading Components (Performance)
Wrap heavy components (Charts, Maps, complex interactive elements) with `next/dynamic` and `Skeleton` fallbacks.

```tsx
const Chart = dynamic(() => import('./Chart'), {
  loading: () => <Skeleton className="h-64 w-full rounded-xl" />,
});
```

### 2. Behavioral Nudges (Engagement)
Use the patterns defined in `docs/design-system/05-patterns.md`.

**Social Proof:**
```tsx
<div className="flex items-center gap-2">
  <Users className="w-4 h-4 text-zinc-500" />
  <span>1,200 students enrolled</span>
</div>
```

### 3. Layouts
Use `container mx-auto max-w-7xl` for main page content to ensure readability on large screens.

## 🛠️ Troubleshooting

**Issue:** `shadcn` component missing.
**Fix:** Run `npx shadcn@latest add <component-name>`.

**Issue:** Lint errors (unused vars).
**Fix:** Remove unused imports or prefix with `_`.

**Issue:** Hydration mismatch.
**Fix:** Ensure Client Components (`'use client'`) are used for interactive parts, and Server Components for initial data fetching.
