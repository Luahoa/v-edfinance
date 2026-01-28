# Architecture Decision Records (ADR)

**Project:** V-EdFinance  
**Last Updated:** January 2026  
**Purpose:** Document key architectural decisions and their rationale for future reference.

---

## Current Stack (Better-T-Stack - January 2026)

| Layer | Technology | Notes |
|-------|------------|-------|
| **Frontend** | Next.js 15.1.2 + React 18.3.1 | App Router, Server Components |
| **Backend** | Hono + tRPC + Drizzle | Cloudflare Workers |
| **Auth** | better-auth | Google OAuth, sessions |
| **Database** | PostgreSQL (Neon) | Serverless, Drizzle ORM |
| **State** | Zustand + TanStack Query | Client state + server cache |
| **Deploy** | Cloudflare Pages + Workers | Edge-first |
| **Testing** | Vitest (server) + Playwright (e2e) | 60+ tRPC router tests |
| **CI/CD** | GitHub Actions | Wrangler deploy |

### Legacy Stack (Deprecated)
The following was used pre-January 2026 and is being phased out:
- NestJS backend (`apps/api/`) → migrated to Hono (`apps/server/`)
- Prisma ORM → migrated to Drizzle
- Dokploy VPS → migrated to Cloudflare Workers

---

## ADR-001: Next.js 15.1.2 + React 18.3.1 (Not Next.js 16)

**Date:** December 2025  
**Status:** ✅ Accepted  
**Decision Makers:** Technical Team

### Context
Next.js 16 was released with React 19 support, but caused critical issues in production:
- `next-intl` 3.26.3 was built for Next.js 15, causing incompatibility
- Missing root layout caused silent build failures (empty route manifests)
- Async params syntax changes broke existing code
- Unstable ecosystem (many libraries not yet compatible with React 19)

### Decision
**Stick with Next.js 15.1.2 + React 18.3.1** until the ecosystem stabilizes.

### Consequences
**Positive:**
- Proven stability with `next-intl` 3.26.3
- Mature ecosystem with extensive library support
- Predictable behavior, fewer edge cases
- Production-ready deployment confidence

**Negative:**
- Miss out on React 19 features (e.g., Server Actions improvements)
- Will need future migration when upgrading

### Migration Path
When upgrading to Next.js 16+ in the future:
1. Wait for `next-intl` official Next.js 16 support
2. Update all async params syntax (`Promise<{params}>`)
3. Ensure root layout exists
4. Test thoroughly with `pnpm build` verification

---

## ADR-002: Turborepo Monorepo Architecture

**Date:** December 2025 (Updated January 2026)  
**Status:** ✅ Accepted

### Context
Need to manage frontend (Next.js) and backend (Hono) in a single repository with shared code.

### Decision
Use **Turborepo** for monorepo management with pnpm workspaces.

### Structure
```
apps/
  web/       # Next.js frontend (port 3000)
  server/    # Hono + tRPC backend (Cloudflare Workers)
  api/       # [DEPRECATED] NestJS backend
packages/
  ui/        # Shared React components (future)
  types/     # Shared TypeScript types (future)
```

### Rationale
- **Fast builds** with intelligent caching
- **Simple configuration** compared to Nx
- **Native pnpm support** for fast installs
- **Scalable** - can add more apps/packages easily

### Alternatives Considered
- **Nx:** More features but steeper learning curve
- **Lerna:** Less active development, slower builds
- **Separate repos:** Code duplication, harder to sync

---

## ADR-003: JSONB for Localized Content

**Date:** December 2025  
**Status:** ✅ Accepted

### Context
Need to support 3 languages (Vietnamese, English, Chinese) for course content.

### Decision
Use **PostgreSQL JSONB columns** for localized fields instead of separate translation tables.

### Schema Pattern
```prisma
model Course {
  title       Json  // { "vi": "...", "en": "...", "zh": "..." }
  description Json
}
```

### Rationale
**Pros:**
- Simpler queries (no JOINs)
- Atomic updates (all translations in one row)
- Flexible (easy to add new locales)
- Better performance for read-heavy workloads

**Cons:**
- Harder to query by specific language
- More complex validation logic
- Larger row sizes

### Alternatives Considered
- **Separate `translations` table:** More normalized but complex queries
- **Separate columns per locale:** Not scalable, schema changes for new languages
- **Separate tables per locale:** Difficult to maintain consistency

