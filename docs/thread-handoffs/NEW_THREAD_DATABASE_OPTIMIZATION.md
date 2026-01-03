# 🚀 New Thread Guide - Database Optimization Phase 2

**Created:** 2025-12-22  
**Status:** ✅ READY FOR NEW THREAD  
**Context:** Database Optimization với Triple-ORM + AI Agent

---

## 📖 Đọc Trước Khi Bắt Đầu (5 phút)

### 1. Context Hiện Tại
- **Progress:** 6/12 tasks completed (50%)
- **Last Completed:** VED-WF9 (PgvectorService) ✅
- **Next Task:** VED-AOR (DatabaseArchitectAgent) 🎯
- **Epic:** Database Optimization with Triple-ORM + AI Database Architect

### 2. Kiến Trúc Triple-ORM (BẮT BUỘC ĐỌC)
**File:** [docs/PRISMA_DRIZZLE_HYBRID_STRATEGY.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/docs/PRISMA_DRIZZLE_HYBRID_STRATEGY.md)

**TL;DR:**
- **Prisma** = Schema migrations ONLY (source of truth)
- **Drizzle** = Fast CRUD operations (65% faster reads, 93% faster batches)
- **Kysely** = Complex analytics & pg_stat_statements queries

**⚠️ GOLDEN RULE:** NEVER run Drizzle migrations - Prisma owns the schema!

### 3. Session Handoff (ĐỌC NGAY)
**File:** [THREAD_HANDOFF_DATABASE_PHASE2_SESSION3.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/THREAD_HANDOFF_DATABASE_PHASE2_SESSION3.md)

---

## ⚡ Quick Start Commands (Copy-Paste)

```bash
# === SESSION INIT (BẮT BUỘC) ===
cd c:/Users/luaho/Demo project/v-edfinance
git pull --rebase
.\beads.exe sync
.\beads.exe doctor
.\beads.exe ready

# === VERIFY ENVIRONMENT ===
# Check previous work
type THREAD_HANDOFF_DATABASE_PHASE2_SESSION3.md | more

# Verify completed tasks
cd apps/api/src/database
dir
# Should see:
# - database.service.ts ✅
# - pgvector.service.ts ✅
# - kysely.service.ts ✅
# - drizzle-schema.ts ✅
# - vanna.service.ts ✅

# Check dependencies
cd apps/api
pnpm list | findstr "drizzle transformers kysely"
# Expected:
# drizzle-orm 0.45.1 ✅
# @xenova/transformers 2.17.2 ✅
# kysely 0.28.9 ✅

# === START TASK VED-AOR ===
.\beads.exe update ved-aor --status in_progress

# Read task spec
type docs\AI_DB_ARCHITECT_TASKS.md | findstr "VED-AI-DB-07" -A 80

# Create agent file
cd apps/api/src/database
# Tạo: database-architect.agent.ts
# Tạo: database-architect.agent.spec.ts
```

---

## 🎯 Nhiệm Vụ Tiếp Theo: VED-AOR (DatabaseArchitectAgent)

### Mô Tả
AI Agent tự động phân tích performance database và tạo optimization recommendations.

### Deliverables
1. **DatabaseArchitectAgent** service class
2. **Query pattern analysis** (uses Kysely for pg_stat_statements)
3. **RAG-based optimization** (uses PgvectorService for similarity search)
4. **Heuristic rules engine** (fallback khi không có RAG match)
5. **Weekly audit scheduler** (Cron job)
6. **8-10 unit tests**

### Estimated Time
**120 minutes**

### Key Features

#### 1. Query Pattern Analysis
```typescript
interface QueryPattern {
  queryTemplate: string;      // Normalized query
  executionCount: number;     // Số lần chạy
  avgDuration: number;        // Thời gian trung bình
  totalCost: number;          // Estimated cost
  lastSeen: Date;
}

// Method
async analyzeQueryPatterns(since: Date): Promise<QueryPattern[]>
```

