# Discovery Report: Phase 1 MVP Features
**Feature:** Phase 1 MVP Launch - Quiz, Certificate, Payment, Enrollment  
**Generated:** 2026-01-04  
**Method:** Codebase analysis + Schema review

---

## Architecture Snapshot

### Relevant Packages
- **Frontend:** `apps/web` - Next.js 15.1.2 + React 18.3.1
- **Backend:** `apps/api` - NestJS + Prisma + Triple-ORM (Prisma/Drizzle/Kysely)
- **Database:** PostgreSQL 16 (via Prisma schema)
- **Storage:** Cloudflare R2 (videos, certificates, assets)
- **Payments:** Stripe (to be integrated)
- **AI:** Google Gemini (existing chat mentor)

### Key Modules
```
apps/api/src/modules/
├── auth/          ✅ Exists (JWT + refresh tokens)
├── users/         ✅ Exists (STUDENT, TEACHER, ADMIN roles)
├── courses/       ✅ Exists (Course + Lesson CRUD)
├── chat/          ✅ Exists (AI mentor via Gemini)
├── behavior/      ✅ Exists (BehaviorLog tracking)
├── quiz/          ❌ NEW - Needs creation
├── certificate/   ❌ NEW - Needs creation
├── payment/       ❌ NEW - Needs creation (Stripe)
├── enrollment/    ❌ NEW - Needs creation
└── teacher/       🔄 Partial - Needs roster/progress endpoints
```

### Entry Points
- **Frontend Routes:** `apps/web/src/app/[locale]/` (vi/en/zh)
- **API Base:** `http://localhost:3001/api/` (development)
- **Staging API:** `http://103.54.153.248:3001/` (VPS)

---

## Existing Patterns

### Similar Implementations

#### 1. Lesson Builder → Can Be Reused for Quiz Builder
**Location:** `apps/api/src/modules/courses/` (assumed)  
**Pattern:** 
- CRUD endpoints for creating/editing structured content
- JSONB fields for localized content (`{ "vi": "...", "en": "...", "zh": "..." }`)
- Order/sequence management (`order: Int`)

**Reusable for:** Quiz question ordering, multi-language quiz content

#### 2. BehaviorLog Analytics → Can Be Reused for Progress Monitoring
**Location:** `apps/api/src/modules/behavior/` + Kysely service  
**Pattern:**
- Complex aggregation queries via Kysely (analytics)
- Dashboard charts (Chart.js on frontend)
- Date range filters

**Reusable for:** Student progress dashboards, engagement analytics

#### 3. ChatThread Management → Pattern for Quiz Session State
**Location:** Schema shows `ChatThread` + `ChatMessage` models  
**Pattern:**
- Thread-based state management
- Sequential message/item storage
- User-scoped data

**Reusable for:** Quiz attempts (QuizAttempt model), question-answer pairs

#### 4. UserAchievement System → Pattern for Certificate Awards
**Location:** `UserAchievement` model in schema  
**Pattern:**
- Award-based tracking (`awardedAt` timestamp)
- JSONB for localized name/description
- Asset storage keys (`iconKey`)

**Reusable for:** Certificate awards, PDF storage keys

---

## Technical Constraints

### Runtime Environment
- **Node.js:** v20.x LTS (specified in AGENTS.md)
- **Package Manager:** pnpm (workspace monorepo)
- **TypeScript:** Strict mode enabled

### Key Dependencies (Existing)
```json
{
  "next": "15.1.2",
  "@nestjs/common": "^10.0.0",
  "prisma": "^5.0.0",
  "zustand": "^5.0.2",
  "next-intl": "3.26.3"
}
```

### Build Requirements
- **Frontend:** `pnpm --filter web build` (must pass before deploy)
- **Backend:** `pnpm --filter api build` (must pass before deploy)
- **Tests:** `pnpm test` (Vitest for unit, Playwright for E2E)
- **Linting:** `pnpm --filter web lint` (ESLint)

### Database Constraints
- **ORM Strategy:** 
  - Prisma: Schema migrations ONLY (source of truth)
  - Drizzle: Fast CRUD operations (65% faster reads)
  - Kysely: Complex analytics queries
- **Migration Command:** `npx prisma migrate dev --name <name>`
- **DO NOT:** Run Drizzle migrations (Prisma owns schema)

---

## External References

### Payment Integration (Stripe)
**Relevant Docs:**
- Stripe Node.js SDK: https://stripe.com/docs/api/node
- Webhook Handler: https://stripe.com/docs/webhooks
- Checkout Session: https://stripe.com/docs/api/checkout/sessions

**Key Learnings from Research:**
- **Webhook Security:** Must verify signature using `stripe.webhooks.constructEvent()`
- **Raw Body Required:** Express middleware must preserve raw body for signature verification
- **Events to Handle:** `checkout.session.completed`, `invoice.paid`, `customer.subscription.updated`
- **Test Mode:** Use test API keys for development (`sk_test_...`)

