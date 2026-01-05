# V-EdFinance: Multi-Track Execution Plan

**Generated**: 2026-01-05  
**Context**: Post ved-3gat Audit - Deployment Ready  
**Epic**: Resume Production Deployment + Feature Completion  
**Estimated Total**: 84-96 hours (2-2.5 weeks)

---

## Executive Summary

Project audit complete. Builds passing. Ready to resume VPS deployment and complete remaining features in 4 parallel tracks.

**Critical Path**: Track 1 (Deployment) → 4-6 hours to production  
**Parallel Work**: Tracks 2-4 can proceed simultaneously

---

## Track Assignments

| Track | Agent | Focus Area | Beads | Estimate | Priority |
|-------|-------|------------|-------|----------|----------|
| **Track 1** | **CrimsonDeploy** | VPS Deployment (Resume Track 4) | 3 beads | 4-6h | **P0** |
| **Track 2** | **SapphireTest** | E2E Testing + Quality | 7 beads | 22h | **P1** |
| **Track 3** | **EmeraldFeature** | Payment + Certificate Features | 6 beads | 26h | **P1** |
| **Track 4** | **AmberCleanup** | Code Quality + Technical Debt | 4 epics | 47h | **P2** |

---

## Track 1: CrimsonDeploy - VPS Deployment (CRITICAL PATH)

**Agent**: CrimsonDeploy  
**File Scope**: `scripts/vps-toolkit/**`, `docker-compose*.yml`, VPS remote  
**Epic**: Complete Track 4 VPS Deployment  
**Priority**: P0 - Blocks production launch

### Beads (In Order)

#### 1. ved-43oq: Deploy API Docker to VPS
**Estimate**: 2-3 hours  
**Status**: Open  
**Context**: Builds passing, migrations deployed, ready for container

**Tasks**:
1. Upload `apps/api/` to VPS via `scripts/vps-toolkit/vps-connection.js`
2. Build Docker image on VPS with production env vars
3. Run container with proper networking (connect to PostgreSQL)
4. Verify health endpoint: `GET /health`
5. Test database connection: `GET /health/db`

**Acceptance Criteria**:
- [ ] API container running on VPS
- [ ] Health checks passing
- [ ] Database queries working
- [ ] Logs showing clean startup

**Learnings from Audit**:
- Builds verified passing locally
- No schema drift issues remain
- Environment variables validated

---

#### 2. ved-949o: Deploy Web Docker to VPS
**Estimate**: 1.5-2 hours  
**Status**: Open

**Tasks**:
1. Build Next.js production image with `NEXT_PUBLIC_API_URL=http://103.54.153.248:3001`
2. Upload to VPS
3. Run container on port 3000
4. Verify static routes render
5. Test API connectivity from frontend

**Acceptance Criteria**:
- [ ] Web container running
- [ ] Homepage loads
- [ ] API calls succeed
- [ ] i18n routes working (vi, en, zh)

**Dependencies**: ved-43oq (API must be running first)

---

#### 3. ved-4qk5: Fix Beszel Monitoring Volume Issue
**Estimate**: 30-60 minutes  
**Status**: Open  
**Priority**: P2 (Optional - can defer if time-constrained)

**Issue**: `lstat /beszel/data: not a directory`

**Tasks**:
1. Investigate Beszel volume mount configuration
2. Check if `/beszel/data` is file vs directory
3. Fix docker-compose.monitoring.yml volume definition
4. Restart Beszel container
5. Verify metrics collection

**Acceptance Criteria**:
- [ ] Beszel container starts without errors
- [ ] Metrics dashboard accessible
- [ ] System stats collecting

---

### Track 1 Summary Checklist

- [ ] API deployed and healthy
- [ ] Web deployed and accessible
- [ ] Smoke tests passed
- [ ] Monitoring stack operational (optional: Beszel)
- [ ] Production environment validated

**Handoff to User**:
- VPS endpoint: `http://103.54.153.248:3000`
- API endpoint: `http://103.54.153.248:3001`
- Grafana: `http://103.54.153.248:3001` (monitoring)