### Implementation Notes
```typescript
// Accessing localized content
const title = course.title[locale] || course.title['vi']; // Fallback to default

// Creating localized content
await prisma.course.create({
  data: {
    title: {
      vi: "Tài chính cơ bản",
      en: "Finance 101",
      zh: "金融基础"
    }
  }
});
```

---

## ADR-004: Cloudflare Pages + Workers Deployment

**Date:** December 2025 (Updated January 2026)  
**Status:** ✅ Accepted (Supersedes Dokploy VPS)

### Context
Need cost-effective, scalable deployment for global audience (Vietnam, China, International).

### Decision
**Frontend:** Cloudflare Pages (edge deployment)  
**Backend:** Cloudflare Workers (serverless edge)  
**Database:** Neon PostgreSQL (serverless)

### Architecture
```
User → Cloudflare Pages (Next.js SSR)
     → Cloudflare Workers (Hono + tRPC) → Neon PostgreSQL
```

### Rationale
**Cloudflare Pages:**
- Global CDN with edge locations in Asia
- Free tier generous for MVP
- Automatic HTTPS + DDoS protection
- Near-instant deployments

**Cloudflare Workers:**
- Zero cold starts (runs at edge)
- Cost-effective (pay-per-request)
- Native Hono support
- Wrangler CLI for easy deployments

**Neon PostgreSQL:**
- Serverless (scales to zero)
- Branching for dev/staging
- Compatible with Drizzle ORM

### Previous Approach (Deprecated)
- Dokploy VPS with Docker → replaced by Cloudflare Workers
- Cloudflare Tunnel → no longer needed (Workers are edge-native)

### Alternatives Considered
- **Vercel:** More expensive for high traffic
- **AWS/GCP:** Overkill for MVP, complex billing
- **Heroku:** Deprecated free tier, expensive scaling

---

## ADR-005: Zustand for State Management

**Date:** December 2025  
**Status:** ✅ Accepted

### Context
Need lightweight state management for user authentication, course progress, and UI state.

### Decision
Use **Zustand** instead of Redux or Context API.

### Rationale
- **Minimal boilerplate** (20 lines vs 200 for Redux)
- **TypeScript-first** design
- **No providers** needed (unlike Context)
- **Devtools support** for debugging
- **Small bundle size** (~1KB)

### Example Usage
```typescript
// stores/authStore.ts
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
}));
```

### Alternatives Considered
- **Redux Toolkit:** Overkill for edtech app size
- **Context API:** Re-render issues, verbose
- **Jotai/Recoil:** Atomic state not needed here

---

## ADR-006: Drizzle ORM (Supersedes Prisma)

**Date:** January 2026  
**Status:** ✅ Accepted (Supersedes ADR-006 Prisma)

### Context
Migrating from NestJS to Hono on Cloudflare Workers requires edge-compatible ORM.

### Decision
Use **Drizzle ORM** instead of Prisma.

