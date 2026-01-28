---
description: Enforce i18n best practices on all frontend code changes
globs:
  - "apps/web/src/**/*.tsx"
  - "apps/web/src/messages/*.json"
alwaysApply: true
---

# i18n Enforcement Rules

## CRITICAL - No Hardcoded Strings

When editing any `.tsx` file in `apps/web/src/`:

1. **Never use hardcoded user-facing strings**
   - ❌ `<Button>Save</Button>`
   - ✅ `<Button>{t('save')}</Button>`

2. **Always import useTranslations**
   ```tsx
   import { useTranslations } from 'next-intl';
   const t = useTranslations('Namespace');
   ```

3. **Update ALL locale files together**
   - `apps/web/src/messages/vi.json`
   - `apps/web/src/messages/en.json`
   - `apps/web/src/messages/zh.json`

## Namespace Convention

| Feature | Namespace |
|---------|-----------|
| Dashboard | `Dashboard` |
| Courses | `Courses` |
| Certificates | `Certificates` |
| Lessons | `Lessons` |
| Quiz | `Quiz` |
| Common UI | `Common` |
| Navigation | `Navigation` |
| Accessibility | `Accessibility` |

## JSONB Localized Content

For database content (courses, lessons), use JSONB:
```typescript
// Schema
title: jsonb('title'), // { vi: "...", en: "...", zh: "..." }

// Access with fallback
const title = data.title?.[locale] ?? data.title?.vi ?? 'Untitled';
```

## Quick Reference

```tsx
// Component pattern
'use client';
import { useTranslations } from 'next-intl';

export function MyFeature() {
  const t = useTranslations('MyFeature');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
      <Button>{t('actions.submit')}</Button>
    </div>
  );
}
```
