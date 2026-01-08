---
title: "Codebase Summary"
description: "High-level overview of the V-EdFinance codebase structure"
category: "architecture"
lastUpdated: 2026-01-09
version: "1.0.0"
---

# V-EdFinance Codebase Summary

> **Platform:** EdTech for Financial Education  
> **Stack:** Next.js 15 + NestJS + Prisma + PostgreSQL  
> **Architecture:** Turborepo Monorepo

## Repository Structure

```
v-edfinance/
├── apps/
│   ├── web/                    # Next.js 15 Frontend
│   │   ├── src/
│   │   │   ├── app/           # App Router pages
│   │   │   ├── components/    # Atomic Design (atoms/molecules/organisms)
│   │   │   ├── lib/           # Utilities, hooks, stores
│   │   │   └── i18n/          # Internationalization (vi/en/zh)
│   │   └── Dockerfile         # Production Docker image
│   │
│   └── api/                    # NestJS Backend
│       ├── src/
│       │   ├── modules/       # Feature modules
│       │   │   ├── auth/      # JWT authentication
│       │   │   ├── user/      # User management
│       │   │   ├── course/    # Course content
│       │   │   ├── video/     # Video processing
│       │   │   ├── payment/   # Stripe integration
│       │   │   ├── gamification/ # Points, badges, streaks
│       │   │   └── debug/     # Diagnostics sandbox
│       │   ├── prisma/        # Database service
│       │   └── common/        # Shared utilities
│       └── Dockerfile         # Production Docker image
│
├── docker/
│   └── nginx/                  # Reverse proxy configuration
│
├── prisma/
│   └── schema.prisma          # Database schema
│
├── scripts/
│   ├── vps-toolkit/           # VPS automation (SSH, deploy)
│   └── quality-gate*.bat      # Build verification scripts
│
├── docs/                       # Documentation
├── .agents/                    # AI agent skills
├── .beads/                     # Task tracking (beads)
└── history/                    # Epic execution history
```

## Key Technologies

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 15, React 18 | SSR, App Router |
| UI | shadcn/ui, Tailwind CSS | Design system |
| State | Zustand | Global state management |
| i18n | next-intl | Vietnamese, English, Chinese |
| Backend | NestJS | REST API, WebSockets |
| ORM | Prisma | Database access |
| Database | PostgreSQL 16 | Data persistence |
| Auth | JWT | Token-based authentication |
| Payments | Stripe | Payment processing |
| Video | FFmpeg, HLS | Video compression/streaming |
| Deployment | Docker, Dokploy | Container orchestration |
| CDN | Cloudflare R2 | Asset storage |

## Core Modules

### Frontend Components (Atomic Design)

| Type | Location | Examples |
|------|----------|----------|
| Atoms | `components/atoms/` | Button, Input, Badge |
| Molecules | `components/molecules/` | VideoPlayer, SearchBar |
| Organisms | `components/organisms/` | CourseCard, UserDashboard |
| UI | `components/ui/` | shadcn/ui components |

### Backend Modules

| Module | Purpose | Key Files |
|--------|---------|-----------|
| `auth` | JWT login/register | `auth.service.ts`, `jwt.strategy.ts` |
| `user` | User CRUD, profiles | `user.service.ts` |
| `course` | Course management | `course.service.ts` |
| `video` | Video processing | `video-compression.service.ts` |
| `payment` | Stripe webhooks | `payment.service.ts` |
| `gamification` | Points, badges | `gamification.service.ts` |
| `behavior` | User analytics | `behavior-log.service.ts` |

## Database Schema Highlights

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  profile       Json     // JSONB for localized content
  behaviorLogs  BehaviorLog[]
  enrollments   Enrollment[]
}

model Course {
  id            String   @id @default(cuid())
  title         Json     // { vi: "...", en: "...", zh: "..." }
  lessons       Lesson[]
  enrollments   Enrollment[]
}

model BehaviorLog {
  id            String   @id @default(cuid())
  userId        String
  eventType     String
  metadata      Json     // JSONB for flexible event data
  createdAt     DateTime @default(now())
}
```

## Behavioral Design Patterns

V-EdFinance implements psychological engagement patterns:

| Pattern | Implementation | Reference |
|---------|---------------|-----------|
| **Nudge** | NudgeService - social proof, loss aversion | [nudge-theory.md](behavioral-design/nudge-theory.md) |
| **Hooked** | Trigger → Action → Reward → Investment | [hooked-model.md](behavioral-design/hooked-model.md) |
| **Gamification** | Points, badges, streaks, leaderboards | [gamification.md](behavioral-design/gamification.md) |

## Development Workflow

### Quick Start
```bash
pnpm install
pnpm dev              # Start all apps
```

### Build & Verify
```bash
pnpm --filter web build
pnpm --filter api build
pnpm --filter web lint
```

### Database
```bash
npx prisma migrate dev
npx prisma generate
npx prisma studio
```

## Agent Tooling

The codebase uses AI agents for automation:

| Tool | Purpose |
|------|---------|
| `bd` (beads CLI) | Task management |
| `bv` (beads viewer) | Dependency graphs |
| Ralph CLI | Epic automation |
| VPS Toolkit | Deployment automation |

See [AGENTS.md](../AGENTS.md) for full agent instructions.

## Key Patterns

1. **Anti-Hallucination Protocol**: Always verify before implementing
2. **JSONB Schema Enforcement**: All JSONB through ValidationService
3. **Accessibility First**: WCAG AA compliance required
4. **i18n Complete**: All strings in 3 locales
5. **Server Components Default**: `'use client'` only when needed
