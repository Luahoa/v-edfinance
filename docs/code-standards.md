---
title: "Code Standards"
description: "TypeScript, React, and naming conventions for V-EdFinance"
category: "reference"
lastUpdated: 2026-01-09
version: "1.0.0"
---

# Code Standards

> Comprehensive coding conventions for the V-EdFinance codebase.

## TypeScript

### Strict Mode
- **Strict mode enabled** - no compromises
- **No `any` types** - use proper typing or `unknown`
- **Prefer `interface` over `type`** for object shapes
- Use explicit return types for functions

```typescript
// ✅ Good
interface UserProps {
  id: string;
  name: string;
}

function getUser(id: string): Promise<UserProps> {
  return fetchUser(id);
}

// ❌ Bad
type UserProps = { id: any; name: any };
function getUser(id) { return fetchUser(id); }
```

### Type Definitions
- Props interfaces named with `Props` suffix (e.g., `ButtonProps`)
- Return types explicitly declared
- Use `unknown` for uncertain types, never `any`

---

## React/Next.js

### Component Rules
- **Functional components only** - no class components
- **Server Components by default** - use `'use client'` only when needed
- **Atomic Design pattern**: `atoms/`, `molecules/`, `organisms/`

```tsx
// atoms/Button.tsx - Small, reusable UI element
export function Button({ children, onClick }: ButtonProps) {
  return <button onClick={onClick}>{children}</button>;
}

// molecules/SearchBar.tsx - Combination of atoms
export function SearchBar({ onSearch }: SearchBarProps) {
  return (
    <div>
      <Input />
      <Button onClick={onSearch}>Search</Button>
    </div>
  );
}

// organisms/Header.tsx - Complex section with business logic
export function Header() {
  return (
    <header>
      <Logo />
      <Navigation />
      <SearchBar />
    </header>
  );
}
```

### Suspense & Loading
Always wrap async components in Suspense with Skeleton fallback:

```tsx
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="h-20 w-full" />}>
      <AsyncComponent />
    </Suspense>
  );
}
```

### Lazy Loading
Use `lazy()` for below-fold content:

```tsx
import { lazy } from 'react';

const HeavyChart = lazy(() => import('@/components/HeavyChart'));
```

---

## State Management

| Type | Solution |
|------|----------|
| Global state | **Zustand** |
| Local state | React hooks (`useState`, `useReducer`) |
| Server state | React Query (if applicable) |

```typescript
// Zustand store example
import { create } from 'zustand';

interface AuthStore {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
}));
```

---

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `UserProfile.tsx` |
| Files (utilities) | kebab-case | `format-date.ts` |
| Variables/Functions | camelCase | `getUserById` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| Types/Interfaces | PascalCase | `UserProps` |

---

## Styling

### Stack
- **shadcn/ui** + **Tailwind CSS**
- Use `cn()` for class merging
- Use design system tokens (colors, spacing)

```tsx
import { cn } from '@/lib/utils';

<Button className={cn('mt-4', isActive && 'bg-primary')} />
```

### Rules
- ✅ Use design tokens: `text-primary`, `bg-muted`
- ❌ Avoid arbitrary values: `w-[350px]`, `text-[#ff0000]`
- ✅ Use spacing scale: `p-4`, `mt-8`
- ❌ Avoid magic numbers: `p-[13px]`

---

## i18n (Internationalization)

### Translation Files
- Location: `apps/web/src/i18n/locales/{locale}.json`
- Supported locales: `vi` (default), `en`, `zh`

### Usage
```tsx
import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('Dashboard');
  return <h1>{t('title')}</h1>;
}
```

### Rules
- **Always add translations to all three locale files**
- No hardcoded UI strings
- Use JSONB for database localized fields

---

## Accessibility (WCAG AA)

### Required for All Interactive Components
1. **aria-labels** via i18n (`Accessibility` namespace)
2. **Focus management** (visible ring, focus trap for modals)
3. **Loading announcements** (aria-live + Skeleton)
4. **Touch targets** (44px minimum)

```tsx
<Button
  aria-label={a('submitForm')}
  className="focus-visible:ring-2 focus-visible:ring-primary"
>
  Submit
</Button>
```

See [UI Accessibility Best Practices](../AGENTS.md#ui-accessibility-best-practices-wcag-aa) for full guide.

---

## Quality Gates

Before merging, ensure:

- [ ] `pnpm --filter web lint` passes
- [ ] `pnpm --filter web build` succeeds
- [ ] No TypeScript errors
- [ ] No `any` types
- [ ] Translations added to all locales
- [ ] Accessibility checklist complete
