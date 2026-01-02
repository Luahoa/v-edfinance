# 📊 Resource Allocation Matrix - V-EdFinance Project

**Epic:** ved-5ti - Project Analysis & Work Breakdown  
**Version:** 1.0  
**Date:** 2026-01-03  
**Total Effort:** ~280 hours (7-8 weeks)

---

## Team Structure & Skills Mapping

### Available Resources

| Team | Size | Skills | Availability |
|------|------|--------|--------------|
| **AI Agents (Amp)** | 100+ | Full-stack, any language | 24/7 |
| **Frontend Team** | 3 agents | React, Next.js, TypeScript | Week 3-6 |
| **Backend Team** | 4 agents | NestJS, Prisma, PostgreSQL | Week 1-8 |
| **AI/ML Team** | 2 agents | Gemini API, Vector DB, ML | Week 5-7 |
| **DevOps Team** | 2 agents | Docker, Dokploy, Monitoring | Week 7-8 |
| **QA Team** | 3 agents | Testing, E2E, Performance | Week 1-8 |

**Note:** All "agents" are AI-powered autonomous workers (Amp agents)

---

## Phase 1: Quality Gate & Zero-Debt Engineering

**Duration:** 1-2 weeks (Jan 6-19, 2026)  
**Total Effort:** 40 hours  
**Owner:** Backend + QA Teams

### Task Breakdown

| Task | Hours | Owner | Dependencies | Deliverable |
|------|-------|-------|--------------|-------------|
| **Schema Sync Verification** | 4h | Backend Agent 1 | - | ✅ Drizzle check pass |
| **Type Safety Refactor** | 8h | Backend Agent 2 | - | ✅ Zero `any` types |
| **Performance Benchmarking** | 8h | QA Agent 1 | Schema sync | Baseline + 30% report |
| **Quality Gate Script** | 12h | Backend Agent 3 | All above | `scripts/quality-gate.sh` |
| **CI/CD Integration** | 4h | DevOps Agent 1 | Quality script | GitHub Actions workflow |
| **Documentation** | 4h | Backend Agent 4 | All above | `QUALITY_GATE_STANDARDS.md` |

### Resource Assignment

```yaml
Week 1-2 (Phase 1):
  Backend Team:
    - Agent 1: Schema validation
    - Agent 2: Type safety
    - Agent 3: Quality automation
    - Agent 4: Documentation
  
  QA Team:
    - Agent 1: Performance benchmarks
    - Agent 2: Test suite review
  
  DevOps Team:
    - Agent 1: CI/CD setup
```

### Critical Path
```
Schema Sync (4h) → Performance Benchmark (8h) → Quality Script (12h) → CI/CD (4h)
                                                                     ↓
                                               Type Safety (8h) ----→ Docs (4h)
```

**Total:** 40 hours (~1.5 weeks with parallel work)

---

## Phase 2: Core Frontend & Authentication UI

**Duration:** 2-3 weeks (Jan 20 - Feb 9, 2026)  
**Total Effort:** 80 hours  
**Owner:** Frontend + Backend Teams

### Task Breakdown

| Task | Hours | Owner | Dependencies | Deliverable |
|------|-------|-------|--------------|-------------|
| **Fix Web Build (lucide-react)** | 1h | Frontend Agent 1 | - | ✅ Build passing |
| **Auth Pages (Login/Register)** | 16h | Frontend Agent 1 | Build fix | 3 pages + forms |
| **Dashboard Layout** | 20h | Frontend Agent 2 | Auth pages | Dashboard + components |
| **Course Listing** | 16h | Frontend Agent 3 | Dashboard | Grid + search |
| **Course Detail Page** | 12h | Frontend Agent 3 | Listing | Detail + enrollment |
| **i18n Translation** | 8h | Frontend Agent 2 | All pages | vi/en/zh coverage |
| **E2E Tests (Playwright)** | 12h | QA Agent 2 | All pages | 15+ test scenarios |
| **Performance Optimization** | 8h | Frontend Agent 1 | E2E tests | Lighthouse 90+ |
| **API Integration** | 8h | Backend Agent 1 | Auth pages | JWT + endpoints |

### Resource Assignment

```yaml
Week 3-4 (Phase 2):
  Frontend Team:
    - Agent 1: Build fix → Auth pages → Performance
    - Agent 2: Dashboard → i18n
    - Agent 3: Course pages
  
  Backend Team:
    - Agent 1: API integration
  
  QA Team:
    - Agent 2: E2E test suite
```