**Data Sources:**
- **Production:** `pg_stat_statements` via KyselyService
- **Development:** Mock data từ BehaviorLog

#### 2. RAG-Based Optimization
```typescript
interface OptimizationRecommendation {
  queryPattern: string;
  recommendation: string;
  confidence: number;         // 0-1 based on vector similarity
  estimatedGain: number;      // % improvement estimate
  source: 'rag' | 'heuristic' | 'ai';
}

// Workflow:
// 1. Generate embedding cho query (PgvectorService)
// 2. Find similar optimizations (threshold: 0.85)
// 3. If found: Return cached recommendation (RAG)
// 4. If not: Apply heuristic rules
// 5. Store optimization cho future RAG
```

#### 3. Heuristic Rules Engine
```typescript
const HEURISTIC_RULES = [
  {
    pattern: /SELECT \* FROM/i,
    recommendation: "Avoid SELECT *, specify columns",
    estimatedGain: 0.15
  },
  {
    pattern: /WHERE.*LIKE '%.*%'/i,
    recommendation: "Leading wildcard prevents index usage",
    estimatedGain: 0.40
  },
  // ... 10+ rules
];
```

#### 4. Weekly Audit Scheduler
```typescript
@Cron(CronExpression.EVERY_WEEK)
async runWeeklyAudit() {
  const patterns = await this.analyzeQueryPatterns(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );
  
  const recommendations = [];
  for (const pattern of patterns) {
    const rec = await this.generateRecommendation(pattern.queryTemplate);
    if (rec.confidence > 0.7) {
      recommendations.push(rec);
    }
  }
  
  await this.storeAuditReport(recommendations);
  this.logger.log(`Weekly audit: ${recommendations.length} recommendations`);
}
```

---

## 🔧 Service Integration

### 1. PgvectorService (VED-WF9) ✅
```typescript
// RAG lookup
const similar = await this.pgvectorService.findSimilarOptimizations(
  queryPattern,
  { threshold: 0.85, limit: 3 }
);

if (similar.length > 0) {
  return {
    recommendation: similar[0].recommendation,
    confidence: similar[0].similarity,
    source: 'rag'
  };
}
```

**File:** [apps/api/src/database/pgvector.service.ts](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/src/database/pgvector.service.ts)

### 2. KyselyService (Existing) ✅
```typescript
// Query pg_stat_statements
const stats = await this.kysely.query
  .selectFrom('pg_stat_statements')
  .select(['query', 'calls', 'mean_exec_time', 'total_exec_time'])
  .where('calls', '>', 100)
  .orderBy('total_exec_time', 'desc')
  .limit(50)
  .execute();
```

**File:** [apps/api/src/database/kysely.service.ts](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/src/database/kysely.service.ts)

### 3. DatabaseService (VED-ASV) ✅
```typescript
// Store recommendations
await this.databaseService.insertOptimizationLog({
  queryText: pattern.queryTemplate,
  recommendation: rec.recommendation,
  performanceGain: rec.estimatedGain,
  confidence: rec.confidence,
  metadata: { source: rec.source, auditDate: new Date() }
});
```

**File:** [apps/api/src/database/database.service.ts](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/src/database/database.service.ts)

---

## 🧪 Testing Strategy

### Unit Tests (8-10 tests)
```typescript
describe('DatabaseArchitectAgent', () => {
  // Pattern analysis
  it('should analyze query patterns from pg_stat_statements');
  it('should normalize similar queries into patterns');
  it('should calculate total cost correctly');
  
  // RAG optimization
  it('should find cached recommendations via PgvectorService');
  it('should apply heuristic rules when no RAG match');
  it('should store new recommendations for future RAG');
  
  // Audit workflow
  it('should generate weekly audit report');
  it('should filter low-confidence recommendations');
  it('should handle empty query patterns gracefully');
  
  // Edge cases
  it('should handle pg_stat_statements unavailable');
});
```