---

## Track 2: SapphireTest - E2E Testing & Quality

**Agent**: SapphireTest  
**File Scope**: `tests/e2e/**`, `apps/web/src/**/*test*`, `apps/api/src/**/*spec*`  
**Epic**: Complete E2E Testing Coverage  
**Priority**: P1 - Quality gates

### Beads (In Order)

#### 1. ved-0jl6: Enrollment Webhook Service (CRITICAL)
**Estimate**: 6 hours  
**Status**: Open  
**Priority**: P0 (Blocks payment system)

**Spike Learnings**: Spike ved-pmbv validated Prisma transaction pattern

**Tasks**:
1. Implement webhook handler at `/api/webhooks/stripe`
2. Validate Stripe signature using `STRIPE_WEBHOOK_SECRET`
3. Handle `checkout.session.completed` event
4. Create enrollment in Prisma transaction:
   ```typescript
   prisma.$transaction([
     prisma.enrollment.create({ userId, courseId }),
     prisma.transaction.update({ status: COMPLETED })
   ])
   ```
5. Send enrollment confirmation email (Resend API)
6. Add error handling + idempotency (check existing enrollment)

**Acceptance Criteria**:
- [ ] Webhook endpoint receives Stripe events
- [ ] Signature validation passes
- [ ] Enrollment created atomically
- [ ] Email sent to student
- [ ] Idempotency prevents duplicates

**Reference**: `.spikes/payment-spike/webhook-test/` (from ved-pmbv)

---

#### 2. ved-0ipz: Payment Integration Tests (Stripe Test Mode)
**Estimate**: 5 hours  
**Status**: Open

**Tasks**:
1. Setup Stripe test mode in `apps/api/test/`
2. Test checkout flow with test card `4242 4242 4242 4242`
3. Test webhook delivery (use Stripe CLI webhook forwarding)
4. Test failure cases (card declined `4000 0000 0000 0002`)
5. Test refund flow

**Acceptance Criteria**:
- [ ] Checkout creates PaymentIntent
- [ ] Webhook triggers enrollment
- [ ] Declined card handled gracefully
- [ ] Refund updates transaction status

**Dependencies**: ved-0jl6 (webhook must exist)

---

#### 3. ved-0je1: E2E Roster Flow Test
**Estimate**: 2 hours  
**Status**: Open

**Tasks**:
1. Create Playwright test: `tests/e2e/roster/teacher-roster.spec.ts`
2. Test flow: Login as teacher → View roster → Filter students → Export CSV
3. Validate CSV contains correct student data

**Acceptance Criteria**:
- [ ] Roster page loads with student list
- [ ] Filters work (by progress, enrollment date)
- [ ] CSV export downloads
- [ ] CSV has headers + student rows

---

#### 4. ved-5olt: Enrollment E2E Full Journey
**Estimate**: 5 hours  
**Status**: Open

**Flow**: Browse course → Add to cart → Checkout → Pay → Access lessons → Take quiz

**Tasks**:
1. Create end-to-end Playwright test
2. Use Stripe test card for payment
3. Verify enrollment created
4. Verify lesson access granted
5. Complete quiz and check grade

**Acceptance Criteria**:
- [ ] Complete flow from discovery to quiz passes
- [ ] Payment processed
- [ ] Enrollment active
- [ ] Quiz results saved

**Dependencies**: ved-0jl6, ved-0ipz

---

#### 5. ved-43p8: Certificate Generation E2E
**Estimate**: 2 hours  
**Status**: Open

**Spike Learnings**: ved-3wpc selected PDFKit for Vietnamese font support

**Tasks**:
1. Create E2E test: Complete quiz → Generate certificate → Download PDF
2. Verify PDF contains Vietnamese text (student name, course title)
3. Verify PDF metadata (certificate ID, issue date)

**Acceptance Criteria**:
- [ ] Certificate generated after quiz completion
- [ ] PDF downloads successfully
- [ ] Vietnamese text renders correctly
- [ ] Certificate ID unique

