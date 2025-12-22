# 🚀 Quick Start: DatabaseArchitectAgent Implementation

**Task:** VED-AOR - AI Database Architect Agent  
**Estimated Time:** 120 minutes  
**Context:** Database Optimization Phase 2 - Indie Tools

---

## ⚡ 5-Minute Setup

```bash
# 1. Navigate to project
cd "c:/Users/luaho/Demo project/v-edfinance"

# 2. Pull latest changes
git pull --rebase

# 3. Read handoff
cat THREAD_HANDOFF_DATABASE_PHASE2_SESSION3.md

# 4. Verify previous work
cat VED-WF9_COMPLETION_REPORT.md

# 5. Ready to code!
```

---

## 📝 Implementation Checklist

### Phase 1: Core Service (30 min)
- [ ] Create `apps/api/src/database/database-architect.agent.ts`
- [ ] Add `@Injectable()` decorator
- [ ] Inject dependencies (PgvectorService, KyselyService, DatabaseService)
- [ ] Implement basic structure

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PgvectorService } from './pgvector.service';
import { KyselyService } from './kysely.service';
import { DatabaseService } from './database.service';

@Injectable()
export class DatabaseArchitectAgent {
  private readonly logger = new Logger(DatabaseArchitectAgent.name);

  constructor(
    private readonly pgvector: PgvectorService,
    private readonly kysely: KyselyService,
    private readonly database: DatabaseService,
  ) {}

  // Methods go here
}
```

### Phase 2: Heuristic Rules (20 min)
- [ ] Define `HEURISTIC_RULES` constant
- [ ] Implement `applyHeuristicRules(query: string)` method
- [ ] Test with sample queries

```typescript
const HEURISTIC_RULES = [
  {
    pattern: /SELECT \* FROM/i,
    recommendation: "Avoid SELECT *, specify columns",
    estimatedGain: 0.15
  },
  // Add 5-10 rules
];

private applyHeuristicRules(query: string) {
  for (const rule of HEURISTIC_RULES) {
    if (rule.pattern.test(query)) {
      return {
        recommendation: rule.recommendation,
        confidence: 0.8,
        estimatedGain: rule.estimatedGain,
        source: 'heuristic' as const
      };
    }
  }
  return null;
}
```

### Phase 3: RAG Integration (30 min)
- [ ] Implement `findSimilarOptimization(query: string)` method
- [ ] Use PgvectorService for similarity search
- [ ] Handle fallback when no match found

```typescript
async findSimilarOptimization(query: string) {
  const similar = await this.pgvector.findSimilarOptimizations(
    query,
    { threshold: 0.85, limit: 3 }
  );

  if (similar.length === 0) return null;

  return {
    recommendation: similar[0].recommendation,
    confidence: similar[0].similarity,
    estimatedGain: similar[0].performanceGain,
    source: 'rag' as const
  };
}
```

### Phase 4: Main Recommendation Engine (20 min)
- [ ] Implement `generateRecommendation(query: string)` method
- [ ] Combine RAG + Heuristics + Fallback
- [ ] Store new recommendations

```typescript
async generateRecommendation(query: string) {
  // 1. Try RAG first (best quality)
  const rag = await this.findSimilarOptimization(query);
  if (rag && rag.confidence > 0.85) {
    this.logger.debug(`RAG match: ${rag.confidence}`);
    return rag;
  }

  // 2. Try heuristics (fast, reliable)
  const heuristic = this.applyHeuristicRules(query);
  if (heuristic) {
    // Store for future RAG
    await this.storeRecommendation(query, heuristic);
    return heuristic;
  }

  // 3. Generic fallback
  return {
    recommendation: "No specific optimization found. Review query plan with EXPLAIN ANALYZE.",
    confidence: 0.5,
    estimatedGain: 0,
    source: 'generic' as const
  };
}
```

### Phase 5: Query Pattern Analysis (15 min)
- [ ] Implement `analyzeQueryPatterns()` method
- [ ] Use mock data for local development
- [ ] Add pg_stat_statements support for production

```typescript
async analyzeQueryPatterns(since: Date) {
  // For local development, use mock data
  if (process.env.NODE_ENV !== 'production') {
    return this.getMockQueryPatterns();
  }

  // Production: Query pg_stat_statements
  try {
    const patterns = await this.kysely.query
      .selectFrom('pg_stat_statements')
      .select(['query', 'calls', 'mean_exec_time', 'total_exec_time'])
      .where('calls', '>', 100)
      .orderBy('total_exec_time', 'desc')
      .limit(50)
      .execute();

    return patterns.map(p => ({
      queryTemplate: this.normalizeQuery(p.query),
      executionCount: p.calls,
      avgDuration: p.mean_exec_time,
      totalCost: p.total_exec_time,
      lastSeen: new Date()
    }));
  } catch (error) {
    this.logger.warn('pg_stat_statements unavailable, using mock data');
    return this.getMockQueryPatterns();
  }
}

