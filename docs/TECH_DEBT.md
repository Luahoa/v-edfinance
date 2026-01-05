# Technical Debt Register

**Last Updated:** 2026-01-05  
**Maintainer:** V-EdFinance Development Team  
**Purpose:** Track technical debt across the codebase for prioritized resolution

---

## Table of Contents

1. [Overview](#overview)
2. [Priority Levels](#priority-levels)
3. [Backend Technical Debt](#backend-technical-debt)
4. [Frontend Technical Debt](#frontend-technical-debt)
5. [Infrastructure Technical Debt](#infrastructure-technical-debt)
6. [Resolution Strategy](#resolution-strategy)

---

## Overview

This document tracks all known technical debt in the V-EdFinance codebase. Technical debt includes:
- **TODOs** - Planned future work
- **FIXMEs** - Known bugs or issues requiring fixes
- **HACKs** - Temporary solutions needing proper implementation
- **Incomplete features** - Partially implemented functionality
- **Schema drift** - Database/code misalignments

---

## Priority Levels

| Priority | Description | Timeline |
|----------|-------------|----------|
| **P0** | Blocks production deployment | Immediate (< 1 week) |
| **P1** | Impacts user experience or security | Short-term (1-4 weeks) |
| **P2** | Technical improvement, no immediate impact | Medium-term (1-3 months) |
| **P3** | Nice-to-have enhancements | Long-term (> 3 months) |

---

## Backend Technical Debt

### Storage & Infrastructure

#### P1: R2 Presigned URL Generation Missing
- **File:** [apps/api/src/storage/unstorage.service.ts#L199](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/src/storage/unstorage.service.ts#L199)
- **Issue:** Presigned URL generation for R2/GCS not implemented
- **Impact:** Cannot securely serve private files without exposing credentials
- **Recommendation:** Implement using Cloudflare Workers signed URLs
- **Estimated Effort:** 4 hours

```typescript
// TODO: Implement presigned URL generation for R2/GCS
```

---

### AI & Prediction Services

#### P2: Hardcoded Similar Users Benchmark
- **File:** [apps/api/src/modules/prediction/prediction.service.ts#L63](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/src/modules/prediction/prediction.service.ts#L63)
- **Issue:** Benchmark value hardcoded instead of calculated from actual user data
- **Impact:** Inaccurate predictions for new users
- **Recommendation:** Calculate from BehaviorLog aggregates
- **Estimated Effort:** 2 hours

```typescript
similarUsersBenchmark: 78, // TODO: Calculate from similar users
```

#### P2: AI Tutor Chat History Persistence
- **File:** [apps/api/src/modules/ai-tutor/ai-tutor.service.ts#L105](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/src/modules/ai-tutor/ai-tutor.service.ts#L105)
- **Issue:** Chat history not persisted (memory-only)
- **Impact:** Users lose conversation context on page reload
- **Recommendation:** Store in Redis or BehaviorLog with TTL
- **Estimated Effort:** 6 hours

```typescript
// TODO: Implement with Redis or BehaviorLog
async getChatHistory(userId: string) {
  return []; // No persistence yet
}
```

#### P1: AI Tutor Credit Tracking
- **File:** [apps/api/src/modules/ai-tutor/ai-tutor.service.ts#L111](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/src/modules/ai-tutor/ai-tutor.service.ts#L111)
- **Issue:** No credit deduction or quota enforcement
- **Impact:** Unlimited free API usage (cost risk)
- **Recommendation:** Implement credit system linked to User.subscription
- **Estimated Effort:** 8 hours

```typescript
// TODO: Implement credit tracking
async deductCredits(userId: string, amount: number) {
  // Not implemented
}
```

#### P3: Hardcoded User ID in AI Tutor Controller
- **File:** [apps/api/src/modules/ai-tutor/ai-tutor.controller.ts#L18](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/src/modules/ai-tutor/ai-tutor.controller.ts#L18)
- **Issue:** userId extracted from request body instead of JWT token
- **Impact:** User impersonation vulnerability
- **Recommendation:** Extract from authenticated session
- **Estimated Effort:** 1 hour

```typescript
// TODO: Extract userId from JWT token
const userId = body.userId; // ❌ SECURITY ISSUE
```

#### P2: Vanna Service Vector Search Stub
- **File:** [apps/api/src/modules/ai/vanna.service.ts#L160](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/src/modules/ai/vanna.service.ts#L160)
- **Issue:** Vector search not using DatabaseService (waiting on VED-B7M)
- **Impact:** Suboptimal SQL generation accuracy
- **Recommendation:** Complete VED-B7M and integrate vector search
- **Estimated Effort:** 12 hours (blocked by VED-B7M)

```typescript
// TODO: Replace with DatabaseService vector search once VED-B7M is complete
```

---

### Payment & Nudge Systems

#### P1: Course Access Revocation on Refund
- **File:** [apps/api/src/modules/payment/services/webhook.service.ts#L271](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/src/modules/payment/services/webhook.service.ts#L271)
- **Issue:** Refunds don't automatically revoke course access
- **Impact:** Users keep access after refund (revenue loss)
- **Recommendation:** Implement UserCourse deletion in refund handler
- **Related Bead:** ved-0jl6
- **Estimated Effort:** 4 hours

```typescript
// TODO: Handle course access revocation on refund (ved-0jl6)
```

#### P2: Nudge Engine Missing Course Completion Nudge
- **File:** [apps/api/src/modules/nudge/nudge-engine.service.ts#L106-L107](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/src/modules/nudge/nudge-engine.service.ts#L106-L107)
- **Issue:** Method declared but not implemented
- **Impact:** Missing gamification feature
- **Recommendation:** Implement or remove method
- **Estimated Effort:** 6 hours

```typescript
// FIXME: Method getCourseCompletionNudge not implemented
// TODO: Implement or remove this nudge type
```

---

### Authentication & Authorization

#### P1: Account Lockout Email Notification Missing
- **File:** [apps/api/src/auth/auth.service.ts#L106](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/src/auth/auth.service.ts#L106)
- **Issue:** No email sent when account is locked
- **Impact:** Poor UX - users don't know why they can't log in
- **Recommendation:** Integrate email service
- **Related Bead:** VED-IU3
- **Estimated Effort:** 3 hours

```typescript
// TODO VED-IU3: Send email notification about account lockout
```

---

### Proactive Triggers & Gamification

#### P2: Proactive Triggers Not Implemented
- **File:** [apps/api/src/ai/proactive-triggers.service.ts#L17](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/src/ai/proactive-triggers.service.ts#L17)
- **Issue:** Service stub exists but not implemented
- **Impact:** Missing behavioral engagement features
- **Recommendation:** Implement after UserStreak tracking complete
- **Estimated Effort:** 16 hours

```typescript
/**
 * TODO: Implement after UserStreak tracking is complete
 */
```

#### P3: Missing User Streak Schema Fields
- **File:** [apps/api/src/ai/proactive-triggers.service.ts#L24](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/src/ai/proactive-triggers.service.ts#L24)
- **Issue:** User model missing `lastLoginAt` and `streak` fields
- **Impact:** Cannot track user engagement patterns
- **Recommendation:** Add to Prisma schema and run migration
- **Estimated Effort:** 2 hours (schema) + 4 hours (logic)

```typescript
// FIXME: User model does not have lastLoginAt or streak fields
```

---

## Frontend Technical Debt

### Localization

#### P2: Hardcoded Locale in AI Tutor
- **File:** [apps/web/src/app/[locale]/ai-tutor/page.tsx#L33](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/web/src/app/[locale]/ai-tutor/page.tsx#L33)
- **Issue:** Locale hardcoded to 'vi' instead of using dynamic user preference
- **Impact:** Non-Vietnamese users see Vietnamese AI responses
- **Recommendation:** Extract from route params or user settings
- **Estimated Effort:** 1 hour

```typescript
locale: 'vi', // TODO: Get from user locale
```

---

### Component Architecture

#### P3: ListTodo Icon Usage
- **File:** [apps/web/src/app/[locale]/dashboard/page.tsx#L6, #L118](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/web/src/app/[locale]/dashboard/page.tsx#L6)
- **Issue:** Using `ListTodo` from lucide-react instead of custom icon library
- **Impact:** Inconsistent icon design system
- **Recommendation:** Create custom icon in `@/lib/icons` or standardize on lucide-react
- **Estimated Effort:** 2 hours (if creating custom icon system)

```typescript
import { BookOpen, TrendingUp, Award, Zap, ListTodo, Users } from 'lucide-react';
// ...
<ListTodo className="text-blue-600" size={20} />
```

---

## Infrastructure Technical Debt

### Database Schema

#### P1: VPS Schema Subset vs Full Schema
- **Issue:** VPS production uses subset of schema (no social features)
- **Files Affected:** 
  - [apps/api/prisma/migrations/20251223_add_gin_indexes/](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/prisma/migrations/)
  - SocialPost, BuddyGroup, BuddyChallenge models
- **Impact:** Migrations fail on VPS deployment
- **Recommendation:** Create VPS-specific migration files or use conditional migrations
- **Reference:** [MIGRATION_FIX_PLAN.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/history/vps-deployment/MIGRATION_FIX_PLAN.md)
- **Estimated Effort:** 8 hours

#### P2: Partial Index Migration with NOW() Function
- **Issue:** Migration `20251223_add_partial_indexes` uses `NOW()` function (not IMMUTABLE)
- **Impact:** PostgreSQL rejects index creation
- **Recommendation:** Use fixed timestamp or remove partial indexes
- **Status:** Currently marked as applied via `prisma migrate resolve` (skipped)
- **Estimated Effort:** 4 hours (to fix properly)

#### P3: Non-Standard Migration File
- **File:** [apps/api/prisma/migrations/add_integration_models.sql](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/prisma/migrations/add_integration_models.sql)
- **Issue:** Missing Prisma timestamp prefix (not tracked properly)
- **Impact:** Migration may not be applied on new environments
- **Recommendation:** Rename to Prisma format or document as post-migration script
- **Estimated Effort:** 1 hour

---

### Monitoring & Observability

#### P2: Beszel Agent Restart Loop
- **Issue:** Beszel monitoring agent continuously restarting on VPS
- **Root Cause:** Likely missing HUB_URL environment variable
- **Impact:** Agent metrics unavailable
- **Recommendation:** Update docker-compose.monitoring.yml with correct Beszel hub configuration
- **Estimated Effort:** 2 hours

#### P3: Glances API Endpoint 404
- **Issue:** Health check fails for Glances API endpoint
- **Root Cause:** Incorrect API path (may need `/api/3/all` instead of `/api/3/system`)
- **Impact:** Automated health checks report false negative
- **Recommendation:** Verify correct Glances API path
- **Estimated Effort:** 1 hour

---

### Backup & Recovery

#### P1: R2 Backup Credentials Missing
- **Issue:** Rclone installed but R2 remote not configured
- **Impact:** No automated database backups
- **Recommendation:** Obtain Cloudflare R2 credentials and configure rclone
- **Status:** Blocked pending user input
- **Related Bead:** ved-8yqm
- **Estimated Effort:** 1 hour (after credentials obtained)

---

## Resolution Strategy

### Immediate Actions (P0/P1)

1. **Security Fixes:**
   - [ ] Fix hardcoded userId in AI Tutor controller (1 hour)
   - [ ] Implement R2 presigned URLs (4 hours)
   - [ ] Add account lockout email (3 hours)
   - [ ] Configure R2 backup (1 hour)

2. **Revenue Protection:**
   - [ ] Implement refund access revocation (4 hours)
   - [ ] Add AI Tutor credit tracking (8 hours)

3. **Database Integrity:**
   - [ ] Create VPS-specific migrations (8 hours)
   - [ ] Fix partial index migration (4 hours)

**Total P0/P1 Effort:** ~33 hours (~1 week sprint)

---

### Short-Term Improvements (P2)

1. **AI Features:**
   - [ ] Add chat history persistence (6 hours)
   - [ ] Calculate similar users benchmark (2 hours)
   - [ ] Fix hardcoded locale in AI Tutor (1 hour)

2. **Gamification:**
   - [ ] Implement/remove course completion nudge (6 hours)
   - [ ] Add UserStreak schema fields (6 hours)

3. **Monitoring:**
   - [ ] Fix Beszel agent restart loop (2 hours)
   - [ ] Fix Glances API path (1 hour)

**Total P2 Effort:** ~24 hours (~3-4 days sprint)

---

### Long-Term Enhancements (P3)

1. **Architecture:**
   - [ ] Standardize icon library (2 hours)
   - [ ] Rename non-standard migration file (1 hour)
   - [ ] Implement proactive triggers (16 hours)

**Total P3 Effort:** ~19 hours

---

## Tracking & Metrics

### Current Debt Summary

| Category | P0 | P1 | P2 | P3 | Total |
|----------|----|----|----|----|-------|
| **Backend** | 0 | 6 | 6 | 3 | 15 |
| **Frontend** | 0 | 0 | 1 | 1 | 2 |
| **Infrastructure** | 0 | 1 | 2 | 2 | 5 |
| **TOTAL** | **0** | **7** | **9** | **6** | **22** |

### Total Estimated Effort
- **P0/P1 (Critical):** 33 hours
- **P2 (Important):** 24 hours
- **P3 (Enhancement):** 19 hours
- **GRAND TOTAL:** 76 hours (~2 weeks sprint for critical + important items)

---

## Related Documentation

- [AGENTS.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/AGENTS.md) - Code quality checklist
- [MIGRATION_FIX_PLAN.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/history/vps-deployment/MIGRATION_FIX_PLAN.md) - Database migration troubleshooting
- [runbooks/vps-deployment.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/runbooks/vps-deployment.md) - VPS deployment procedures

---

**Next Review:** 2026-01-19 (bi-weekly cadence)  
**Debt Burn-Down Target:** -50% critical debt by 2026-02-01
