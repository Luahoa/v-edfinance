# Kế Hoạch Ưu Tiên Xử Lý Issues Tồn Đọng

**Generated**: 2026-01-05  
**Protocol**: Planning Skill + Orchestrator + Beads Trinity  
**Epic**: Production Deployment Unblock  
**Estimated Total**: 20-24 giờ (~3 working days parallel)

---

## Executive Summary

Audit hoàn thành, builds passing. Hiện có **5 parallel tracks** để unblock production:

- **Track A (P0)**: VPS Deployment - BLOCKED by PowerShell policy (4-6h)
- **Track B (P1)**: Independent E2E Tests - READY TO START (6h)
- **Track C (P1)**: Payment Tests - BLOCKED by Stripe keys (10h)
- **Track D (P1)**: Backend APIs - READY TO START (8h)
- **Track E (P2)**: UI Integration - Depends on Track D (10h)

**Critical Path**: Fix PowerShell → Deploy VPS → Production (4-6h)  
**Parallel Work**: Tracks B + D can start immediately

---

## 📊 Risk Level Classification

### 🔴 HIGH Risk (Production Blockers - P0)

| Issue | Risk Factor | Impact | Resolution |
|-------|-------------|--------|------------|
| PowerShell execution policy | Environment config | **Blocks ALL deployment** | 5 min fix |
| ved-43oq: API Docker deploy | Depends on PowerShell | Critical path gate | 2-3h |
| ved-949o: Web Docker deploy | Depends on ved-43oq | Critical path gate | 1.5-2h |

**Total P0**: 4-6 giờ (sequential)

### 🟡 MEDIUM Risk (Feature Blockers - P1)

| Issue | Risk Factor | Impact | Resolution |
|-------|-------------|--------|------------|
| Stripe test keys unconfirmed | Configuration | Blocks payment tests | 10 min verify |
| Backend APIs missing | New development | Blocks UI integration | 8h |
| ved-0ipz: Payment integration tests | Stripe dependency | Blocks enrollment E2E | 5h |
| ved-5olt: Enrollment E2E journey | Depends on ved-0ipz | Quality gate | 5h |

**Total P1**: 18 giờ (partially parallel)

### 🟢 LOW Risk (Independent Work - Can Start Now)

| Issue | Risk Factor | Resolution |
|-------|-------------|------------|
| ved-0je1: E2E roster test | None | 2h |
| ved-43p8: Certificate generation E2E | None | 2h |
| ved-2h6: Fix HTTP status codes | None | 2h |
| ved-4qk5: Beszel monitoring fix | Optional P2 | 1h |

**Total Low Risk**: 6 giờ (fully parallel)

---

## 🛤️ Critical Path to Production