private getMockQueryPatterns() {
  return [
    {
      queryTemplate: "SELECT * FROM \"User\" WHERE email = $1",
      executionCount: 1245,
      avgDuration: 23.5,
      totalCost: 29257,
      lastSeen: new Date()
    },
    // Add 5-10 realistic patterns
  ];
}
```

### Phase 6: Weekly Audit (10 min)
- [ ] Add `@Cron` decorator for weekly execution
- [ ] Implement `runWeeklyAudit()` method
- [ ] Log audit summary

```typescript
@Cron(CronExpression.EVERY_WEEK) // Runs every Sunday at midnight
async runWeeklyAudit() {
  this.logger.log('Starting weekly database audit...');

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const patterns = await this.analyzeQueryPatterns(oneWeekAgo);

  const recommendations = [];
  for (const pattern of patterns) {
    const rec = await this.generateRecommendation(pattern.queryTemplate);
    if (rec.confidence > 0.7) {
      recommendations.push({
        query: pattern.queryTemplate,
        ...rec,
        executionCount: pattern.executionCount,
        avgDuration: pattern.avgDuration
      });
    }
  }

  // Store audit results
  this.logger.log(`Weekly audit complete: ${recommendations.length} recommendations`);
  
  // TODO: Format as Markdown report and store in DB
  return recommendations;
}
```

### Phase 7: Unit Tests (20 min)
- [ ] Create `apps/api/src/database/database-architect.agent.spec.ts`
- [ ] Write 8-10 tests covering all methods
- [ ] Mock all dependencies

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseArchitectAgent } from './database-architect.agent';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('DatabaseArchitectAgent', () => {
  let agent: DatabaseArchitectAgent;
  let mockPgvector: any;
  let mockKysely: any;
  let mockDatabase: any;

  beforeEach(async () => {
    mockPgvector = {
      findSimilarOptimizations: vi.fn(),
    };
    mockKysely = { query: {} };
    mockDatabase = { insertOptimizationLog: vi.fn() };

    const module = await Test.createTestingModule({
      providers: [
        DatabaseArchitectAgent,
        { provide: PgvectorService, useValue: mockPgvector },
        { provide: KyselyService, useValue: mockKysely },
        { provide: DatabaseService, useValue: mockDatabase },
      ],
    }).compile();

    agent = module.get(DatabaseArchitectAgent);
  });

  it('should apply heuristic rules correctly', () => {
    const result = agent['applyHeuristicRules']('SELECT * FROM users');
    expect(result).toBeDefined();
    expect(result.recommendation).toContain('SELECT *');
  });

  // Add 7-9 more tests
});
```

### Phase 8: Module Integration (5 min)
- [ ] Update `apps/api/src/database/database.module.ts`
- [ ] Add DatabaseArchitectAgent to providers
- [ ] Import ScheduleModule

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseService } from './database.service';
import { KyselyModule } from './kysely.module';
import { PgvectorService } from './pgvector.service';
import { DatabaseArchitectAgent } from './database-architect.agent';