### Critical Path
```
Build Fix (1h) → Auth Pages (16h) → Dashboard (20h) → E2E Tests (12h)
                              ↓
                    Course Pages (28h) → i18n (8h) → Performance (8h)
```

**Total:** 80 hours (~2.5 weeks with parallel work)

---

## Phase 3: Behavioral UX & Learning Engine

**Duration:** 2-3 weeks (PARALLEL with Phase 2: Jan 20 - Feb 9)  
**Total Effort:** 72 hours  
**Owner:** Backend + ML Teams

### Task Breakdown

| Task | Hours | Owner | Dependencies | Deliverable |
|------|-------|-------|--------------|-------------|
| **Nudge Engine Core** | 20h | Backend Agent 2 | - | NudgeService |
| **Learning Analytics** | 16h | Backend Agent 3 | - | AnalyticsService (Kysely) |
| **Lesson Player API** | 12h | Backend Agent 4 | Nudge engine | Progress tracking |
| **Redis Caching Layer** | 8h | Backend Agent 2 | Analytics | RedisService |
| **WebSocket Integration** | 12h | Backend Agent 3 | Nudge engine | Real-time nudges |
| **Load Testing Setup** | 8h | QA Agent 3 | Redis | Vegeta scripts |
| **Stress Test Execution** | 4h | QA Agent 3 | Load setup | 1000 user report |
| **Performance Tuning** | 8h | Backend Agent 4 | Stress test | p95 <200ms |

### Resource Assignment

```yaml
Week 3-4 (Phase 3 - PARALLEL):
  Backend Team:
    - Agent 2: Nudge engine → Redis
    - Agent 3: Analytics → WebSocket
    - Agent 4: Lesson API → Tuning
  
  QA Team:
    - Agent 3: Load tests + stress tests
```

### Critical Path
```
Nudge Engine (20h) → WebSocket (12h) → Load Test (8h) → Stress Test (4h)
                  ↓
    Analytics (16h) → Redis (8h) ------→ Performance Tuning (8h)
```

**Total:** 72 hours (~2.5 weeks with parallel work)

---

## Phase 4: AI Personalization & Social Learning

**Duration:** 2-3 weeks (Feb 10 - Feb 28, 2026)  
**Total Effort:** 64 hours  
**Owner:** AI/ML + Backend Teams

### Task Breakdown

| Task | Hours | Owner | Dependencies | Deliverable |
|------|-------|-------|--------------|-------------|
| **Gemini API Integration** | 16h | AI Agent 1 | - | GeminiService |
| **Local Embeddings (PgvectorService)** | 12h | AI Agent 2 | - | VectorService |
| **Recommendation Engine** | 20h | AI Agent 1 | Embeddings | Hybrid recommender |
| **Buddy Groups Backend** | 12h | Backend Agent 2 | - | SocialService |
| **Social Feed API** | 8h | Backend Agent 2 | Buddy groups | FeedService |
| **AI Database Architect** | 16h | AI Agent 2 | Embeddings | ArchitectAgent |
| **Social Frontend** | 12h | Frontend Agent 2 | Social API | Social pages |
| **Staging Deployment** | 4h | DevOps Agent 2 | All above | Dokploy staging |
| **Integration Testing** | 8h | QA Agent 2 | Staging | E2E AI scenarios |

### Resource Assignment

```yaml
Week 5-6 (Phase 4):
  AI/ML Team:
    - Agent 1: Gemini → Recommendations
    - Agent 2: Embeddings → AI Architect
  
  Backend Team:
    - Agent 2: Social features
  
  Frontend Team:
    - Agent 2: Social UI
  
  DevOps Team:
    - Agent 2: Staging deploy
  
  QA Team:
    - Agent 2: Integration tests
```

### Critical Path
```
Gemini (16h) → Recommendations (20h) → Integration Test (8h)
            ↓
  Embeddings (12h) → AI Architect (16h) → Staging Deploy (4h)
                   ↓
       Social Backend (20h) → Social Frontend (12h)
```

**Total:** 64 hours (~2.5 weeks with parallel work)

---

## Phase 5: Infrastructure & Production Stress Test

**Duration:** 1-2 weeks (Mar 1-14, 2026)  
**Total Effort:** 48 hours  
**Owner:** DevOps + QA Teams