```
┌──────────────────────────────────────────────────────────────────────┐
│                    CRITICAL PATH (Sequential)                        │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  START                                                               │
│    │                                                                 │
│    ├─► [5min] Fix PowerShell Execution Policy                       │
│    │          OR                                                     │
│    │   [Manual] SSH Deploy via MANUAL_VPS_DEPLOYMENT_GUIDE.md       │
│    │                                                                 │
│    ├─► [2-3h] ved-43oq: Deploy API Docker to VPS                    │
│    │   • Upload apps/api/ to VPS                                    │
│    │   • Build Docker image with production env                     │
│    │   • Run container connected to PostgreSQL                      │
│    │   • Verify GET /health, GET /health/db                         │
│    │                                                                 │
│    ├─► [1.5-2h] ved-949o: Deploy Web Docker to VPS                  │
│    │   • Build Next.js with NEXT_PUBLIC_API_URL                     │
│    │   • Run container on port 3000                                 │
│    │   • Verify homepage loads + i18n working                       │
│    │                                                                 │
│    ├─► [30min] Smoke Tests + Production Validation                  │
│    │   • API health checks green                                    │
│    │   • Web accessible from internet                               │
│    │   • Database queries working                                   │
│    │   • Monitoring collecting metrics                              │
│    │                                                                 │
│    ▼                                                                 │
│  ✅ DEPLOYMENT GATE PASSED                                          │
│  🚀 PRODUCTION READY                                                │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Critical Path Duration**: 4-6 giờ (khi unblocked)

---

## 🔀 Parallel Tracks với File Scope

### Track A: CrimsonDeploy (VPS Deployment) - P0 🔴

**Agent**: CrimsonDeploy  
**Epic**: Resume Track 4 VPS Deployment  
**Status**: ⏸️ BLOCKED by PowerShell execution policy

**File Scope**:
```
scripts/vps-toolkit/**
docker-compose.yml
docker-compose.monitoring.yml
apps/api/Dockerfile
apps/web/Dockerfile
MANUAL_VPS_DEPLOYMENT_GUIDE.md
```

**Prerequisite Resolution** (CRITICAL - DO FIRST):
```powershell
# Option A: Enable PowerShell (RECOMMENDED - 5 min)
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
cd scripts\vps-toolkit
npm install

# Option B: Manual SSH (Alternative)
# Follow step-by-step in MANUAL_VPS_DEPLOYMENT_GUIDE.md
```

**Beads (Sequential)**:

#### 1. ved-43oq: Deploy API Docker to VPS (2-3h)
**Status**: in_progress  
**Dependencies**: PowerShell fix

**Tasks**:
1. Upload apps/api/ to VPS via scripts/vps-toolkit/vps-connection.js
2. Build Docker image with production env vars
3. Run container with networking to PostgreSQL (172.17.0.1:5432)
4. Verify health endpoints:
   ```bash
   curl http://103.54.153.248:3001/health
   curl http://103.54.153.248:3001/health/db
   ```
5. Check logs for clean startup

**Acceptance Criteria**:
- [ ] API container running on VPS
- [ ] Health checks returning 200 OK
- [ ] Database queries working
- [ ] Logs showing no errors

#### 2. ved-949o: Deploy Web Docker to VPS (1.5-2h)
**Status**: open  
**Dependencies**: ved-43oq COMPLETE

**Tasks**:
1. Build Next.js production with `NEXT_PUBLIC_API_URL=http://103.54.153.248:3001`
2. Upload build to VPS
3. Run container on port 3000
4. Verify homepage loads
5. Test API connectivity from frontend
6. Verify i18n routes (vi, en, zh)

**Acceptance Criteria**:
- [ ] Web container running
- [ ] Homepage accessible: http://103.54.153.248:3000
- [ ] API calls succeed
- [ ] i18n switching works

#### 3. Smoke Tests (30min)
**Tasks**:
- Run smoke tests: `pnpm smoke:staging`
- Verify monitoring dashboard
- Test database connection pooling
- Check error logging

#### 4. ved-4qk5: Fix Beszel Monitoring (1h) - OPTIONAL
**Priority**: P2 (defer if time-constrained)  
**Issue**: `lstat /beszel/data: not a directory`

**Tasks**:
1. Investigate docker-compose.monitoring.yml volume mount
2. Fix volume definition
3. Restart Beszel container
4. Verify metrics collection

---

### Track B: SapphireIndependent (E2E Tests - No Blockers) - P1 🟢

**Agent**: SapphireIndependent  
**Epic**: Independent E2E Testing  
**Status**: ✅ READY TO START (no blockers)

**File Scope**:
```
apps/api/test/e2e/roster/**
apps/api/test/e2e/certificate/**
apps/api/src/**/*.controller.ts
tests/e2e/**
playwright.config.ts
```

**Beads (Can Run in Parallel)**:

#### 1. ved-0je1: E2E Roster Flow Test (2h)
**Status**: open  
**Dependencies**: None

**Tasks**:
1. Create Playwright test: `tests/e2e/roster/teacher-roster.spec.ts`
2. Test flow: Login as teacher → View roster → Filter students → Export CSV
3. Validate CSV contains correct student data

**Acceptance Criteria**:
- [ ] Roster page loads with student list
- [ ] Filters work (by progress, enrollment date)
- [ ] CSV export downloads
- [ ] CSV has headers + student rows

#### 2. ved-43p8: Certificate Generation E2E (2h)
**Status**: open  
**Dependencies**: None  
**Spike Learnings**: ved-3wpc selected PDFKit for Vietnamese fonts

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

#### 3. ved-2h6: Fix HTTP Status Code Mismatches (2h)
**Status**: in_progress  
**Dependencies**: None

**Tasks**:
1. Fix 10 failing tests expecting 200/201 but getting 401/500/400
2. Review auth middleware and service error handling
3. Ensure consistent status codes across API

**Acceptance Criteria**:
- [ ] All HTTP status tests passing
- [ ] Status codes match OpenAPI spec
- [ ] Error responses follow RFC 7807

**⚡ CAN START IMMEDIATELY**

---

### Track C: SapphirePayment (Payment Tests) - P1 🟡

**Agent**: SapphirePayment  
**Epic**: Payment Integration Testing  
**Status**: ⏸️ BLOCKED by Stripe keys confirmation

**File Scope**:
```
apps/api/src/payments/**
apps/api/src/enrollment/**
apps/api/src/webhooks/**
apps/api/test/e2e/payment/**
apps/api/test/e2e/enrollment/**
```

**Prerequisite Resolution** (DO SECOND):
```bash
# Confirm Stripe test keys exist in .env
grep -E "STRIPE_(SECRET|PUBLISHABLE|WEBHOOK)" apps/api/.env

# Required keys (test mode):
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_PUBLISHABLE_KEY=pk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...
```

**Beads (Sequential)**:

#### 1. ved-0ipz: Payment Integration Tests (5h)
**Status**: open  
**Dependencies**: Stripe keys confirmed

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

**Note**: ved-0jl6 (webhook service) already COMPLETE with 14 passing unit tests

#### 2. ved-5olt: Enrollment E2E Full Journey (5h)
**Status**: open  
**Dependencies**: ved-0ipz COMPLETE

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

---

### Track D: EmeraldBackend (Missing APIs) - P1 🟢

**Agent**: EmeraldBackend  
**Epic**: Backend API Development  
**Status**: ✅ READY TO START (no blockers)

**File Scope**:
```
apps/api/src/certificates/**
apps/api/src/revenue/**
apps/api/src/analytics/**
apps/api/prisma/schema.prisma
```

**New Development Tasks**:

#### 1. Certificate CRUD API (2h)
**Endpoint**: `GET /api/certificates/me`

**Tasks**:
1. Create CertificatesController with GET /me endpoint
2. Query user's earned certificates
3. Return certificate metadata (ID, course, issue date)

**Acceptance Criteria**:
- [ ] Endpoint returns user's certificates
- [ ] Swagger documentation updated
- [ ] Unit tests passing

#### 2. Certificate Download API (2h)
**Endpoint**: `GET /api/certificates/{id}/download`

**Tasks**:
1. Implement PDF generation using PDFKit (from spike ved-3wpc)
2. Vietnamese font support verified
3. Return PDF as download response

**Acceptance Criteria**:
- [ ] PDF generates with correct data
- [ ] Vietnamese text renders correctly
- [ ] Download triggers in browser

**Reference**: `.spikes/certificate-spike/pdfkit-test/`

#### 3. Revenue Stats API (1.5h)
**Endpoint**: `GET /api/revenue/stats`

**Tasks**:
1. Aggregate teacher's total earnings
2. Calculate monthly revenue
3. Return growth percentage

**Acceptance Criteria**:
- [ ] Stats calculated correctly
- [ ] Caching implemented (5 min TTL)
- [ ] Performance optimized

#### 4. Revenue by Course API (1.5h)
**Endpoint**: `GET /api/revenue/by-course`

**Tasks**:
1. Group earnings by course
2. Calculate per-course totals
3. Include student count

**Acceptance Criteria**:
- [ ] Revenue grouped correctly
- [ ] Sorted by revenue desc
- [ ] Student count accurate

#### 5. Recent Transactions API (1h)
**Endpoint**: `GET /api/revenue/recent-transactions`

**Tasks**:
1. Query recent transactions for teacher
2. Include pagination
3. Filter by date range

**Acceptance Criteria**:
- [ ] Transactions sorted by date desc
- [ ] Pagination working (10 per page)
- [ ] Date filters work

**⚡ CAN START IMMEDIATELY - Unblocks Track E**

---

### Track E: EmeraldIntegration (UI-Backend Integration) - P2 🟡

**Agent**: EmeraldIntegration  
**Epic**: UI Integration  
**Status**: ⏸️ BLOCKED by Track D completion

**File Scope**:
```
apps/web/src/app/**/certificates/**
apps/web/src/app/**/teacher/revenue/**
apps/web/src/components/certificates/**
apps/web/src/components/revenue/**
apps/web/src/components/roster/**
```

**Beads (Sequential - After Track D)**:

#### 1. ved-4g7h: Roster CSV Export (3h)
**Status**: open  
**Dependencies**: Backend endpoint needed

**Tasks**:
1. Add export button to roster page
2. Call backend API for CSV generation
3. Handle Vietnamese character encoding
4. Trigger download in browser

**Acceptance Criteria**:
- [ ] Export button works
- [ ] CSV downloads with correct data
- [ ] Vietnamese encoding correct
- [ ] All fields included

#### 2. ved-22q0: Engagement Analytics Charts (5h)
**Status**: open  
**Dependencies**: Backend analytics API

**Tasks**:
1. Install recharts library
2. Create 3 charts: completion rate, time spent, quiz scores
3. Connect to backend analytics API
4. Add date range filters

**Acceptance Criteria**:
- [ ] 3 charts render correctly
- [ ] Data accurate
- [ ] Filters work
- [ ] Responsive design

#### 3. ved-9otm: UI Polish (2h)
**Status**: open  
**Dependencies**: ved-4g7h, ved-22q0

**Tasks**:
1. Fix any integration bugs
2. Add loading states
3. Error handling improvements
4. Accessibility fixes

**Acceptance Criteria**:
- [ ] No console errors
- [ ] Loading states smooth
- [ ] Errors display user-friendly messages
- [ ] WCAG AA compliance

---

## 📈 Execution Timeline (Gantt)

```
Hour  0    2    4    6    8    10   12   14   16   18   20   22   24
      │    │    │    │    │    │    │    │    │    │    │    │    │
      ├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤
      │    │    │    │    │    │    │    │    │    │    │    │    │
Track │ ┌──────────────────────────────────┐                        │
A (P0)│ │ [Fix PS] → [API] → [Web] → [Smoke]                       │
      │ └──────────────────────────────────┘                        │
      │                                     ▼                        │
      │                          ✅ DEPLOYMENT GATE PASSED          │
      │                                                              │
Track │ ┌──────────────────────┐                                    │
B (P1)│ │ [Roster][Cert][HTTP] │                                    │
      │ └──────────────────────┘                                    │
      │                                                              │
Track │        ┌──────────────────────────────────┐                 │
C (P1)│        │ [Stripe Confirm] → [Pay][Enroll] │                 │
      │        └──────────────────────────────────┘                 │
      │                                                              │
Track │ ┌──────────────────────────────┐                            │
D (P1)│ │ [Cert API][Rev API][Analytics]                            │
      │ └──────────────────────────────┘                            │
      │                                ▼                            │
Track │                   ┌────────────────────────────────┐        │
E (P2)│                   │ [CSV Export][Charts][Polish]   │        │
      │                   └────────────────────────────────┘        │
      │                                                     ▼        │
      ▼                                                     ▼        ▼
   DEPLOY                                            UI READY   PRODUCTION
  UNBLOCKED                                                        READY
```

**Legend**:
- **Track A**: Sequential (critical path)
- **Track B**: Can start immediately (parallel)
- **Track C**: Blocked by Stripe confirmation
- **Track D**: Can start immediately (parallel)
- **Track E**: Blocked by Track D

---

## 🚀 Orchestrator Commands (Ready to Execute)

### Step 1: Resolve Blockers (MANUAL - User Action Required)

```powershell
# BLOCKER 1: PowerShell Execution Policy (5 min)
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
cd scripts\vps-toolkit
npm install
```

```bash
# BLOCKER 2: Confirm Stripe Keys (10 min)
grep -E "STRIPE_(SECRET|PUBLISHABLE|WEBHOOK)" apps/api/.env
# Must see: sk_test_, pk_test_, whsec_
```

### Step 2: Spawn Parallel Agents (After Blockers Resolved)

```typescript
// Spawn Track A: CrimsonDeploy (After PowerShell fix)
Task({
  description: "Track A: CrimsonDeploy - VPS Deployment (P0)",
  prompt: `
You are agent CrimsonDeploy working on Track A: VPS Deployment (P0).

## Context
PowerShell execution policy resolved. Builds passing. Ready to deploy.

## Your Track
Beads IN ORDER: ved-43oq → ved-949o → Smoke Tests → ved-4qk5 (optional)

File scope: scripts/vps-toolkit/**, docker-compose*.yml

## Protocol
For EACH bead:
1. Use beads CLI: beads update <id> --status in_progress --no-daemon
2. Execute deployment steps
3. Verify with health checks
4. Close: beads close <id> --reason "Summary" --no-daemon

## Critical
- Follow MANUAL_VPS_DEPLOYMENT_GUIDE.md if needed
- VPS: 103.54.153.248
- Database: postgresql://postgres:***@172.17.0.1:5432/vedfinance
- Save logs if errors occur

Return summary when track complete.
  `
});

// Spawn Track B: SapphireIndependent (IMMEDIATE START)
Task({
  description: "Track B: SapphireIndependent - E2E Tests (P1)",
  prompt: `
You are agent SapphireIndependent working on Track B: E2E Testing (P1).

## Context
No blockers. Can start immediately.

## Your Track
Beads IN PARALLEL: ved-0je1 (roster E2E), ved-43p8 (cert E2E), ved-2h6 (HTTP status)

File scope: apps/api/test/e2e/**, tests/e2e/**

## Protocol
For EACH bead:
1. Use beads CLI: beads update <id> --status in_progress --no-daemon
2. Create Playwright tests
3. Verify all tests passing
4. Close: beads close <id> --reason "Summary" --no-daemon

## Testing Requirements
- Playwright for E2E tests
- All tests must pass before closing bead
- Run: pnpm test:e2e

Return summary when track complete.
  `
});

// Spawn Track D: EmeraldBackend (IMMEDIATE START)
Task({
  description: "Track D: EmeraldBackend - Backend APIs (P1)",
  prompt: `
You are agent EmeraldBackend working on Track D: Backend API Development (P1).

## Context
Building missing APIs for certificates and revenue dashboards.

## Your Track
Tasks: Certificate CRUD API, Certificate Download, Revenue Stats, Revenue by Course, Recent Transactions

File scope: apps/api/src/certificates/**, apps/api/src/revenue/**

## Protocol
For EACH API:
1. Create NestJS controller and service
2. Add Swagger documentation
3. Write unit tests
4. Verify build passes

## Implementation Details
- Certificate download uses PDFKit (see .spikes/certificate-spike/)
- Revenue queries use Prisma aggregations
- Add caching for stats (5 min TTL)

Return summary when track complete.
  `
});

// Spawn Track C: SapphirePayment (After Stripe confirmation)
Task({
  description: "Track C: SapphirePayment - Payment Tests (P1)",
  prompt: `
You are agent SapphirePayment working on Track C: Payment Testing (P1).

## Context
Stripe test keys confirmed. Webhook service already complete (ved-0jl6).

## Your Track
Beads IN ORDER: ved-0ipz → ved-5olt

File scope: apps/api/src/payments/**, apps/api/test/e2e/payment/**

## Protocol
For EACH bead:
1. Use beads CLI: beads update <id> --status in_progress --no-daemon
2. Setup Stripe test mode
3. Write integration tests
4. Use Stripe CLI for webhook testing
5. Close: beads close <id> --reason "Summary" --no-daemon

## Testing Details
- Test card: 4242 4242 4242 4242 (success)
- Declined card: 4000 0000 0000 0002
- Webhook secret: STRIPE_WEBHOOK_SECRET env var

Return summary when track complete.
  `,
  // BLOCKED until Stripe keys confirmed
});

// Spawn Track E: EmeraldIntegration (After Track D complete)
Task({
  description: "Track E: EmeraldIntegration - UI Integration (P2)",
  prompt: `
You are agent EmeraldIntegration working on Track E: UI Integration (P2).

## Context
Track D (Backend APIs) complete. Now integrating UI components.

## Your Track
Beads IN ORDER: ved-4g7h → ved-22q0 → ved-9otm

File scope: apps/web/src/components/**, apps/web/src/app/**

## Protocol
For EACH bead:
1. Use beads CLI: beads update <id> --status in_progress --no-daemon
2. Connect UI to backend APIs
3. Test Vietnamese encoding
4. Verify i18n working
5. Close: beads close <id> --reason "Summary" --no-daemon

## UI Guidelines
- shadcn/ui components
- i18n: useTranslations() for all strings
- Tailwind (no arbitrary values)
- Server Components by default

Return summary when track complete.
  `,
  // BLOCKED until Track D complete
});
```

---

## 📊 Success Metrics

### Track A (CrimsonDeploy) - Deployment
- [ ] API health endpoint: 200 OK
- [ ] Web homepage loads in < 2s
- [ ] Database queries working
- [ ] Monitoring collecting metrics

### Track B (SapphireIndependent) - E2E Tests
- [ ] Roster E2E test passing
- [ ] Certificate E2E test passing
- [ ] HTTP status codes all correct

### Track C (SapphirePayment) - Payment Tests
- [ ] Payment integration tests: 100% passing
- [ ] Enrollment E2E: Full journey green

### Track D (EmeraldBackend) - APIs
- [ ] All 5 endpoints implemented
- [ ] Swagger docs updated
- [ ] Unit tests passing
- [ ] PDF generation working

### Track E (EmeraldIntegration) - UI
- [ ] CSV export downloading
- [ ] 3 analytics charts rendering
- [ ] No console errors
- [ ] Vietnamese text correct

---

## 🔗 Cross-Track Dependencies

```mermaid
graph TD
    PS[PowerShell Fix] --> A1[ved-43oq API Deploy]
    A1 --> A2[ved-949o Web Deploy]
    A2 --> A3[Smoke Tests]
    A3 --> PROD[Production Ready]
    
    SK[Stripe Keys Confirm] --> C1[ved-0ipz Payment Tests]
    C1 --> C2[ved-5olt Enrollment E2E]
    C2 --> PROD
    
    B1[ved-0je1 Roster E2E]
    B2[ved-43p8 Cert E2E]
    B3[ved-2h6 HTTP Status]
    B1 --> PROD
    B2 --> PROD
    B3 --> PROD
    
    D1[Certificate API]
    D2[Revenue API]
    D1 --> E1[ved-4g7h CSV Export]
    D2 --> E2[ved-22q0 Analytics Charts]
    E1 --> E3[ved-9otm Polish]
    E2 --> E3
    E3 --> PROD
    
    style PS fill:#ff6b6b
    style SK fill:#ffd93d
    style PROD fill:#51cf66
```

---

## 📝 Handoff to Next Session

**For Orchestrator Agent**:

1. **Read this plan**: PRIORITIZED_EXECUTION_PLAN.md
2. **Resolve blockers**: PowerShell + Stripe keys (user action required)
3. **Spawn agents**: Use orchestrator commands above
4. **Monitor**: Check agent-mail for progress reports
5. **Handle blockers**: Coordinate between tracks if needed

**For User**:

1. **Action Required**: Run PowerShell fix + confirm Stripe keys
2. **Then**: Let orchestrator spawn 5 parallel agents
3. **Monitor**: Check beads status via `beads list --status in_progress`
4. **Timeline**: 20-24h total with parallel execution

---

## 📁 References

- [MULTI_TRACK_EXECUTION_STATUS.md](file:///c%3A/Users/luaho/Demo%20project/v-edfinance/MULTI_TRACK_EXECUTION_STATUS.md)
- [TASKS_ISSUES_SUMMARY.md](file:///c%3A/Users/luaho/Demo%20project/v-edfinance/TASKS_ISSUES_SUMMARY.md)
- [MANUAL_VPS_DEPLOYMENT_GUIDE.md](file:///c%3A/Users/luaho/Demo%20project/v-edfinance/MANUAL_VPS_DEPLOYMENT_GUIDE.md)
- [Planning Skill](.agents/skills/planning.md)
- [Orchestrator Skill](.agents/skills/orchestrator.md)
- [Audit Final Summary](history/audit/PROJECT_AUDIT_FINAL_SUMMARY.md)

---

**Prepared by**: Amp Planning + Oracle + Orchestrator  
**Status**: ✅ Ready for Execution  
**Next Step**: Resolve PowerShell blocker → Spawn 5 parallel agents → Production in 20-24h
