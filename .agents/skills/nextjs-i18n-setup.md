# Skill: Next.js 15 + next-intl i18n Setup

**Purpose:** Bootstrap a Next.js 15 App Router project with next-intl for multi-language support (vi, en, zh).

**When to use:** Starting a new edtech/SaaS frontend that requires internationalization.

---

## Prerequisites

- Node.js 20.x LTS
- pnpm installed
- Next.js 15.1.2, React 18.3.1

---

## Step-by-Step Execution

### 1. Install Dependencies

```bash
pnpm add next-intl@3.26.3
```

### 2. Create Required File Structure

```
src/
├── app/
│   ├── layout.tsx           # Root layout (MANDATORY - returns children only)
│   ├── page.tsx             # Root redirect to default locale
│   └── [locale]/
│       ├── layout.tsx       # Locale-specific layout with next-intl provider
│       ├── page.tsx         # Localized home page
│       ├── (auth)/
│       │   ├── login/
│       │   └── register/
│       └── dashboard/
├── middleware.ts            # Locale detection & routing
├── i18n/
│   ├── request.ts          # next-intl config
│   └── routing.ts          # Locale routing config
└── messages/
    ├── en.json
    ├── vi.json
    └── zh.json
```

### 3. Root Layout (`src/app/layout.tsx`)

```tsx
import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export default function RootLayout({ children }: Props) {
  return children;
}
```

**⚠️ CRITICAL:** This file is mandatory in Next.js 15+ App Router. Without it, no routes will be generated.

### 4. Root Page (`src/app/page.tsx`)

```tsx
import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/vi'); // Default locale
}
```

### 5. Locale Layout (`src/app/[locale]/layout.tsx`)

```tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!routing.locales.includes(params.locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={params.locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

### 6. i18n Routing Config (`src/i18n/routing.ts`)

```tsx
import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['vi', 'en', 'zh'],
  defaultLocale: 'vi',
});

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
```

### 7. i18n Request Config (`src/i18n/request.ts`)

```tsx
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

### 8. Middleware (`src/middleware.ts`)

```tsx
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/', '/(vi|en|zh)/:path*'],
};
```

### 9. Next.js Config (`next.config.ts`)

```tsx
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // Your config here
};

export default withNextIntl(nextConfig);
```

### 10. Translation Files

**`src/messages/vi.json`:**
```json
{
  "common": {
    "welcome": "Chào mừng"
  }
}
```

**`src/messages/en.json`:**
```json
{
  "common": {
    "welcome": "Welcome"
  }
}
```

**`src/messages/zh.json`:**
```json
{
  "common": {
    "welcome": "欢迎"
  }
}
```

---

## Usage in Components

### Server Component

```tsx
import { useTranslations } from 'next-intl';

export default function HomePage({ params }: { params: { locale: string } }) {
  const t = useTranslations('common');
  
  return <h1>{t('welcome')}</h1>;
}
```

### Client Component

```tsx
'use client';

import { useTranslations } from 'next-intl';

export default function WelcomeBanner() {
  const t = useTranslations('common');
  
  return <div>{t('welcome')}</div>;
}
```

---

## Verification Checklist

- [ ] `pnpm dev` starts without errors
- [ ] `/` redirects to `/vi`
- [ ] `/vi`, `/en`, `/zh` all render correctly
- [ ] Translations load properly
- [ ] `pnpm build` succeeds
- [ ] `app-paths-manifest.json` contains routes (check `.next/server/`)

---

## Common Pitfalls

1. **Missing root layout** → No routes generated
2. **Middleware config wrong** → Infinite redirect loops
3. **Missing generateStaticParams** → 404 on locale routes
4. **Wrong next-intl plugin path** → Config not loaded

---

## References

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Next.js App Router](https://nextjs.org/docs/app)