---

## 💡 Implementation Tips

### 1. Start with Heuristics First
Xây heuristic rules engine trước (đơn giản nhất, không cần external deps):
```typescript
async generateRecommendation(query: string) {
  // 1. Try heuristics (always works)
  const heuristic = this.applyHeuristicRules(query);
  if (heuristic) return heuristic;
  
  // 2. Try RAG (needs PgvectorService)
  const rag = await this.findSimilarOptimization(query);
  if (rag && rag.similarity > 0.85) return rag;
  
  // 3. Fallback
  return this.getGenericRecommendation();
}
```

### 2. Mock pg_stat_statements for Local
```typescript
private getMockQueryPatterns(): QueryPattern[] {
  return [
    {
      queryTemplate: "SELECT * FROM \"User\" WHERE email = $1",
      executionCount: 1245,
      avgDuration: 23.5,
      totalCost: 29257,
      lastSeen: new Date()
    },
    // Top 10 patterns
  ];
}
```

### 3. Use Injectable Pattern
```typescript
@Injectable()
export class DatabaseArchitectAgent {
  constructor(
    private readonly pgvector: PgvectorService,
    private readonly kysely: KyselyService,
    private readonly database: DatabaseService,
  ) {}
}
```

### 4. Add to database.module.ts
```typescript
import { DatabaseArchitectAgent } from './database-architect.agent';

@Module({
  providers: [
    // ... existing providers
    DatabaseArchitectAgent,
  ],
  exports: [DatabaseArchitectAgent],
})
export class DatabaseModule {}
```

---

## 📊 Success Criteria

### Functional Requirements
- [ ] Agent can analyze query patterns (real or mocked)
- [ ] RAG lookup works via PgvectorService
- [ ] Heuristic rules apply correctly
- [ ] Weekly audit scheduler configured
- [ ] 8-10 tests passing
- [ ] Integration with all database services verified

### Performance Targets
- Pattern analysis: <2s for 100 queries
- RAG lookup: <100ms per query
- Heuristic matching: <10ms per query
- Weekly audit: <5 min for 1000 queries

### Quality Gates
- [ ] Build passes: `pnpm --filter api build`
- [ ] All tests pass: `pnpm test database-architect`
- [ ] No TypeScript errors
- [ ] Proper error handling
- [ ] Comprehensive logging

---

## 🚧 Known Blockers & Workarounds

### VED-6YB: Pgvector Extension (LOW IMPACT)
**Status:** 🔴 BLOCKED - Manual VPS access needed  
**Workaround:** PgvectorService fallback mode (in-memory search)  
**Impact:** LOW - Only affects production vector search performance

### VED-Y1U: pg_stat_statements (MEDIUM IMPACT)
**Status:** 🟡 PENDING - Can mock for development  
**Workaround:** Use mock query patterns from BehaviorLog  
**Impact:** MEDIUM - Real stats needed for production value

---

## 📈 Progress Tracker

| ID | Task | Status | Dependencies |
|----|------|--------|--------------|
| VED-8A5 | Install Drizzle | ✅ DONE | None |
| VED-AHY | Drizzle Schema | ✅ DONE | VED-8A5 |
| VED-B7M | OptimizationLog | ✅ DONE | VED-AHY |
| VED-ASV | DatabaseService | ✅ DONE | VED-AHY |
| VED-7P4 | VannaService | ✅ DONE | VED-B7M |
| VED-WF9 | PgvectorService | ✅ DONE | VED-7P4 |
| **VED-AOR** | **DB Architect Agent** | 🎯 **NEXT** | **VED-WF9** |
| VED-296 | Optimization Controller | ⏳ WAITING | VED-AOR |
| VED-6YB | Enable Pgvector | 🔴 BLOCKED | Manual VPS |
| VED-DRX | VPS Deployment | ⏳ WAITING | VED-6YB |
| VED-Y1U | pg_stat_statements | 🟡 PENDING | VPS access |
| VED-G43 | First Audit | ⏳ WAITING | VED-AOR |