@Module({
  imports: [ConfigModule, KyselyModule, ScheduleModule.forRoot()],
  providers: [DatabaseService, PgvectorService, DatabaseArchitectAgent],
  exports: [DatabaseService, PgvectorService, DatabaseArchitectAgent],
})
export class DatabaseModule {}
```

### Phase 9: Quality Gates (10 min)
- [ ] Run tests: `pnpm --filter api test database-architect`
- [ ] Build: `pnpm --filter api build`
- [ ] Lint: `pnpm --filter api lint`
- [ ] Fix any errors

### Phase 10: Commit & Push (5 min)
- [ ] Stage changes: `git add -A`
- [ ] Commit: `git commit -m "feat: Implement DatabaseArchitectAgent (VED-AOR)"`
- [ ] Push: `git push`

---

## 🧪 Testing Commands

```bash
# Run specific test file
pnpm --filter api test database-architect.agent.spec.ts

# Run all database tests
pnpm --filter api test database

# Run with coverage
pnpm --filter api test --coverage

# Build check
pnpm --filter api build
```

---

## 📊 Success Criteria

**Minimum Requirements:**
- ✅ Service compiles without errors
- ✅ 8+ tests passing
- ✅ Heuristic rules working
- ✅ RAG integration functional
- ✅ Weekly audit scheduler configured

**Stretch Goals:**
- 🎯 10+ heuristic rules
- 🎯 Markdown audit report generation
- 🎯 Gemini API fallback for complex queries
- 🎯 Performance benchmarks

---

## 🚨 Common Issues & Solutions

### Issue: @nestjs/schedule not found
```bash
pnpm add @nestjs/schedule --filter api
```

### Issue: Cron not triggering
```typescript
// Make sure ScheduleModule imported in app.module.ts or database.module.ts
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ScheduleModule.forRoot()], // Add this
})
```

### Issue: PgvectorService returning empty results
```typescript
// Check threshold - lower it for testing
const similar = await this.pgvector.findSimilarOptimizations(
  query,
  { threshold: 0.5, limit: 10 } // Lower threshold
);
```

### Issue: pg_stat_statements not available
```typescript
// Use mock data - already handled in spec
if (process.env.NODE_ENV !== 'production') {
  return this.getMockQueryPatterns();
}
```

---

## 📚 Quick Reference

### Heuristic Rule Template
```typescript
{
  pattern: /YOUR_REGEX_HERE/i,
  recommendation: "Your recommendation text",
  estimatedGain: 0.25 // 25% improvement
}
```

### Common SQL Anti-Patterns
- `SELECT *` - Fetch unnecessary columns
- `LIKE '%pattern%'` - Leading wildcard prevents index
- `OR` in WHERE - May prevent index usage
- `N+1 queries` - Use JOIN instead
- Missing indexes on foreign keys
- `COUNT(*)` without WHERE - Full table scan

---

## 🎯 Time Budget Breakdown

| Phase | Time | Status |
|-------|------|--------|
| Core service structure | 30m | ⏳ |
| Heuristic rules | 20m | ⏳ |
| RAG integration | 30m | ⏳ |
| Main recommendation engine | 20m | ⏳ |
| Query pattern analysis | 15m | ⏳ |
| Weekly audit | 10m | ⏳ |
| Unit tests | 20m | ⏳ |
| Module integration | 5m | ⏳ |
| Quality gates | 10m | ⏳ |
| Commit & push | 5m | ⏳ |
| **TOTAL** | **165m** | **Budget: 120m** |

**Buffer:** 45 minutes for debugging/refinement

---

## 🔗 Next Steps After Completion

1. **VED-296:** Optimization Controller (60 min)
2. **VED-G43:** Run First Audit (45 min)
3. **VED-DRX:** VPS Deployment (after VED-6YB unblocked)

---

**Created:** 2025-12-22 18:05  
**Context:** [THREAD_HANDOFF_DATABASE_PHASE2_SESSION3.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/THREAD_HANDOFF_DATABASE_PHASE2_SESSION3.md)  
**Previous Task:** [VED-WF9_COMPLETION_REPORT.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/VED-WF9_COMPLETION_REPORT.md)