### PDF Generation Libraries
**Options Researched:**
1. **PDFKit** (Node.js native)
   - Pros: Fast, low memory, no headless browser
   - Cons: Limited styling (no CSS), manual positioning
   - Best for: Simple certificate templates with fixed layouts

2. **Puppeteer** (Headless Chrome)
   - Pros: Full HTML/CSS support, exact rendering
   - Cons: High memory (100MB+ per PDF), slower
   - Best for: Complex layouts, web-to-PDF conversions

3. **jsPDF** (Client-side + Node)
   - Pros: Lightweight, works in browser
   - Cons: Limited features, manual drawing API
   - Best for: Simple browser-based PDFs

**Recommendation:** Use **PDFKit** for performance (certificates are simple templates). Spike will validate memory usage.

### Quiz/Assessment Libraries
**Options Researched:**
1. **react-quiz-component** (React library)
   - Pros: Ready-made UI, multiple question types
   - Cons: Limited customization, not i18n-friendly

2. **Custom Implementation**
   - Pros: Full control, i18n support, matches design system
   - Cons: More development time

**Recommendation:** Custom implementation using existing patterns (follows Atomic Design, reuses components). Spike will test state management approach.

---

## Naming Conventions (Existing Patterns)

### Components (Frontend)
- **PascalCase:** `UserProfile.tsx`, `LessonCard.tsx`
- **Props Interface:** `<ComponentName>Props` (e.g., `ButtonProps`)
- **Atomic Design:** `atoms/`, `molecules/`, `organisms/`

### API Endpoints (Backend)
- **RESTful:** `/api/courses`, `/api/courses/:id`
- **Nested Resources:** `/api/courses/:courseId/lessons`
- **Actions:** `/api/courses/:id/publish` (POST)

### Database Models (Prisma)
- **PascalCase:** `User`, `Course`, `Lesson`, `UserProgress`
- **Relations:** Singular for one-to-one, plural for one-to-many (`user`, `lessons`)
- **Enums:** UPPER_SNAKE_CASE (`BEGINNER`, `INTERMEDIATE`, `EXPERT`)

---

## Reusable Utilities

### Localization
**Location:** `apps/web/src/i18n/` (next-intl setup)  
**Usage:**
```typescript
import { useTranslations } from 'next-intl';
const t = useTranslations('namespace');
return <h1>{t('key')}</h1>;
```

**Database Pattern:**
```typescript
// Localized JSONB field
title: { vi: "Khóa học", en: "Course", zh: "课程" }
```

### Validation
**Pattern:** Zod schemas registered in `SchemaRegistry`  
**Usage:**
```typescript
const MySchema = z.object({ key: z.string() });
SchemaRegistry.register('mySchema', MySchema);
const validated = await ValidationService.validate('mySchema', data);
```

### File Upload (R2)
**Pattern:** Store file keys in database, actual files in R2  
**Example:**
```typescript
// Upload to R2
const key = `certificates/${userId}/${courseId}.pdf`;
// Store key in database
certificate.pdfKey = key;
```

---

## Architecture Diagrams (Existing)

### Current System (from SPEC.md)
```
User → Cloudflare Pages (Next.js)
     → Cloudflare Tunnel
     → Dokploy VPS (NestJS API)
     → PostgreSQL (local container OR Cloud SQL)
     → Gemini AI (chat mentor)
     → R2 Storage (videos, assets)
```

### Proposed Phase 1 Additions
```
User → [Existing Flow]
     → NEW: Stripe Checkout
     → NEW: Webhook → Enrollment
     → NEW: Quiz Engine
     → NEW: Certificate PDF Generator → R2
```

---

## Critical Findings

### 1. Schema Already Supports Extensions
✅ **User model** has `role: STUDENT | TEACHER | ADMIN`  
✅ **Course model** has `price: Int` (ready for payments)  
✅ **UserProgress model** tracks lesson completion  
❌ **Missing:** Quiz, QuizAttempt, Certificate, Transaction, Enrollment models

### 2. Multi-Language Support Already Implemented
✅ **Frontend:** next-intl with `[locale]` routing  
✅ **Database:** JSONB pattern for localized content  
✅ **AI:** Gemini responds in user's preferred language  
**Implication:** New features (Quiz, Certificate) must follow JSONB pattern

### 3. Triple-ORM Strategy in Use
✅ **Prisma:** Schema migrations (DO NOT bypass)  
✅ **Drizzle:** Fast CRUD (use for Quiz, Enrollment inserts)  
✅ **Kysely:** Analytics (use for progress monitoring aggregations)  
**Implication:** Choose correct ORM per use case (see decision matrix in AGENTS.md)

### 4. Testing Infrastructure Exists
✅ **Unit Tests:** Vitest  
✅ **E2E Tests:** Playwright + Gemini AI agent (`run-e2e-tests.ts`)  
✅ **Stress Tests:** Vegeta + E2B orchestration  
**Implication:** New features must have corresponding tests (Quality Gate requirement)

