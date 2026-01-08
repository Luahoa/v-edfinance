# Discovery Report: V-EdFinance Project Audit

**Generated:** 2026-01-05  
**Epic:** VED-3GAT  
**Purpose:** Comprehensive technical debt cleanup before Track 4 deployment

---

## 1. Architecture Snapshot

### 1.1 Monorepo Structure
```
v-edfinance/
├── apps/
│   ├── web/          # Next.js 15.1.2 frontend
│   └── api/          # NestJS 10+ backend
├── packages/         # Shared packages (if any)
├── .beads/          # Beads Trinity task tracking
└── prisma/          # Database schema and migrations
```

### 1.2 Key Technologies
- **Frontend:** Next.js 15.1.2, React 18.3.1, next-intl 3.26.3, Zustand
- **Backend:** NestJS 10+, Prisma 5+, PostgreSQL 16
- **Deployment:** Cloudflare Pages (frontend) + Dokploy VPS (backend)
- **Monitoring:** Grafana + Prometheus (docker-compose.monitoring.yml)
- **Task Management:** Beads Trinity (beads.exe, bv.exe)

### 1.3 Critical Infrastructure
- **Database:** PostgreSQL in Docker via `docker-compose.postgres.yml`
- **Schema Management:** Prisma migrations in `apps/api/prisma/migrations/`
- **i18n:** 3 locales (vi, en, zh) via next-intl + JSONB
- **Build System:** Turborepo + pnpm workspaces

---

## 2. Existing Issues (From Diagnostics)

### 2.1 TypeScript Errors (57 total)

#### High-Impact Errors:
1. **Test Files - Missing type assertions** (28 errors)
   - `apps/api/src/modules/simulation/scenario-generator.service.spec.ts` - 13 errors
   - `apps/web/src/components/ui/__tests__/YouTubeErrorBoundary.test.tsx` - 13 errors
   - `apps/api/src/modules/social/social.service.spec.ts` - 1 error

2. **Auth Service - Type mismatch** (1 error)
   - `apps/api/src/auth/auth.service.spec.ts:95` - Missing required User fields

3. **Dynamic Config - Schema drift** (4 errors)
   - `apps/api/src/config/dynamic-config.service.spec.ts` - Missing `description` field

4. **E2E Tests - Missing thumbnailKey** (2 errors)
   - `apps/api/test/integration/ai-course-flow.e2e-spec.ts` - Course creation schema mismatch

### 2.2 P0 Blockers (From .beads/)

1. **VED-P0A:** Root `package.json` merge conflict
   - **Status:** Open (Priority 0)
   - **Impact:** Blocks `pnpm install`
   - **Resolution:** Keep upstream version + preserve workspaces array

2. **VED-P0B:** `apps/web/package.json` merge conflict
   - **Status:** Open (Priority 0)
   - **Impact:** Blocks frontend build
   - **Resolution:** Merge both dependency sets

### 2.3 Code Quality Issues (From Grep)

#### TODO/FIXME Comments (40 found):
- **Payment Module (9 items):**
  - `TODO: Implement presigned URL generation` - unstorage.service.ts:199
  - `TODO: Handle course access revocation on refund` - webhook.service.ts:271
  
- **AI Modules (6 items):**
  - `TODO: Replace with DatabaseService vector search` - vanna.service.ts:160
  - `TODO: Implement credit tracking` - ai-tutor.service.ts:111
  - `FIXME: User model does not have lastLoginAt or streak fields` - proactive-triggers.service.ts:24

- **Nudge Engine (2 items):**
  - `FIXME: Method getCourseCompletionNudge not implemented` - nudge-engine.service.ts:106

---

## 3. Technical Constraints

### 3.1 Version Locks (From SPEC.md)
```json
{
  "Next.js": "15.1.2",
  "React": "18.3.1",
  "NestJS": "^10.0.0",
  "Prisma": "^5.0.0",
  "PostgreSQL": "16",
  "Node.js": "20.x LTS"
}
```

### 3.2 Build Requirements
- **Frontend:** `pnpm --filter web build`
- **Backend:** `pnpm --filter api build`
- **Full Monorepo:** `pnpm build` (via turbo.json)