**Reference**: `.spikes/certificate-spike/pdfkit-test/`

---

#### 6. ved-20bv: E2E CI Integration
**Estimate**: 2 hours  
**Status**: Open

**Tasks**:
1. Add E2E tests to GitHub Actions workflow
2. Run tests on every PR
3. Quality gates: 95% pass rate, < 3 minutes execution
4. Fail PR if tests fail

**Acceptance Criteria**:
- [ ] CI runs E2E tests automatically
- [ ] Test results posted to PR
- [ ] Failing tests block merge

**Dependencies**: ved-0je1, ved-5olt, ved-43p8 (need tests to exist)

---

#### 7. ved-2h6: Fix HTTP Status Code Mismatches (10 tests)
**Estimate**: 1-2 hours  
**Status**: In Progress

**Issue**: Integration tests expecting 200/201 but getting 401/500/400

**Tasks**:
1. Review failing tests in `apps/api/src/**/*.spec.ts`
2. Fix auth middleware issues causing 401
3. Fix service errors causing 500
4. Add proper error handling

**Acceptance Criteria**:
- [ ] All 10 tests passing
- [ ] Correct HTTP status codes returned

---

### Track 2 Summary

**Total**: 7 beads, 22 hours  
**Critical Path**: ved-0jl6 → ved-0ipz → ved-5olt → ved-20bv  
**Parallel**: ved-0je1, ved-43p8, ved-2h6 can run anytime

---

## Track 3: EmeraldFeature - Payment & Certificate Features

**Agent**: EmeraldFeature  
**File Scope**: `apps/web/src/app/[locale]/checkout/**`, `apps/web/src/app/[locale]/certificates/**`, `apps/api/src/modules/payment/**`, `apps/api/src/modules/certificates/**`  
**Epic**: Complete Payment + Certificate UI  
**Priority**: P1

### Beads (In Order)

#### 1. ved-6s0z: Payment UI - Checkout Page Component
**Estimate**: 8 hours  
**Status**: Open

**Tasks**:
1. Create checkout page: `apps/web/src/app/[locale]/checkout/page.tsx`
2. Integrate Stripe Elements (CardElement)
3. Handle payment submission → `POST /api/payment/create-checkout`
4. Show loading state during payment
5. Handle success → redirect to course
6. Handle error → show user-friendly message
7. Add i18n for all UI strings (vi, en, zh)

**Acceptance Criteria**:
- [ ] Checkout page renders Stripe card form
- [ ] Payment submission works
- [ ] Success redirects to enrolled course
- [ ] Error messages displayed
- [ ] i18n complete

**Reference**: Stripe Elements React docs (use `read_web_page`)

---

#### 2. ved-61gi: Payment Admin - Teacher Revenue Dashboard
**Estimate**: 6 hours  
**Status**: Open

**Tasks**:
1. Create dashboard: `apps/web/src/app/[locale]/teacher/revenue/page.tsx`
2. Add API endpoint: `GET /api/payment/teacher-revenue`
3. Show metrics: Total revenue, transaction count, payout status
4. Table: Transaction history with filters (date range, status)
5. Chart: Revenue over time (use recharts)

**Acceptance Criteria**:
- [ ] Dashboard shows teacher revenue metrics
- [ ] Transaction history table works
- [ ] Revenue chart displays
- [ ] Filters work (date, status)

---

#### 3. ved-9omm: Certificate UI - Student Certificate Download
**Estimate**: 3 hours  
**Status**: Open

**Tasks**:
1. Create certificates page: `apps/web/src/app/[locale]/certificates/page.tsx`
2. List all student certificates (earned after quiz completion)
3. Download button → `GET /api/certificates/{id}/download`
4. Share button → copy certificate URL to clipboard
5. Certificate preview (thumbnail)

**Acceptance Criteria**:
- [ ] Certificates page lists earned certificates
- [ ] Download button fetches PDF
- [ ] Share link works
- [ ] Preview shows certificate thumbnail

**Dependencies**: Certificate backend already implemented

---