**Progress:** 6/12 tasks (50%)  
**Estimated Remaining:** ~6 hours

---

## 📚 Key References (ĐỌC THEO THỨ TỰ)

### Must Read
1. **[THREAD_HANDOFF_DATABASE_PHASE2_SESSION3.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/THREAD_HANDOFF_DATABASE_PHASE2_SESSION3.md)** - Session handoff ⭐
2. **[docs/PRISMA_DRIZZLE_HYBRID_STRATEGY.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/docs/PRISMA_DRIZZLE_HYBRID_STRATEGY.md)** - Triple-ORM architecture
3. **[docs/AI_DB_ARCHITECT_TASKS.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/docs/AI_DB_ARCHITECT_TASKS.md)** - Lines 275-320 (VED-AI-DB-07 spec)

### Completion Reports
- **[VED-WF9_COMPLETION_REPORT.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/VED-WF9_COMPLETION_REPORT.md)** - PgvectorService (previous task)
- **[VED-7P4_COMPLETION_REPORT.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/VED-7P4_COMPLETION_REPORT.md)** - VannaService

### Service Files
- [apps/api/src/database/pgvector.service.ts](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/src/database/pgvector.service.ts)
- [apps/api/src/database/kysely.service.ts](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/src/database/kysely.service.ts)
- [apps/api/src/database/database.service.ts](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/src/database/database.service.ts)
- [apps/api/src/database/drizzle-schema.ts](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/src/database/drizzle-schema.ts)

---

## 🔐 Session End Protocol (MANDATORY)

```bash
# === BEFORE ENDING SESSION ===
# 1. Run tests
cd apps/api
pnpm test database-architect.agent.spec.ts

# 2. Quality gates
pnpm --filter api build
pnpm --filter api lint

# 3. Update beads
cd ../..
.\beads.exe close ved-aor --reason "DatabaseArchitectAgent complete: RAG + Heuristics + Weekly Audit (8 tests passing)"

# 4. Beads sync
.\beads.exe sync

# 5. Commit
git add -A
git commit -m "feat: Implement DatabaseArchitectAgent with RAG + Heuristics (VED-AOR)"

# 6. PUSH (MANDATORY)
git pull --rebase
git push
git status  # Must show "up to date with origin"

# 7. Verify
.\beads.exe doctor
```

---

## 🎬 Alternative Path (If Too Complex)

If VED-AOR quá phức tạp, consider **VED-296** (Optimization Controller):

**Why:** REST API endpoints (không có AI complexity)  
**Time:** 60 minutes  
**Pros:** Direct business value, no VPS dependencies  
**Cons:** Doesn't complete autonomous optimization story

---

## ✅ Pre-Flight Checklist

Trước khi bắt đầu thread mới:

- [ ] Đọc THREAD_HANDOFF_DATABASE_PHASE2_SESSION3.md
- [ ] Hiểu Triple-ORM architecture (Prisma/Drizzle/Kysely)
- [ ] `git pull --rebase` (working tree clean)
- [ ] `.\beads.exe sync` (no pending issues)
- [ ] `.\beads.exe doctor` (all systems green)
- [ ] Verified dependencies installed
- [ ] Đọc VED-WF9_COMPLETION_REPORT.md (previous task)

---

## 🚀 Ready to Start?

**Paste vào thread mới:**
```
Implement DatabaseArchitectAgent (VED-AOR) theo guide trong NEW_THREAD_DATABASE_OPTIMIZATION.md

Context: 6/12 tasks complete, Triple-ORM stack ready, PgvectorService ready for RAG.

Start with: Read THREAD_HANDOFF_DATABASE_PHASE2_SESSION3.md
```

---

**Created:** 2025-12-22  
**Status:** ✅ READY  
**Next:** VED-AOR (120 min)  
**Epic:** Database Optimization Phase 2
