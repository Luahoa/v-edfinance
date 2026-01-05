# Frontend Architecture (Next.js)

**App**: `apps/web/`  
**Framework**: Next.js 15.1.2 + React 18.3.1  
**Purpose**: User-facing web application with multi-language support

---

## Table of Contents

- [Directory Structure](#directory-structure)
- [App Router Architecture](#app-router-architecture)
- [Component Architecture](#component-architecture)
- [State Management](#state-management)
- [Internationalization (i18n)](#internationalization-i18n)
- [Styling System](#styling-system)
- [Performance Optimizations](#performance-optimizations)

---

## Directory Structure

```
apps/web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   └── [locale]/           # i18n routing (vi/en/zh)
│   │       ├── layout.tsx      # Root layout
│   │       ├── page.tsx        # Home page
│   │       ├── courses/        # Course pages
│   │       ├── profile/        # User profile
│   │       └── ...
│   ├── components/             # React components (Atomic Design)
│   │   ├── atoms/              # Basic UI elements
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── ...
│   │   ├── molecules/          # Composite components
│   │   │   ├── CourseCard.tsx
│   │   │   ├── Navbar.tsx
│   │   │   └── ...
│   │   └── organisms/          # Complex components
│   │       ├── CourseCatalog.tsx
│   │       ├── AchievementPanel.tsx
│   │       └── ...
│   ├── lib/                    # Utilities & helpers
│   │   ├── api.ts              # API client
│   │   ├── formatters.ts       # Date, currency formatters
│   │   └── validators.ts       # Form validation
│   ├── stores/                 # Zustand state management
│   │   ├── useAuthStore.ts
│   │   ├── useUIStore.ts
│   │   └── ...
│   ├── i18n/                   # Internationalization
│   │   ├── locales/
│   │   │   ├── en.json
│   │   │   ├── vi.json
│   │   │   └── zh.json
│   │   └── request.ts          # next-intl config
│   └── styles/
│       └── globals.css         # Global Tailwind imports
├── public/                     # Static assets
│   ├── images/
│   ├── fonts/
│   └── ...
├── next.config.js              # Next.js configuration
├── tailwind.config.js          # Tailwind CSS config
└── tsconfig.json               # TypeScript config
```

---

## App Router Architecture

### File-Based Routing

Next.js 15 uses **App Router** with file-based routing:

```
app/[locale]/
├── layout.tsx              → /vi, /en, /zh
├── page.tsx                → /vi, /en, /zh (home)
├── courses/
│   ├── page.tsx            → /vi/courses
│   └── [id]/
│       ├── page.tsx        → /vi/courses/123
│       └── lessons/
│           └── [lessonId]/
│               └── page.tsx → /vi/courses/123/lessons/456
├── profile/
│   ├── page.tsx            → /vi/profile
│   └── settings/
│       └── page.tsx        → /vi/profile/settings
└── ...
```

### Server vs Client Components

**Default: Server Components** (RSC)
- Fetch data on server
- No JavaScript sent to client
- Better SEO, faster initial load

**Use `'use client'` when needed**:
- Event handlers (`onClick`, `onChange`)
- React hooks (`useState`, `useEffect`)
- Browser APIs (`localStorage`, `window`)

**Example**:
```tsx
// app/[locale]/courses/page.tsx (Server Component)
export default async function CoursesPage() {
  const courses = await fetch('http://api:3001/api/courses').then(r => r.json());
  
  return <CourseCatalog courses={courses} />; // Client component
}

// components/organisms/CourseCatalog.tsx (Client Component)
'use client';

export default function CourseCatalog({ courses }) {
  const [filter, setFilter] = useState('all');
  
  return (
    <div>
      <FilterButtons onChange={setFilter} />
      {courses.filter(c => filter === 'all' || c.category === filter).map(...)}
    </div>
  );
}
```

---

## Component Architecture

### Atomic Design Pattern

We use **Atomic Design** for component organization:

#### 1. Atoms (Basic UI elements)
```tsx
// components/atoms/Button.tsx
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export default function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-4 py-2 rounded',
        variant === 'primary' && 'bg-blue-600 text-white',
        variant === 'secondary' && 'bg-gray-200 text-gray-800'
      )}
    >
      {label}
    </button>
  );
}
```

#### 2. Molecules (Composite components)
```tsx
// components/molecules/CourseCard.tsx
interface CourseCardProps {
  title: string;
  description: string;
  imageUrl: string;
  onEnroll: () => void;
}

export default function CourseCard({ title, description, imageUrl, onEnroll }: CourseCardProps) {
  return (
    <div className="border rounded-lg p-4">
      <img src={imageUrl} alt={title} className="w-full h-48 object-cover" />
      <h3 className="text-xl font-bold mt-2">{title}</h3>
      <p className="text-gray-600 mt-1">{description}</p>
      <Button label="Enroll" onClick={onEnroll} />
    </div>
  );
}
```

#### 3. Organisms (Complex components)
```tsx
// components/organisms/CourseCatalog.tsx
'use client';

export default function CourseCatalog({ courses }: { courses: Course[] }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  
  const filteredCourses = courses
    .filter(c => filter === 'all' || c.category === filter)
    .filter(c => c.title.toLowerCase().includes(search.toLowerCase()));
  
  return (
    <div>
      <SearchBar value={search} onChange={setSearch} />
      <FilterButtons active={filter} onChange={setFilter} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredCourses.map(course => (
          <CourseCard key={course.id} {...course} onEnroll={() => handleEnroll(course.id)} />
        ))}
      </div>
    </div>
  );
}
```

---

## State Management

### Zustand Stores

We use **Zustand** for global state (lightweight alternative to Redux).

**Example: Auth Store**
```tsx
// stores/useAuthStore.ts
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  
  login: async (email, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    set({ user: data.user, token: data.token });
  },
  
  logout: () => set({ user: null, token: null }),
}));
```

**Usage in Components**:
```tsx
'use client';
import { useAuthStore } from '@/stores/useAuthStore';

export default function LoginButton() {
  const { login, user } = useAuthStore();
  
  if (user) return <p>Welcome, {user.name}</p>;
  
  return <button onClick={() => login('test@example.com', 'password')}>Login</button>;
}
```

---

## Internationalization (i18n)

### Setup (next-intl)

**1. Translation Files**
```json
// i18n/locales/vi.json
{
  "home": {
    "title": "Chào mừng đến V-EdFinance",
    "subtitle": "Học tài chính thông minh"
  },
  "courses": {
    "enroll": "Đăng ký ngay"
  }
}

// i18n/locales/en.json
{
  "home": {
    "title": "Welcome to V-EdFinance",
    "subtitle": "Learn smart finance"
  },
  "courses": {
    "enroll": "Enroll Now"
  }
}
```

**2. Usage in Components**
```tsx
import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('home');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('subtitle')}</p>
    </div>
  );
}
```

**3. Locale Routing**
```tsx
// app/[locale]/layout.tsx
export default function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
```

---

## Styling System

### Tailwind CSS + shadcn/ui

**1. Tailwind Utilities**
```tsx
<button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">
  Click me
</button>
```

**2. shadcn/ui Components**
```tsx
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

<Dialog>
  <DialogContent>
    <DialogTitle>Confirm Action</DialogTitle>
    <Button>OK</Button>
  </DialogContent>
</Dialog>
```

**3. Class Name Merging**
```tsx
import { cn } from '@/lib/utils';

<div className={cn(
  'base-class',
  isActive && 'active-class',
  isDisabled && 'disabled-class'
)} />
```

**4. Design Tokens**
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#10b981',    // Green (growth)
        secondary: '#3b82f6',  // Blue (trust)
        danger: '#ef4444',     // Red (alerts)
      },
    },
  },
};
```

---

## Performance Optimizations

### 1. Image Optimization
```tsx
import Image from 'next/image';

<Image
  src="/courses/finance-101.jpg"
  alt="Finance 101"
  width={400}
  height={300}
  priority // For above-fold images
/>
```

### 2. Code Splitting (Dynamic Imports)
```tsx
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <Skeleton />,
  ssr: false, // Disable SSR for client-only components
});
```

### 3. Route Prefetching
```tsx
import Link from 'next/link';

<Link href="/courses/123" prefetch={true}>
  View Course
</Link>
```

### 4. React Suspense
```tsx
import { Suspense } from 'react';

<Suspense fallback={<Spinner />}>
  <AsyncComponent />
</Suspense>
```

### 5. Memoization
```tsx
import { useMemo } from 'react';

const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);
```

---

## Data Fetching Patterns

### Server Component (Recommended)
```tsx
// Fetch on server, no client JS
export default async function CoursePage({ params }: { params: { id: string } }) {
  const course = await fetch(`http://api:3001/api/courses/${params.id}`).then(r => r.json());
  
  return <CourseDetail course={course} />;
}
```

### Client Component (Interactive)
```tsx
'use client';
import { useEffect, useState } from 'react';

export default function LiveLeaderboard() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    fetch('/api/leaderboards/global')
      .then(r => r.json())
      .then(setData);
  }, []);
  
  return <LeaderboardTable data={data} />;
}
```

---

## Testing

### Unit Tests (Jest)
```tsx
import { render, screen } from '@testing-library/react';
import Button from '@/components/atoms/Button';

test('renders button with label', () => {
  render(<Button label="Click me" onClick={() => {}} />);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

### E2E Tests (Playwright)
```ts
import { test, expect } from '@playwright/test';

test('user can enroll in course', async ({ page }) => {
  await page.goto('/vi/courses/123');
  await page.click('text=Đăng ký ngay');
  await expect(page).toHaveURL('/vi/courses/123/enrolled');
});
```

---

## Related Documentation

- [Backend Architecture](backend.md)
- [Database Schema](database.md)
- [Deployment Guide](deployment.md)
- [AGENTS.md (Code Style)](../../AGENTS.md)

---

**Last Updated**: 2026-01-05  
**Maintained by**: V-EdFinance Team
