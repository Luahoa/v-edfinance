# AGENTS.md

## Project Overview

**V-EdFinance** is an edtech platform for financial education and management.

- **Stack**: Next.js 15.1.2, React 18.3.1, NestJS, Prisma, PostgreSQL
- **Architecture**: Turborepo monorepo
- **i18n**: next-intl with `vi` (default), `en`, `zh`
- **Deployment**: Cloudflare Pages (frontend) + Dokploy VPS (backend)

---

## Frequently Used Commands

### Development
```bash
pnpm dev                    # Start all apps in dev mode
START_DEV.bat              # Windows script to start dev servers
```

### Build & Type Checking
```bash
pnpm --filter web build    # Build frontend
pnpm --filter api build    # Build backend
pnpm --filter web lint     # Lint frontend code
pnpm --filter web type-check  # TypeScript type checking (if available)
```

### Monitoring & Observability
```bash
docker-compose -f docker-compose.monitoring.yml up -d  # Start Grafana/Prometheus
# Access: Grafana (3001), Prometheus (9090)
```

### Database
```bash
npx prisma migrate dev     # Run Prisma migrations
npx prisma generate        # Generate Prisma client
npx prisma studio          # Open Prisma Studio
```

### Testing
```bash
pnpm test                  # Run all tests
pnpm --filter web test     # Run frontend tests
pnpm --filter api test     # Run backend tests
```

---

## Code Style Preferences

### TypeScript
- **Strict mode enabled** - no compromises
- **No `any` types** - use proper typing or `unknown`
- **Prefer `interface` over `type`** for object shapes
- Use explicit return types for functions

### React/Next.js
- **Functional components only** - no class components
- **Server Components by default** - use `'use client'` only when needed
- **Atomic Design pattern**: `atoms/`, `molecules/`, `organisms/`
- Props interfaces named with `Props` suffix (e.g., `ButtonProps`)

### State Management
- **Zustand** for global state
- React hooks for local state
- Server state via React Query (if applicable)

### Naming Conventions
- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Files**: kebab-case for utilities (e.g., `format-date.ts`)
- **Variables/Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE

---

## Project Structure

```
v-edfinance/
├── apps/
│   ├── web/          # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── lib/
│   │   │   └── i18n/
│   ├── api/          # NestJS backend
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── debug/    # 🛠️ DEBUG & DIAGNOSTIC SYSTEM (Sandbox)
│   │   │   ├── prisma/
│   │   │   └── common/
├── packages/         # Shared packages (if any)
└── prisma/          # Database schema
```

### Key Directories
- **`apps/web/src/app/`**: Next.js App Router pages
- **`apps/web/src/components/`**: Reusable React components
- **`apps/api/src/modules/`**: NestJS feature modules
- **`prisma/`**: Database schema and migrations

---

## i18n Guidelines

### Translation Files
- Location: `apps/web/src/i18n/locales/{locale}.json`
- Supported locales: `vi` (default), `en`, `zh`
- **Always add translations to all three locale files**

### Usage Pattern
```tsx
import { useTranslations } from 'next-intl';

const t = useTranslations('namespace');
return <h1>{t('key')}</h1>;
```

### Database Localization
- Use **JSONB fields** for localized content
- Structure: `{ "vi": "...", "en": "...", "zh": "..." }`

---

## Quality Checklist

Before completing any task, ensure:

### Type Safety
- [ ] No `any` types used
- [ ] All function signatures have explicit types
- [ ] Prisma schema types match TypeScript interfaces

### Code Quality
- [ ] Lint passes: `pnpm --filter web lint`
- [ ] Build succeeds: `pnpm --filter web build`
- [ ] No TypeScript errors
- [ ] Follow Atomic Design structure

### Internationalization
- [ ] Translations added to `en.json`, `vi.json`, `zh.json`
- [ ] No hardcoded UI strings
- [ ] JSONB used for database localized fields

### Testing
- [ ] Unit tests for services/utilities
- [ ] Integration tests for API endpoints
- [ ] Test critical user flows

### Security
- [ ] No secrets in code
- [ ] Input validation implemented
- [ ] Proper authentication/authorization checks

---

## Special Notes