### Rationale
- **Edge-compatible:** Works with Cloudflare Workers (Prisma doesn't)
- **Type-safe:** Full TypeScript inference from schema
- **SQL-like:** Familiar syntax, no query abstraction overhead
- **Lightweight:** No heavy client generation
- **Neon support:** Native `@neondatabase/serverless` driver

### Migration Notes
```typescript
// Drizzle schema (apps/server/src/lib/db/schema.ts)
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Query example
const user = await db.select().from(users).where(eq(users.id, id));
```

### Prisma (Deprecated)
Prisma is still used in `apps/api/` (legacy NestJS) but not recommended for new development.

---

## ADR-007: Atomic Design Component Structure

**Date:** December 2025  
**Status:** ✅ Accepted

### Context
Need scalable, reusable component organization for growing frontend.

### Decision
Adopt **Atomic Design** methodology.

### Structure
```
components/
  atoms/       # Button, Input, Icon
  molecules/   # SearchBar, Card, FormField
  organisms/   # Navbar, CourseCard, LessonPlayer
  templates/   # PageLayout, DashboardLayout
```

### Rationale
- Clear hierarchy and responsibility
- Easy to find components
- Promotes reusability
- Industry standard pattern

---

## ADR-008: Google Gemini for AI Features

**Date:** December 2025  
**Status:** ✅ Accepted

### Context
Need AI for personalized learning, content generation, and Q&A.

### Decision
Use **Google Gemini 1.5 Pro** API.

### Rationale
- **Multimodal:** Text, images, video (future features)
- **Large context window:** 1M tokens (can process full courses)
- **Multilingual:** Native Vietnamese/Chinese support
- **Cost-effective:** Better pricing than GPT-4
- **JSON mode:** Structured outputs for quizzes, etc.

### Alternatives Considered
- **OpenAI GPT-4:** More expensive, weaker multilingual
- **Claude:** Not available in Vietnam
- **Open-source LLMs:** Require hosting, less capable

---

## ADR-009: tRPC for Type-Safe API

**Date:** January 2026  
**Status:** ✅ Accepted

### Context
Need end-to-end type safety between Next.js frontend and Hono backend.

### Decision
Use **tRPC v11** with `@trpc/server` and `@trpc/react-query`.

### Rationale
- **End-to-end types:** No code generation, instant type inference
- **React Query integration:** Built-in caching, refetching, optimistic updates
- **Hono adapter:** Native `@hono/trpc-server` integration
- **Procedures:** Query, mutation, subscription patterns
- **Superjson:** Date/BigInt serialization out of the box

### Router Structure
```typescript
// apps/server/src/trpc/routers/
├── user.router.ts      # User CRUD, profile
├── course.router.ts    # Course listing, enrollment
├── quiz.router.ts      # Quiz attempts, scoring
├── analytics.router.ts # Progress tracking
└── gamification.router.ts # Points, achievements
```

### Client Usage
```typescript
// apps/web - auto-complete from server types
const { data } = trpc.user.getProfile.useQuery();
const mutation = trpc.course.enroll.useMutation();
```

---

## ADR-010: better-auth for Authentication

**Date:** January 2026  
**Status:** ✅ Accepted

### Context
Need simple, secure authentication with social login support.

### Decision
Use **better-auth** library with Google OAuth.

### Rationale
- **Simple setup:** Minimal configuration vs NextAuth
- **Session-based:** Secure cookies, no JWT complexity
- **Social providers:** Google, GitHub, etc.
- **Drizzle adapter:** Native database integration
- **Edge-compatible:** Works with Cloudflare Workers

### Flow
```
User → Google OAuth → better-auth → Session cookie → Protected routes
```

### Implementation
```typescript
// apps/server/src/lib/auth.ts
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
});
```

---

## ADR-011: Vitest for Server Testing

**Date:** January 2026  
**Status:** ✅ Accepted

### Context
Need fast, modern testing framework for Hono + tRPC backend.

### Decision
Use **Vitest** with `@vitest/coverage-v8`.

### Rationale
- **Fast:** Native ESM, no transpilation
- **Compatible:** Jest-compatible API
- **TypeScript:** First-class support
- **Coverage:** Built-in V8 coverage
- **Watch mode:** Instant feedback

### Test Structure
```
apps/server/src/trpc/__tests__/
├── test-helpers.ts     # Shared utilities, mocks
├── user.router.test.ts
├── course.router.test.ts
├── quiz.router.test.ts
├── analytics.router.test.ts
└── gamification.router.test.ts
```

### Commands
```bash
pnpm --filter @v-edfinance/server test        # Watch mode
pnpm --filter @v-edfinance/server test:run    # Single run
pnpm --filter @v-edfinance/server test:coverage
```

---

## Future ADRs to Document

- [x] ~~ADR-009: Testing Strategy~~ → Documented above
- [x] ~~ADR-010: Authentication~~ → Documented above
- [ ] ADR-012: File Storage (Cloudflare R2)
- [ ] ADR-013: Real-time Features (WebSockets vs SSE)
- [ ] ADR-014: Analytics Platform (Mixpanel vs PostHog)
- [ ] ADR-015: E2E Testing (Playwright)

---

## How to Use This Document

1. **Before making major decisions:** Review existing ADRs
2. **When proposing changes:** Write a new ADR
3. **Update status:** Mark as `Accepted`, `Rejected`, or `Superseded`
4. **Reference in code:** Link to ADRs in comments for complex decisions

**Template for New ADRs:**
```markdown
## ADR-XXX: Title

**Date:** YYYY-MM
**Status:** 🔄 Proposed / ✅ Accepted / ❌ Rejected

### Context
[Why this decision is needed]

### Decision
[What was decided]

### Rationale
[Why this approach was chosen]

### Consequences
**Positive:** [Benefits]
**Negative:** [Tradeoffs]

### Alternatives Considered
[Other options evaluated]
```