#### 4. ved-4g7h: Roster Export - Export to CSV
**Estimate**: 3 hours  
**Status**: Open

**Tasks**:
1. Add export button to roster page
2. Call API: `GET /api/roster/{courseId}/export`
3. Backend generates CSV with student data
4. Download CSV file
5. CSV includes: Name, Email, Progress %, Enrollment Date, Last Activity

**Acceptance Criteria**:
- [ ] Export button downloads CSV
- [ ] CSV has correct headers
- [ ] All student data included
- [ ] CSV opens in Excel/Google Sheets

---

#### 5. ved-22q0: Engagement Analytics - Time Spent and Completion Charts
**Estimate**: 5 hours  
**Status**: Open

**Tasks**:
1. Create analytics page: `apps/web/src/app/[locale]/analytics/page.tsx`
2. Add API endpoints:
   - `GET /api/analytics/lesson-time` (avg time per lesson)
   - `GET /api/analytics/completion-trends` (completion % over time)
   - `GET /api/analytics/engagement-heatmap` (activity by hour/day)
3. Display charts using recharts:
   - Bar chart: Avg time per lesson
   - Line chart: Completion trend
   - Heatmap: Engagement by time of day

**Acceptance Criteria**:
- [ ] Analytics page shows 3 charts
- [ ] Data fetched from API
- [ ] Charts render correctly
- [ ] Interactive (tooltips, filters)

---

#### 6. ved-9otm: Enrollment Validation - Duplicate Check and Limits
**Estimate**: 4 hours  
**Status**: Open

**Tasks**:
1. Add validation to enrollment service:
   - Check if user already enrolled in course
   - Check if course has capacity limit
   - Verify payment completed before enrollment
2. Return proper errors (409 Conflict, 403 Forbidden)
3. Add tests for validation logic

**Acceptance Criteria**:
- [ ] Duplicate enrollment prevented
- [ ] Capacity limits enforced
- [ ] Payment verification works
- [ ] Tests passing

---

### Track 3 Summary

**Total**: 6 beads, 29 hours  
**Critical Path**: ved-6s0z → ved-0jl6 (webhook) → Payment system complete  
**Parallel**: ved-9omm, ved-4g7h, ved-22q0, ved-9otm can run independently

---

## Track 4: AmberCleanup - Code Quality & Technical Debt

**Agent**: AmberCleanup  
**File Scope**: All codebase (refactoring)  
**Epic**: Pay Down Technical Debt (Deferred from Audit)  
**Priority**: P2 - Can run in background

### Epic 1: Type Safety Improvements (40 hours)

**Goal**: Remove 482 `any` types, add explicit types

**Sub-beads**:
1. Create typed interfaces for AuthenticatedRequest (4h)
2. Type JSONB payload/metadata fields (20h)
3. Add return types to functions (10h)
4. Remove `@ts-ignore` comments (6h)

**Acceptance Criteria**:
- [ ] `any` types < 50 (90% reduction)
- [ ] All request interfaces typed
- [ ] JSONB fields have Zod schemas
- [ ] No `@ts-ignore` in production code

---

### Epic 2: JSONB Validation (4 hours)

**Goal**: Increase validation coverage from 35% to 100%

**Tasks**:
1. Audit all JSONB fields (use AUDIT_SCHEMA.md)
2. Create Zod schemas for missing fields
3. Integrate ValidationService into services
4. Add tests for validation

**Acceptance Criteria**:
- [ ] All 40 JSONB fields validated
- [ ] SchemaRegistry complete
- [ ] ValidationService used in all writes
- [ ] Tests passing

**Reference**: `history/audit/AUDIT_SCHEMA.md`

---

### Epic 3: Schema Drift Resolution (4 hours)

**Goal**: Reconcile 11 orphaned models, fix 3 duplicates

**Tasks**:
1. Review `add_integration_models.sql` (11 orphaned models)
2. Decision: Add to schema.prisma OR delete migration
3. Fix duplicate model definitions (QuizAttempt, Certificate, Achievement)
4. Run `prisma migrate status` to verify