### 3.3 Environment Files
```
Required .env variables (from env-examples/):
- DATABASE_URL
- CLOUDFLARE_API_KEY
- GOOGLE_GEMINI_API_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- JWT_SECRET
```

---

## 4. Database Schema Status

### 4.1 Recent Migrations (From AGENTS.md references)
- **Payment System:** Migration for Transaction, Subscription tables
- **JSONB Localization:** title, description fields converted to Json
- **Schema Drift Risk:** HIGH - spec tests show missing fields

### 4.2 SchemaRegistry Status
- **Location:** `apps/api/src/common/validation/schema-registry.ts`
- **Purpose:** Validate JSONB structures (localized content)
- **Gap:** Need audit to ensure all JSONB fields registered

### 4.3 Orphaned Migrations Check
**Required:** Compare `prisma/schema.prisma` with `migrations/` folder for drift

---

## 5. Temporary Files & Cleanup Candidates

### 5.1 Temp Directories (From root listing)
```
temp_ai_gallery/
temp_beads_viewer/
temp_gemini_chatbot/
temp_indie_tools/
temp_skills/
echo/                 # Likely test artifact
```

### 5.2 Archive Candidates
```
.spike/
.spikes/
-p/
archive/
history/              # Keep, but consolidate duplicates
```

### 5.3 Git Artifacts
```
beads daemon files:
- .beads/daemon.lock
- .beads/daemon.pid
- .beads/daemon.log
- .beads/bd.sock
- .beads/beads.db*
```
**Action:** Already in .gitignore per AGENTS.md lessons learned

---

## 6. Existing Patterns (Reusable)

### 6.1 Testing Patterns
- **Unit Tests:** `*.spec.ts` in module directories
- **E2E Tests:** `test/integration/*.e2e-spec.ts`
- **Frontend Tests:** `__tests__/*.test.tsx` using Vitest

### 6.2 Service Patterns
- **Validation:** Uses `SchemaRegistry` + Zod DTOs
- **Localization:** JSONB fields via `I18nService`
- **Logging:** BehaviorLog entity for user actions
- **API Structure:** Controller → Service → Prisma

### 6.3 Frontend Patterns
- **Components:** Atomic Design (atoms/, molecules/, organisms/)
- **Layouts:** `[locale]/layout.tsx` pattern
- **State:** Zustand stores in `lib/stores/`

---

## 7. External References

### 7.1 Documentation
- [AGENTS.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/AGENTS.md) - Quality standards + tool preferences
- [SPEC.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/SPEC.md) - Technical requirements
- [ARCHITECTURE.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/ARCHITECTURE.md) - System design

### 7.2 Deployment Docs
- [VPS deployment decisions](file:///c:/Users/luaho/Demo%20project/v-edfinance/history/vps-deployment/)
- [Migration fix plan](file:///c:/Users/luaho/Demo%20project/v-edfinance/history/vps-deployment/MIGRATION_FIX_PLAN.md)

---

## 8. Risk Indicators

| Component                  | Risk   | Reason                                      |
|----------------------------|--------|---------------------------------------------|
| P0 Merge Conflicts         | HIGH   | Blocking pnpm install + build               |
| TypeScript Errors          | MEDIUM | 57 errors, mostly in tests                  |
| Schema Drift               | HIGH   | Missing fields in tests → migration issue   |
| TODO Comments              | MEDIUM | 40 items, some critical (payment, AI)       |
| Temp Files                 | LOW    | Cleanup needed but not blocking             |
| Beads Daemon Files         | LOW    | Already handled in .gitignore               |

---

## 9. Success Metrics

- [ ] Zero TypeScript errors in `apps/api` and `apps/web`
- [ ] All builds pass: `pnpm build`
- [ ] P0 beads resolved (VED-P0A, VED-P0B)
- [ ] Schema validated via diagnostic endpoint
- [ ] Temp files removed
- [ ] TODO comments documented in tech debt register

---

## Next Steps

1. **Phase 2 (Synthesis):** Feed this report to Oracle for gap analysis
2. **Phase 3 (Verification):** Create spikes for HIGH risk items (schema drift, migration validation)
3. **Phase 4 (Decomposition):** Break down into beads using file-beads skill
4. **Phase 5 (Validation):** Use `bv --robot-*` commands to validate dependency graph
5. **Phase 6 (Track Planning):** Generate execution plan for orchestrator