### Task Breakdown

| Task | Hours | Owner | Dependencies | Deliverable |
|------|-------|-------|--------------|-------------|
| **VPS Production Setup** | 12h | DevOps Agent 1 | - | Dokploy production |
| **Monitoring Dashboards** | 8h | DevOps Agent 2 | VPS setup | Grafana + Prometheus |
| **Backup Automation** | 8h | DevOps Agent 1 | VPS setup | Daily backups script |
| **SSL & Security** | 4h | DevOps Agent 2 | VPS setup | A+ SSL rating |
| **Production Stress Test** | 8h | QA Agent 1 | Monitoring | 5000 user test |
| **Disaster Recovery Drill** | 4h | DevOps Agent 1 | Backup | Restore test |
| **Security Audit** | 8h | Backend Agent 3 | SSL | Vulnerability scan |
| **Production Launch** | 4h | DevOps Agent 2 | All above | Go-live checklist |

### Resource Assignment

```yaml
Week 7-8 (Phase 5):
  DevOps Team:
    - Agent 1: VPS → Backup → DR drill
    - Agent 2: Monitoring → SSL → Launch
  
  QA Team:
    - Agent 1: Stress testing
  
  Backend Team:
    - Agent 3: Security audit
```

### Critical Path
```
VPS Setup (12h) → Monitoring (8h) → Stress Test (8h) → Launch (4h)
              ↓
  Backup (8h) → DR Drill (4h) → Security Audit (8h)
```

**Total:** 48 hours (~1.5 weeks with parallel work)

---

## Resource Utilization Summary

### Total Effort by Team

| Team | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 | **Total** |
|------|---------|---------|---------|---------|---------|-----------|
| **Backend** | 24h | 8h | 56h | 12h | 8h | **108h** |
| **Frontend** | - | 64h | - | 12h | - | **76h** |
| **AI/ML** | - | - | - | 44h | - | **44h** |
| **DevOps** | 4h | - | - | 4h | 36h | **44h** |
| **QA** | 12h | 12h | 12h | 8h | 8h | **52h** |
| **TOTAL** | **40h** | **84h** | **68h** | **80h** | **52h** | **324h** |

### Parallel Work Efficiency

- **Week 1-2 (Phase 1):** 40h → 1.5 weeks (sequential)
- **Week 3-4 (Phase 2+3):** 152h → 2.5 weeks (parallel: 80h + 72h / 3 teams)
- **Week 5-6 (Phase 4):** 80h → 2.5 weeks (parallel: 4 teams)
- **Week 7-8 (Phase 5):** 52h → 1.5 weeks (parallel: 2 teams)

**Total Calendar Time:** 8 weeks  
**Total Effort:** 324 hours  
**Efficiency:** 41% (324h / 8w / 100 agents) - room for more parallelization

---

## Risk Mitigation & Buffer

### High-Risk Tasks (Add 20% buffer)

| Task | Base Estimate | Buffer | Total |
|------|---------------|--------|-------|
| **Gemini API Integration** | 16h | 3.2h | **19.2h** |
| **Recommendation Engine** | 20h | 4h | **24h** |
| **Production Stress Test** | 8h | 1.6h | **9.6h** |
| **AI Database Architect** | 16h | 3.2h | **19.2h** |

**Total Buffer:** ~12 hours (embedded in timeline)

### Contingency Plan

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Gemini API quota limit** | Medium | High | Use local LLM fallback |
| **VPS performance issues** | Low | Medium | Scale vertically (more RAM) |
| **Frontend complexity explosion** | High | Low | Simplify UI, defer features |
| **Database migration issues** | Low | High | Keep Prisma as backup |

---

## Next Steps

1. **Assign Agents:** Map specific Amp agents to tasks (Week 1)
2. **Kick-off Phase 1:** Start quality gate immediately (Jan 6)
3. **Parallel Planning:** Frontend team prepares during Phase 1
4. **Weekly Sync:** Friday status updates (Beads dashboard)
5. **Adjust Resources:** Reallocate based on velocity (weekly)

---

**Status:** 🟢 READY FOR EXECUTION  
**Total Effort:** 324 hours (8 weeks)  
**Teams:** 6 specialized teams (100+ agents available)  
**Risk Level:** 🟡 MEDIUM (mitigated with buffers)