**Acceptance Criteria**:
- [ ] No orphaned models
- [ ] No duplicate definitions
- [ ] Migration history clean
- [ ] Schema drift documented

**Reference**: `history/audit/AUDIT_SCHEMA.md`

---

### Epic 4: File System Cleanup (3 hours)

**Goal**: Organize 99MB binaries, 82 root .md files, temp_* dirs

**Tasks**:
1. Remove binaries from git (beads.exe, bv.exe, go_installer.msi)
2. Move 82 .md files to `docs/` subdirectories
3. Consolidate temp_* directories to `temp/` or delete
4. Update .gitignore

**Acceptance Criteria**:
- [ ] Repository size reduced by 99MB
- [ ] Root directory < 20 files
- [ ] All docs in `docs/`
- [ ] .gitignore updated

**Reference**: `history/audit/AUDIT_FILESYSTEM.md`

---

### Track 4 Summary

**Total**: 4 epics, 51 hours  
**Execution**: Can run in background while Tracks 1-3 proceed  
**Defer**: Can postpone to post-production if time-constrained

---

## Cross-Track Dependencies

```mermaid
graph TD
    A[Track 1: Deployment] -->|Unblocks Production| B[Track 2: Testing]
    B -->|Quality Gates| C[Production Launch]
    D[Track 3: Features] -->|Payment Complete| E[Track 2: Payment Tests]
    E -->|All E2E Pass| C
    F[Track 4: Cleanup] -.->|Optional| C
    
    style A fill:#ff6b6b
    style B fill:#4ecdc4
    style D fill:#95e1d3
    style F fill:#ffd93d
```

### Critical Path
```
Track 1 (CrimsonDeploy) → Deploy API + Web → Production Live
  ↓
Track 2 (SapphireTest) → ved-0jl6 (webhook) → Payment Tests → E2E CI
  ↓
Production Ready with Quality Gates
```

### Parallel Execution
- **Track 3** (EmeraldFeature) can work on UI while Track 1 deploys
- **Track 4** (AmberCleanup) runs independently in background
- **Track 2** ved-0je1, ved-43p8 can run before webhook done

---

## Agent Prompts (For Orchestrator)

### CrimsonDeploy (Track 1)

```
You are agent CrimsonDeploy working on Track 1: VPS Deployment.

## Setup
1. Read AGENTS.md for VPS connection details
2. Database: postgresql://postgres:***@172.17.0.1:5432/vedfinance
3. VPS: 103.54.153.248 (use scripts/vps-toolkit/vps-connection.js)

## Your Track
Beads IN ORDER: ved-43oq → ved-949o → ved-4qk5

File scope: scripts/vps-toolkit/**, docker-compose*.yml, VPS remote

## Protocol
For EACH bead:
1. Read bead with `bd show <id>`
2. Claim: `bd update <id> --status in_progress`
3. Execute deployment steps
4. Verify with smoke tests
5. Close: `bd close <id> --reason "Summary"`
6. Report to orchestrator: "Bead <id> COMPLETE"

## Critical
- Verify builds passing BEFORE deploying
- Test health endpoints AFTER each deployment
- Save VPS logs if errors occur
```

### SapphireTest (Track 2)

```
You are agent SapphireTest working on Track 2: E2E Testing.

## Your Track
Beads IN ORDER: ved-0jl6 → ved-0ipz → ved-0je1 → ved-5olt → ved-43p8 → ved-20bv → ved-2h6

File scope: tests/e2e/**, apps/api/src/modules/payment/**, apps/web/src/**/*test*

## Critical Bead: ved-0jl6 (Enrollment Webhook)
This BLOCKS payment system. See spike learnings in .spikes/payment-spike/

## Testing Requirements
- Use Stripe test mode (test API keys)
- Playwright for E2E tests
- All tests must pass before closing bead
```

### EmeraldFeature (Track 3)