- **Reference**: See `SPEC.md` Section 10 for complete quality standards
- **Prisma**: Always run migrations after schema changes
- **Deployment**: Frontend auto-deploys to Cloudflare Pages on push to main
- **Database**: PostgreSQL connection details in `.env`
- **New Thread Protocol**: When starting a new session, ask the agent to: "Read `AGENTS.md` to activate **Behavioral & AI Engineering** skills and follow the specific Phase goals using **Nudge** & **Hooked** theories."

---

## Anti-Hallucination Protocol (Agent-to-Main)

Since this project is 100% Agent-coded, follow these rules to prevent "Hallucinations":

### 1. Verification Before Implementation
- **Always** `Read` the target file and its imports before editing.
- **Always** check `prisma/schema.prisma` before assuming any database field exists.
- **Never** call a service method without verifying its signature in the source file.

### 2. JSONB Schema Enforcement
- All JSONB writes must pass through the `ValidationService`.
- New JSONB structures must be registered in `SchemaRegistry`.

### 3. Pre-Commit Integrity Check
- Run `pnpm --filter api build` before finishing any task.
- Trigger `GET /api/debug/diagnostics/verify-integrity` to ensure no schema drift.

### 4. Grounding Citations
- Cite file paths and line numbers for every significant logic change.
- Use the `finder` tool to check for existing patterns before creating new ones.

---

### 1. Nudge Orchestration (Richard Thaler)
- **Engine Design**: Centralized service to calculate and deliver psychological triggers.
- **Key Tactics**:
  - *Social Proof*: "X% of users like you chose this."
  - *Loss Aversion*: "Don't lose your X-day streak."
  - *Framing*: Present choices as gains rather than losses.
  - *Mapping*: Convert abstract numbers into real-world value (e.g., $ = Coffee).

### 2. Hooked Loop Implementation (Nir Eyal)
- **Trigger**: External (Notifications/Nudges) and Internal (Curiosity/Achievement).
- **Action**: Simplify the most important user action (Single-click decisions).
- **Variable Reward**: Use AI to generate unpredictable story outcomes or rewards.
- **Investment**: Ask users to put in effort (Locking funds/Building a persona) to increase "stickiness".

### 3. AI-Powered Behavioral Analytics
- **Persona Modeling**: Analyzing `BehaviorLog` to identify psychological profiles.
- **Adaptive Difficulty**: Dynamically adjusting content complexity based on user success rate (Flow State).
- **Predictive Scenarios**: Using LLMs to simulate long-term consequences of short-term decisions.
- **Market Simulation**: High-scale localized traffic simulation (VI/EN/ZH) to verify sharding integrity.

### 4. Full System Audit & Zero-Debt Engineering
- **Context Guarding**: Implementation of automatic chat summarization and token-aware history slicing to prevent AI drift and cost spikes.
- **JSONB Schema Enforcement**: Using DTOs/Zod to validate multi-lingual and metadata fields, ensuring DB integrity.
- **Log Lifecycle Management**: Automated aggregation (Cron) and archiving logic to maintain DB performance at scale.
- **Centralized I18n**: Decoupling translations from business logic into a dedicated `I18nService` for consistent multi-market delivery.
- **WebSocket Resilience**: Using room-based broadcasting and ghost-connection cleanup to ensure stable social features.
- **Observability Sharding**: Separate monitoring stack for high-scale metrics (Prometheus/Grafana) to avoid interference with core API performance.

### 5. Maintenance & Debugging Hub (Senior Architect Protocols)
- **Error Reference ID**: Every error (UI or API) generates a unique `ErrorId` (e.g., `ERR-XXXX` or `UI-XXXX`). Users report this ID to find exact logs instantly.
- **Health Hub (Every Hour)**: A Cron task checks DB status, user metrics, and abnormal error rates. It logs a heartbeat to `BehaviorLog`.
- **Structured Exception Filter**: Centralized backend filter catches all errors, logs the stack trace with the `ErrorId`, and provides user-friendly suggestions.
- **Graceful UI Recovery**: `GlobalErrorBoundary` catches React crashes, displays the `ErrorId`, and allows a single-click state reset.

---
