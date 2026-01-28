---
description: Standard workflow for implementing new features with i18n support in V-EdFinance
globs:
  - "apps/web/src/**/*.tsx"
  - "apps/web/src/**/*.ts"
---

# Feature Implementation Workflow (i18n-First)

## 1. Analysis & Planning
- Understand feature requirements
- Design data structure and tRPC integration
- **Identify all user-facing text for localization**

## 2. Implementation

### State & API
- Use **Zustand** for client state (`apps/web/src/stores/`)
- Use **tRPC** for server state (`trpc.*.useQuery()`)
- NO Redux - project uses Zustand + TanStack Query

### Components
- **Icons:** Use Lucide icons (`lucide-react`)
- **UI:** Prioritize shadcn/ui components from `apps/web/src/components/ui/`
- **Atomic Design:** atoms → molecules → organisms
- **CRITICAL: No hardcoded strings** - use `t('key')` from start

### i18n Pattern
```tsx
import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('FeatureName');
  return <h1>{t('title')}</h1>;
}
```

## 3. Localization Files

**Location:** `apps/web/src/messages/`

Add keys to ALL three files:
1. `vi.json` - Vietnamese (default)
2. `en.json` - English
3. `zh.json` - Chinese

**Structure:**
```json
{
  "FeatureName": {
    "title": "Feature Title",
    "description": "Feature description",
    "actions": {
      "save": "Save",
      "cancel": "Cancel"
    }
  }
}
```

## 4. Database Localization

For user-generated content, use **JSONB fields**:

```typescript
// Drizzle schema
title: jsonb('title').notNull(), // { vi: "...", en: "...", zh: "..." }

// Access
const title = course.title[locale] || course.title['vi'];
```

## 5. Verification Checklist

- [ ] All UI strings use `t('key')`
- [ ] Keys exist in vi.json, en.json, zh.json
- [ ] Switch languages (Vi/En/Zh) to verify
- [ ] JSONB fields validated with Zod
- [ ] Build passes: `pnpm --filter web build`