### 5. Zero-Debt Protocol Active
🔴 **Phase 0 Blockers:** 3 tasks must complete FIRST (ved-6bdg, ved-gdvp, ved-o1cw)  
⚠️ **Build Requirement:** Both `web` and `api` builds must pass before new work  
✅ **Beads Sync:** Must run `bd sync` before/after session  
**Implication:** Cannot start Phase 1 until Phase 0 complete

---

## Risk Indicators (Initial Assessment)

### HIGH Risk Features (Require Spikes)
| Feature | Risk Factor | Spike Question |
|---------|-------------|----------------|
| **Quiz System** | No existing interactive component type | "Can we build custom quiz UI with Zustand state management?" |
| **PDF Certificates** | External library + memory concerns | "Does PDFKit work with our Node version? Memory usage acceptable?" |
| **Stripe Integration** | External dependency + security | "How do we verify webhook signatures? Raw body handling?" |
| **Enrollment Atomicity** | Race conditions + data integrity | "Can Prisma transactions handle payment→enrollment atomicity?" |

### MEDIUM Risk Features
- Student Roster UI (variation of existing table patterns)
- Progress Monitoring (similar to BehaviorLog analytics)
- Quiz Builder (similar to Lesson Builder)

### LOW Risk Features
- All features marked "Implemented" in COMPREHENSIVE_FEATURE_PLAN.md
- Schema extensions (follows existing patterns)
- API endpoints (follows RESTful conventions)

---

## Blast Radius Analysis

### Quiz System
**Files Affected:** ~15 files  
- Backend: `apps/api/src/modules/quiz/**` (5 files)
- Frontend: `apps/web/src/components/quiz/**` (7 files)
- Schema: `apps/api/prisma/schema.prisma` (1 file)
- Tests: `tests/e2e/quiz/**` (2 files)

**Risk:** MEDIUM (new module, but isolated scope)

### Certificate Generation
**Files Affected:** ~12 files  
- Backend: `apps/api/src/modules/certificate/**` (4 files)
- Frontend: `apps/web/src/components/certificate/**` (3 files)
- Schema: `apps/api/prisma/schema.prisma` (1 file)
- Tests: `tests/e2e/certificate/**` (2 files)
- R2 Upload: Reuses existing utility (1 file)

**Risk:** MEDIUM (external library PDFKit)

### Payment Gateway
**Files Affected:** ~18 files  
- Backend: `apps/api/src/modules/payment/**` (6 files)
- Frontend: `apps/web/src/app/[locale]/checkout/**` (5 files)
- Schema: `apps/api/prisma/schema.prisma` (1 file)
- Tests: `tests/e2e/payment/**` (3 files)
- Env Config: `.env` (1 file)

**Risk:** HIGH (external dependency + security + webhooks)

### Enrollment Flow
**Files Affected:** ~14 files  
- Backend: `apps/api/src/modules/enrollment/**` (5 files)
- Frontend: `apps/web/src/app/[locale]/courses/**` (4 files)
- Schema: `apps/api/prisma/schema.prisma` (1 file)
- Tests: `tests/e2e/enrollment/**` (2 files)

**Risk:** MEDIUM (depends on Payment Gateway)

**Total Blast Radius:** ~59 files across 4 features  
**Risk Level:** HIGH (external integrations + cross-module dependencies)

---

## Recommended Next Steps

### 1. Complete Phase 0 (BLOCKER)
Before starting Phase 1, MUST fix:
- `ved-6bdg`: Add lucide-react to Web build
- `ved-gdvp`: Regenerate Drizzle schema from Prisma
- `ved-o1cw`: Verify all builds pass

**Estimated Time:** 50 minutes

### 2. Execute Spikes (Risk Validation)
Create spike beads for 4 HIGH-risk features:
- Quiz rendering engine (1 hour)
- PDF generation workflow (1 hour)
- Stripe SDK + webhook verification (2 hours)
- Payment→Enrollment atomicity (1 hour)

**Total Spike Time:** 5 hours

### 3. Generate Execution Plan
Use this discovery report + spike results to create:
- Detailed beads breakdown (file-beads skill)
- Track assignments (bv --robot-plan)
- Cross-track dependencies
- Agent Mail coordination protocol

**Estimated Time:** 2 hours

### 4. Spawn Workers (Orchestrator)
Launch 7 parallel agents:
- BlueLake (Quiz)
- GreenCastle (Certificate)
- RedStone (Roster)
- PurpleBear (Payment)
- OrangeRiver (Enrollment - waits for Payment)
- SilverEagle (E2E Testing)
- GoldMountain (DB Optimization - deferred)

**Total Implementation Time:** 220 agent-hours over 4 weeks

---

**Document Type:** Discovery Report (Phase 1 of Planning Pipeline)  
**Next Phase:** Synthesis (Oracle gap analysis)  
**Maintained By:** AI Agent (Amp)  
**Last Updated:** 2026-01-04