```
You are agent EmeraldFeature working on Track 3: Payment & Certificate Features.

## Your Track
Beads IN ORDER: ved-6s0z → ved-61gi → ved-9omm → ved-4g7h → ved-22q0 → ved-9otm

File scope: apps/web/src/app/[locale]/{checkout,certificates,revenue,analytics}/**

## UI Guidelines
- Use shadcn/ui components
- i18n: useTranslations('namespace') for all strings
- Tailwind for styling (no arbitrary values)
- Server Components by default

## Stripe Integration
ved-6s0z uses Stripe Elements - read docs with read_web_page if needed
```

### AmberCleanup (Track 4)

```
You are agent AmberCleanup working on Track 4: Code Quality & Technical Debt.

## Your Track
Epics: Type Safety (40h) → JSONB Validation (4h) → Schema Drift (4h) → File Cleanup (3h)

File scope: ALL (refactoring across codebase)

## References
- history/audit/AUDIT_CODE_QUALITY.md
- history/audit/AUDIT_SCHEMA.md
- history/audit/AUDIT_FILESYSTEM.md

## Important
This track is DEFERRED (P2) - pause if Tracks 1-3 need help
```

---

## Execution Timeline (Gantt)

```
Week 1 (Days 1-5):
Track 1: [CrimsonDeploy: Deploy API+Web========] COMPLETE Day 1
Track 2: [SapphireTest: Webhook======][Payment Tests====][E2E Tests========]
Track 3: [EmeraldFeature: Checkout UI==========][Revenue Dashboard=====]
Track 4: [AmberCleanup: Type Safety (ongoing).....................]

Week 2 (Days 6-10):
Track 2: [E2E CI====][HTTP Status Fix==] COMPLETE Day 7
Track 3: [Cert UI===][Roster Export===][Analytics=====] COMPLETE Day 9
Track 4: [JSONB Validation==][Schema Drift==][File Cleanup=] COMPLETE Day 10

PRODUCTION LAUNCH: Day 7 (after Track 1 + Track 2 critical path)
```

---

## Success Metrics

### Track 1 (CrimsonDeploy)
- [ ] API health endpoint: 200 OK
- [ ] Web homepage loads in < 2s
- [ ] Database queries working
- [ ] Monitoring collecting metrics

### Track 2 (SapphireTest)
- [ ] Enrollment webhook: 100% success rate
- [ ] Payment tests: All passing
- [ ] E2E tests: 95%+ pass rate, < 3min
- [ ] CI integration: Auto-run on PR

### Track 3 (EmeraldFeature)
- [ ] Checkout flow: Stripe payment works
- [ ] Revenue dashboard: Charts render
- [ ] Certificates: PDF downloads
- [ ] Analytics: 3 charts functional

### Track 4 (AmberCleanup)
- [ ] Type safety: < 50 `any` types (from 482)
- [ ] JSONB validation: 100% coverage
- [ ] Schema drift: 0 orphaned models
- [ ] File system: < 20 root files

---

## Handoff to Next Session

**For Orchestrator Agent**:

1. Load this execution plan
2. Spawn 4 parallel agents using Task tool
3. Monitor via agent-mail (epic thread + track threads)
4. Handle blockers between tracks
5. Report completion when all tracks done

**Commands**:
```bash
# Read this plan
Read("history/execution/MULTI_TRACK_EXECUTION_PLAN.md")

# Spawn workers (parallel)
Task(description="Track 1: CrimsonDeploy", prompt="...")
Task(description="Track 2: SapphireTest", prompt="...")
Task(description="Track 3: EmeraldFeature", prompt="...")
Task(description="Track 4: AmberCleanup", prompt="...")
```

**References**:
- [Planning Skill](.agents/skills/planning.md)
- [Orchestrator Skill](.agents/skills/orchestrator.md)
- [Tasks Summary](TASKS_ISSUES_SUMMARY.md)
- [Audit Report](history/audit/PROJECT_AUDIT_FINAL_SUMMARY.md)

---

**Prepared by**: Amp Planning + Orchestrator Skills  
**Ready for**: Next session orchestrator  
**Estimated completion**: 2-2.5 weeks (with 4 parallel agents)
