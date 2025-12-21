# AGENTS.md

## Project Overview

**V-EdFinance** is an edtech platform for financial education and management.

- **Stack**: Next.js 15.1.2, React 18.3.1, NestJS, Prisma, PostgreSQL
- **Architecture**: Turborepo monorepo
- **i18n**: next-intl with `vi` (default), `en`, `zh`
- **Deployment**: Cloudflare Pages (frontend) + Dokploy VPS (backend)

---

## Frequently Used Commands

### Hybrid Testing (VPS + E2B)
```bash
# Start Stress Test from E2B to VPS
pnpm ts-node scripts/e2b-stress-orchestrator.ts --target http://103.54.153.248:3000

# Run E2E Tests on Staging
pnpm playwright test --config playwright.config.ts --baseUrl http://103.54.153.248:3001
```

**Môi trường Staging (VPS):**
- **Dokploy Dashboard**: [http://103.54.153.248:3000](http://103.54.153.248:3000)
- **API Staging**: [http://103.54.153.248:3001](http://103.54.153.248:3001)
- **Web Staging**: [http://103.54.153.248:3002](http://103.54.153.248:3002)

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

### Testing & Quality
```bash
pnpm test                  # Run all tests (Vitest)
pnpm --filter api test:ava # Run lightweight standalone tests (AVA)
npx bats scripts/tests/bats # Run shell script verification (Bats)
# Vegeta Stress Testing
cd scripts/tests/vegeta && run-stress-test.bat
```

### Beads Task Management (MANDATORY for All Agents)

This project uses **bd (beads)** for issue tracking with **sync-branch** for multi-agent coordination.

> ⚠️ **CRITICAL**: Dự án được xử lý bởi nhiều agents. PHẢI tuân thủ sync protocol!

**Sync-Branch Config:** `beads-sync` (đã cấu hình trong `.beads/config.yaml`)

**Quick reference:**
- `bd onboard` - First-time setup, learn beads basics
- `bd prime` - Get workflow context at session start
- `bd ready` - Find unblocked work
- `bd create "Title" --type task --priority 2` - Create issue
- `bd close <id>` - Complete work
- `bd sync` - Sync with git (run at session end)
- `bd doctor` - Health check, find orphaned issues

For full workflow details: `bd prime`

**🔴 MANDATORY Session Protocol:**
```bash
# === BẮT ĐẦU SESSION ===
git pull --rebase
.\beads.exe sync           # ← SYNC TRƯỚC KHI LÀM BẤT CỨ GÌ
.\beads.exe doctor
.\beads.exe ready

# === TRONG SESSION ===
.\beads.exe update ved-xxx --status in_progress
# ... làm việc ...
.\beads.exe close ved-xxx --reason "Done: mô tả"
.\beads.exe sync           # ← SYNC SAU MỖI TASK QUAN TRỌNG

# === KẾT THÚC SESSION ===
.\beads.exe sync           # ← MANDATORY
git add -A && git commit -m "type: description (ved-xxx)"
git push                   # ← MANDATORY - Work is NOT done until pushed
```

**Task Management Principles:**
- 📝 **All work tracked in Beads** - No TODO comments in code
- 🔄 **Sync before & after** - Luôn sync trước khi bắt đầu và sau khi kết thúc
- 🎯 **Granular tasks** - Epic (2-4 weeks) → Feature (3-7 days) → Task (4-8 hours)
- 🔗 **Link dependencies** - Use `--deps blocks:ved-XXX` or `discovered-from:ved-XXX`
- ✅ **Close with context** - Always explain what was done in `--reason`
- 🚫 **No orphan work** - Mọi thay đổi phải được tracked trong beads

**Documentation:**
- See [`BEADS_GUIDE.md`](BEADS_GUIDE.md) for CLI reference
- See [`docs/BEADS_MULTI_AGENT_PROTOCOL.md`](docs/BEADS_MULTI_AGENT_PROTOCOL.md) for comprehensive multi-agent guide

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

## 🎯 Strategic Debt Paydown Protocol (MANDATORY)

**Status:** 🔴 **ACTIVE** - Level 4 Emergency (33 build errors)  
**Authority:** See [STRATEGIC_DEBT_PAYDOWN_PLAN.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/STRATEGIC_DEBT_PAYDOWN_PLAN.md)

### Constitutional Principle
> **"No new features until builds pass. No new code until tests run. No deployment until debt is zero."**

### Current Phase: Phase 0 - Emergency Stabilization
**Goal:** Fix 33 build errors → Get builds green  
**Duration:** 4-6 hours (1 session)  
**Priority:** 🔴 P0 CRITICAL

### Mandatory Session Protocol

#### Every Session Start:
```bash
bd ready                    # Check for blockers (FIRST)
bd doctor                   # Verify system health
git pull --rebase          # Get latest changes
pnpm install               # Sync dependencies
pnpm --filter api build    # Verify build (MUST PASS before new work)
pnpm --filter web build    # Verify build (MUST PASS before new work)
```

**IF ANY FAIL:** Fix immediately before proceeding to new tasks.

#### Every Session End:
```bash
pnpm --filter api build    # Verify builds
pnpm --filter web build    # Verify builds
pnpm test                  # Run tests
bd doctor                  # Health check
bd sync                    # Sync beads to git
git add -A && git commit   # Commit changes
git push                   # Push to remote (MANDATORY)
```

**Work is NOT complete until `git push` succeeds.**

### Debt Prevention Rules

#### Rule 1: Schema Change Protocol
When modifying Prisma schema:
```bash
# MANDATORY sequence:
1. Edit apps/api/prisma/schema.prisma
2. cd apps/api && npx prisma migrate dev --name descriptive_name
3. npx prisma generate
4. pnpm --filter api build  # Must pass
5. Update DTOs/interfaces
6. pnpm test                # Must pass
7. git commit               # Only if all above pass
```

#### Rule 2: JSONB Field Protocol
When adding JSONB fields:
```typescript
// 1. Define Zod schema
const MySchema = z.object({ key: z.string() });

// 2. Register in SchemaRegistry
SchemaRegistry.register('mySchema', MySchema);

// 3. Validate before write
const validated = await ValidationService.validate('mySchema', data);

// 4. Type-safe read
const typed = data as z.infer<typeof MySchema>;
```

#### Rule 3: Build Gate Protocol
When deploying AI agents in batch:
```bash
# After EVERY 10 agents or 1 hour:
pnpm --filter api build
pnpm --filter web build

# IF FAILS: STOP all agent work, fix immediately
```

### Current Debt Status
| Category | Errors | Priority | Status |
|----------|--------|----------|--------|
| Prisma Schema Drift | 20 | P0 | 🔴 Active |
| JSONB Type Safety | 7 | P0 | 🔴 Active |
| Auth/Async Issues | 6 | P0 | 🔴 Active |
| **TOTAL** | **33** | **P0** | **🔴 BLOCKED** |

**Next Action:** Execute Task T0.1 (Fix Prisma Schema) from [STRATEGIC_DEBT_PAYDOWN_PLAN.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/STRATEGIC_DEBT_PAYDOWN_PLAN.md)

### Success Criteria
```bash
✅ 0 build errors (API + Web)
✅ 70%+ test coverage
✅ 0 P0/P1 beads blockers
✅ All quality gates green
```

**Read full strategy:** [STRATEGIC_DEBT_PAYDOWN_PLAN.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/STRATEGIC_DEBT_PAYDOWN_PLAN.md)

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

### 6. Zero-Debt Engineering Rule
- **Issue First**: Luôn kiểm tra và giải quyết các issue tồn đọng trong Beads (BD) trước khi phát triển tính năng mới.
- **Strict Testing**: Chỉ chuyển task sang trạng thái `completed` sau khi tất cả các bài kiểm tra (Unit/Integration/E2E) liên quan đã Pass.
- **No Expansion with Debt**: Không cho phép dự án phình to (feature creep) khi các lỗi cũ chưa được xử lý triệt để.

---

### 7. Zero-Debt Protocol (Agent-to-Main)
**All development must follow the "Fix First, Feature Second" rule:**
- **Issue Audit:** Check `bd ready` for pending bugs/debt.
- **Verification:** Run `bd doctor` to ensure system health.
- **Quality Gate:** Pass all tests before closing any task.
- **Persistence:** Work is NOT done until `git push` succeeds.

---

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
