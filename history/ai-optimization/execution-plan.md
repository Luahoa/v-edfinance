# Execution Plan: AI System Optimization

**Epic:** AI Smart Extensions Enhancement  
**Generated:** 2026-01-03  
**Orchestrator:** CoralReef (main coordinator)  
**Status:** 🟢 READY FOR WORKER SPAWN

---

## Tracks Overview

| Track | Agent | Beads (in order) | File Scope | Can Start |
|-------|-------|------------------|------------|-----------|
| 0 | **SpikeTeam** | spike-1 → spike-2 | `.spikes/**` | ✅ Now |
| 1 | **RedStone** | bd-11 → bd-12 | `ai/metrics.service.ts` (NEW) | After spike-2 |
| 2 | **BlueLake** | bd-21 | `ai/rag-adapter.service.ts` (NEW) | After spike-2 |
| 3 | **GreenMist** | bd-51 → bd-52 | `nudge/**`, `ai/proactive-triggers.service.ts` | ✅ Now |
| 4 | **GoldPeak** | bd-12 → bd-22 → bd-31 → bd-32 → bd-41 | `ai/ai.service.ts`, `database/pgvector.service.ts` | After Tracks 1,2 |
| 5 | **IronClaw** | bd-61 → bd-62 → bd-63 | `**/*.spec.ts`, `**/test/**` | After Tracks 3,4 |

**Parallelism:** 3 tracks can run simultaneously (Tracks 0, 3, and after spikes: 1+2)  
**Critical Path:** Track 0 → Track 4 → Track 5 (15 hours work time)

---

## Track 0: SpikeTeam - HIGH Risk Validation

**Agent:** SpikeTeam  
**File Scope:** `.spikes/ai-optimization/**`  
**Purpose:** Validate 2 HIGH risk items before main implementation

### Beads

#### spike-1: Semantic Similarity Threshold Testing
**Time-box:** 2 hours  
**Status:** 🔴 Not Started  
**Priority:** P0 (blocks Track 4, Task 3.2)

**Question:**  
What pgvector cosine similarity threshold (0.80? 0.85? 0.90?) gives optimal cache hit rate without false positives?

**Test Method:**
1. Create 10 query pairs:
   - Pair 1: "Lãi suất kép là gì?" ↔ "Compound interest là gì?" (should match)
   - Pair 2: "Lãi suất kép là gì?" ↔ "Portfolio risk là gì?" (should NOT match)
   - ... (8 more pairs)
2. Generate embeddings for all queries
3. Compute cosine similarity for each pair
4. Test thresholds: [0.80, 0.85, 0.88, 0.90, 0.92]
5. Calculate: cache hit rate, false positive rate

**Success Criteria:**
- [ ] Recommended threshold value with reasoning
- [ ] False positive rate <5%
- [ ] Simulated cache hit rate >60%
- [ ] Test code in `.spikes/ai-optimization/semantic-cache-threshold/test.ts`

**Output:**
```typescript
// .spikes/ai-optimization/semantic-cache-threshold/findings.md
## Findings
- Recommended threshold: 0.85
- Reasoning: ...
- Cache hit rate (simulated): 68%
- False positive rate: 3%
```

**Deliverable:** Close with `bd close spike-1 --reason "Threshold: 0.85 recommended"`

---

#### spike-2: Drizzle-Prisma Adapter Transaction Safety
**Time-box:** 1 hour  
**Status:** 🔴 Not Started  
**Priority:** P0 (blocks Track 2, Task 2.1)

**Question:**  
Can AiService (Prisma) safely read pgvector data (Drizzle ORM) without transaction isolation issues?

**Test Code:**
```typescript
// .spikes/ai-optimization/orm-adapter/test-cross-orm.ts

import { PrismaService } from '@/prisma/prisma.service';
import { PgvectorService } from '@/database/pgvector.service';

async function testCrossORMReads() {
  const prisma = new PrismaService();
  const pgvector = new PgvectorService();
  
  // Test 1: Read Drizzle data outside Prisma TX (should work)
  const similar1 = await pgvector.findSimilarOptimizations(...);
  console.log('✅ Test 1 passed');
  
  // Test 2: Read Drizzle data inside Prisma TX context
  await prisma.$transaction(async (tx) => {
    const similar2 = await pgvector.findSimilarOptimizations(...);
    // Does this work or throw TX error?
    console.log('✅ Test 2 passed (or ❌ if error)');
  });
  
  // Test 3: Concurrent reads (AiService calls pgvector while Prisma TX active)
  const promise1 = prisma.$transaction(async (tx) => { /* ... */ });
  const promise2 = pgvector.findSimilarOptimizations(...);
  await Promise.all([promise1, promise2]);
  console.log('✅ Test 3 passed - no deadlock');
}
```

**Success Criteria:**
- [ ] Read-only Drizzle queries work from Prisma context
- [ ] No transaction deadlocks observed
- [ ] Documented safe patterns for RAG adapter

**Output:**
```typescript
// .spikes/ai-optimization/orm-adapter/findings.md
## Findings
- Safe to read Drizzle data from Prisma TX context: YES/NO
- Recommended pattern: 
  ```typescript
  // SAFE:
  const ragData = await this.pgvector.findSimilar(...);
  
  // UNSAFE: (if applicable)
  // ...
  ```
```

**Deliverable:** Close with `bd close spike-2 --reason "SAFE: Read-only pattern documented"`

---

## Track 1: RedStone - Observability Foundation

**Agent:** RedStone  
**File Scope:** `apps/api/src/ai/metrics.service.ts` (NEW)  
**Can Start:** After spike-2 completes  
**Purpose:** Create metrics infrastructure (no dependencies on other tracks)

### Beads

#### bd-11: Create AiMetricsService
**Estimate:** 4 hours  
**Status:** 🔴 Not Started  
**Priority:** P1  
**Dependencies:** spike-2 (to verify no ORM conflicts)

**Requirements:**
```typescript
// apps/api/src/ai/metrics.service.ts (NEW FILE - 40 lines)

import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge } from 'prom-client';

@Injectable()
export class AiMetricsService {
  private latencyHistogram = new Histogram({
    name: 'ai_response_latency_seconds',
    help: 'AI response time',
    buckets: [0.5, 1, 2, 3, 5, 10],
  });
  
  private tokenCounter = new Counter({
    name: 'ai_tokens_used_total',
    help: 'Total tokens consumed',
    labelNames: ['intent'],
  });
  
  private cacheHitRate = new Gauge({
    name: 'ai_cache_hit_rate',
    help: 'RAG cache hit rate (0-1)',
  });
  
  recordLatency(durationMs: number) {
    this.latencyHistogram.observe(durationMs / 1000);
  }
  
  recordTokens(count: number, intent: string) {
    this.tokenCounter.inc({ intent }, count);
  }
  
  recordCacheHit(hit: boolean) {
    // Update gauge with rolling average
  }
}
```

**Acceptance Criteria:**
- [ ] Service exports 3 metrics (latency, tokens, cache)
- [ ] Injectable via NestJS DI
- [ ] Unit test: `metrics.service.spec.ts` with 80% coverage
- [ ] `/api/metrics` endpoint returns Prometheus format

**Testing:**
```bash
curl http://localhost:3001/metrics | grep ai_
# Should see:
# ai_response_latency_seconds_count
# ai_tokens_used_total
# ai_cache_hit_rate
```

**Deliverable:** Close with `bd close bd-11 --reason "Metrics service created, 3 metrics exposed"`

---

#### bd-12: Integrate Metrics into AiService (MOVED TO TRACK 4)
*This task moved to Track 4 (GoldPeak) because it modifies ai.service.ts*

---

## Track 2: BlueLake - RAG Foundation

**Agent:** BlueLake  
**File Scope:** `apps/api/src/ai/rag-adapter.service.ts` (NEW)  
**Can Start:** After spike-2 completes  
**Purpose:** Create Drizzle↔Prisma adapter (isolated, no dependencies)

### Beads

#### bd-21: Create RAG Adapter Service
**Estimate:** 3 hours  
**Status:** 🔴 Not Started  
**Priority:** P1  
**Dependencies:** spike-2

**Context from Spike 2:**
```markdown
## Learnings from spike-2
- Safe read pattern: (will paste findings here after spike completes)
- Example code: .spikes/ai-optimization/orm-adapter/test-cross-orm.ts
```

**Requirements:**
```typescript
// apps/api/src/ai/rag-adapter.service.ts (NEW FILE - 30 lines)

export interface RAGContext {
  sources: Array<{ title: string; content: string; similarity: number }>;
  combinedText: string;
}

@Injectable()
export class RagAdapterService {
  constructor(private pgvector: PgvectorService) {}
  
  async getRelevantContext(query: string): Promise<RAGContext> {
    const embedding = await this.pgvector.generateEmbedding(query);
    const similar = await this.pgvector.findSimilarOptimizations(embedding, {
      threshold: 0.75,
      limit: 3,
    });
    
    return {
      sources: similar.map(s => ({
        title: s.queryText || 'Untitled',
        content: s.recommendation || '',
        similarity: s.similarity,
      })),
      combinedText: similar
        .map(s => `[Source: ${s.queryText}]\n${s.recommendation}`)
        .join('\n\n'),
    };
  }
}
```

**Acceptance Criteria:**
- [ ] Service returns RAGContext interface
- [ ] Uses safe Drizzle read pattern (from spike-2)
- [ ] Unit test with mocked pgvector service (80% coverage)
- [ ] Integration test: retrieves real docs from DB

**Testing:**
```typescript
// Test: Retrieve relevant context
const context = await ragAdapter.getRelevantContext('compound interest');
expect(context.sources.length).toBeGreaterThan(0);
expect(context.sources[0].title).toContain('interest');
```

**Deliverable:** Close with `bd close bd-21 --reason "RAG adapter created, safe Drizzle reads verified"`

---

## Track 3: GreenMist - Behavioral AI Enhancement

**Agent:** GreenMist  
**File Scope:** `apps/api/src/modules/nudge/**`, `apps/api/src/ai/proactive-triggers.service.ts`  
**Can Start:** ✅ Now (no dependencies)  
**Purpose:** AI-powered nudge variants + proactive triggers (independent track)

### Beads

#### bd-51: AI Nudge Variant Generator
**Estimate:** 6 hours  
**Status:** 🔴 Not Started  
**Priority:** P1  
**Dependencies:** None

**Requirements:**
```typescript
// apps/api/src/modules/nudge/nudge-engine.service.ts (ENHANCE EXISTING)

export class NudgeEngineService {
  constructor(
    private prisma: PrismaService,
    private analytics: AnalyticsService,
    private aiService: AiService, // ✅ ADD THIS
  ) {}
  
  async generateNudge(userId, context, data) {
    const baseNudge = await this.getRuleBasedNudge(userId, context, data);
    if (!baseNudge) return null;
    
    // ✅ NEW: A/B test AI variants (10% traffic)
    const shouldUseAI = Math.random() < 0.1;
    
    if (shouldUseAI) {
      const aiVariant = await this.generateAIVariant(baseNudge, userId);
      await this.trackNudgeVariant(userId, { base: baseNudge, ai: aiVariant, variant: 'AI' });
      return aiVariant;
    }
    
    await this.trackNudgeVariant(userId, { base: baseNudge, variant: 'RULE_BASED' });
    return baseNudge;
  }
  
  private async generateAIVariant(baseNudge, userId) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const prompt = `
Generate personalized variant of this nudge:
BASE: ${JSON.stringify(baseNudge.message)}
TYPE: ${baseNudge.type}
USER: Knowledge=${user.knowledgeLevel}, Locale=${user.locale}

Requirements:
- Keep same nudge type
- Make it more engaging
- Use Vietnamese metaphors if locale=vi
- Under 50 words
- Output JSON: {"vi": "...", "en": "...", "zh": "..."}
    `;
    
    const response = await this.aiService.generateQuickResponse(prompt);
    return {
      type: baseNudge.type,
      message: JSON.parse(response),
      priority: baseNudge.priority,
      metadata: { generatedBy: 'AI', baseTemplate: baseNudge.message.vi },
    };
  }
}
```

**Acceptance Criteria:**
- [ ] 10% of nudges use AI variants (verified via BehaviorLog)
- [ ] Fallback to rule-based if AI fails
- [ ] A/B test tracking in place (variant field logged)
- [ ] Unit test: mocked AI response

**Testing:**
```typescript
// Test: AI variant generation
jest.spyOn(Math, 'random').mockReturnValue(0.05); // Force AI path
const nudge = await service.generateNudge(userId, 'STREAK_WARNING', {...});
expect(nudge.metadata.generatedBy).toBe('AI');
```

**Deliverable:** Close with `bd close bd-51 --reason "AI nudge variants deployed, 10% A/B test active"`

---

#### bd-52: Proactive AI Trigger Service
**Estimate:** 4 hours  
**Status:** 🔴 Not Started  
**Priority:** P2  
**Dependencies:** bd-51

**Requirements:**
```typescript
// apps/api/src/ai/proactive-triggers.service.ts (NEW FILE - 60 lines)

@Injectable()
export class ProactiveTriggersService {
  @Cron('0 */4 * * *') // Every 4 hours
  async checkStreaksAtRisk() {
    const usersAtRisk = await this.prisma.user.findMany({
      where: {
        lastLoginAt: { lt: new Date(Date.now() - 20 * 60 * 60 * 1000) },
        streak: { gte: 3 },
      },
    });
    
    for (const user of usersAtRisk) {
      const nudge = await this.nudgeEngine.generateNudge(
        user.id,
        'STREAK_WARNING',
        { streak: user.streak, hoursLeft: 4 }
      );
      
      if (nudge) {
        await this.notificationService.sendPush(user.id, nudge.message[user.locale]);
      }
    }
  }
}
```

**Acceptance Criteria:**
- [ ] Cron runs every 4 hours (verified in logs)
- [ ] Sends nudges to at-risk users (<4h left to save streak)
- [ ] Uses AI variant nudges (from bd-51)
- [ ] Unit test: cron logic with time-travel

**Testing:**
```typescript
// Test: Proactive trigger detects at-risk users
const triggerDate = new Date('2026-01-03T20:00:00');
jest.useFakeTimers().setSystemTime(triggerDate);
await service.checkStreaksAtRisk();
expect(notificationService.sendPush).toHaveBeenCalledWith(user.id, expect.any(String));
```

**Deliverable:** Close with `bd close bd-52 --reason "Proactive triggers active, 4h cron verified"`

---

## Track 4: GoldPeak - Core AI Service Enhancements (SERIAL)

**Agent:** GoldPeak  
**File Scope:** `apps/api/src/ai/ai.service.ts`, `apps/api/src/database/pgvector.service.ts`  
**Can Start:** After Tracks 1 & 2 complete  
**Purpose:** Modify core ai.service.ts with all enhancements (MUST BE SERIAL - multiple tasks touch same file)

**⚠️ Critical Note:** All tasks in this track modify `ai.service.ts` → CANNOT parallelize → 19h total

### Beads (in strict order)

#### bd-12: Integrate Metrics into AiService
**Estimate:** 2 hours  
**Dependencies:** bd-11 (Track 1)

```typescript
// apps/api/src/ai/ai.service.ts (ENHANCE)
export class AiService {
  constructor(
    // ... existing
    private metricsService: AiMetricsService, // ✅ ADD
  ) {}
  
  async chat(...) {
    const startTime = Date.now(); // ✅ ADD
    
    try {
      // ... existing logic
      
      const tokensUsed = this.estimateTokens(prompt + response);
      this.metricsService.recordTokens(tokensUsed, intent); // ✅ ADD
      
      return response;
    } finally {
      this.metricsService.recordLatency(Date.now() - startTime); // ✅ ADD
    }
  }
}
```

**Acceptance Criteria:**
- [ ] All AI calls tracked in Prometheus
- [ ] Metrics visible at `/api/metrics`
- [ ] Baseline established (run 10 queries, check P95 latency)

---

#### bd-22: Integrate RAG into AiService
**Estimate:** 4 hours  
**Dependencies:** bd-21 (Track 2), bd-12

```typescript
// apps/api/src/ai/ai.service.ts (ENHANCE)
async chat(...) {
  // ... existing
  
  // ✅ NEW: Retrieve RAG context
  let ragContext = '';
  if (this.shouldUseRAG(userPrompt)) {
    const rag = await this.ragAdapter.getRelevantContext(userPrompt);
    ragContext = `RELEVANT KNOWLEDGE:\n${rag.combinedText}`;
    this.metricsService.recordEvent('rag_retrieval', { sources: rag.sources.length });
  }
  
  const systemInstruction = `
${this.getBaseSystemPrompt(userId)}
${ragContext}
USER QUERY: ${userPrompt}
INSTRUCTIONS: Cite sources if you used RELEVANT KNOWLEDGE.
`;
  
  // ... rest
}
```

**Acceptance Criteria:**
- [ ] RAG retrieves docs for financial/learning queries
- [ ] Responses cite sources (80%+ citation rate)
- [ ] RAG retrieval latency <100ms

---

#### bd-31: Intent Classifier Enhancement
**Estimate:** 4 hours  
**Dependencies:** bd-22

```typescript
// apps/api/src/ai/ai.service.ts (ENHANCE)
export enum QueryIntent {
  GENERAL_FAQ = 'GENERAL_FAQ',
  PERSONALIZED_ADVICE = 'PERSONALIZED_ADVICE',
  FINANCIAL_ANALYSIS = 'FINANCIAL_ANALYSIS',   // ✅ NEW
  LEARNING_SUPPORT = 'LEARNING_SUPPORT',       // ✅ NEW
  BEHAVIORAL_NUDGE = 'BEHAVIORAL_NUDGE',       // ✅ NEW
}

private classifyIntent(prompt: string): QueryIntent[] {
  // ✅ Support multiple intents
  const intents: QueryIntent[] = [];
  
  const keywords = {
    FINANCIAL_ANALYSIS: ['portfolio', 'risk', 'invest'],
    LEARNING_SUPPORT: ['course', 'khóa học', 'recommend'],
    BEHAVIORAL_NUDGE: ['streak', 'motivation'],
    GENERAL_FAQ: ['là gì', 'what is'],
  };
  
  for (const [intent, words] of Object.entries(keywords)) {
    if (words.some(w => prompt.toLowerCase().includes(w))) {
      intents.push(intent as QueryIntent);
    }
  }
  
  return intents.length > 0 ? intents : [QueryIntent.PERSONALIZED_ADVICE];
}
```

**Acceptance Criteria:**
- [ ] Classifier supports 5 intent types
- [ ] Complex queries return multiple intents
- [ ] 90%+ accuracy (manual eval on 20 test queries)

---

#### bd-32: Semantic Response Caching
**Estimate:** 5 hours  
**Dependencies:** bd-31, spike-1

**Context from Spike 1:**
```markdown
## Learnings from spike-1
- Recommended threshold: (will paste here)
- Cache hit rate (simulated): (will paste here)
```

```typescript
// apps/api/src/ai/ai.service.ts (ENHANCE)
async chat(...) {
  // ✅ NEW: Check semantic cache FIRST
  const cachedResponse = await this.getSemanticCachedResponse(userPrompt);
  if (cachedResponse) {
    this.metricsService.recordCacheHit(true);
    return cachedResponse;
  }
  this.metricsService.recordCacheHit(false);
  
  // ... existing logic (RAG, LLM, etc.)
  
  // Cache response for future
  await this.cacheSemanticResponse(userPrompt, response);
  
  return response;
}

private async getSemanticCachedResponse(query: string): Promise<string | null> {
  const embedding = await this.ragAdapter.pgvector.generateEmbedding(query);
  const threshold = 0.85; // ✅ FROM SPIKE 1
  
  const similar = await this.ragAdapter.pgvector.findSimilarOptimizations(embedding, {
    threshold,
    limit: 1,
  });
  
  return similar.length > 0 ? similar[0].recommendation : null;
}
```

**Acceptance Criteria:**
- [ ] Cache hit rate >60% (after 50 test queries)
- [ ] False positive rate <5%
- [ ] Latency reduction: 3.2s → <1s (cached responses)

---

#### bd-41: Context Window Optimization
**Estimate:** 4 hours  
**Dependencies:** bd-32

```typescript
// apps/api/src/ai/ai.service.ts (ENHANCE)
private async summarizeContext(messages: any[]): Promise<string> {
  // ✅ ADD: Entity extraction
  const entities = this.extractEntities(messages);
  
  const olderMessages = messages.slice(0, -5);
  const summary = await this.model.generateContent(`
Summarize this conversation. Extract key entities:
- User goals
- Financial data mentioned
- Decisions made

Conversation: ${olderMessages.map(m => m.content).join('\n')}
`);
  
  return `
SUMMARY: ${summary}
KEY ENTITIES: ${JSON.stringify(entities)}
`;
}

private extractEntities(messages: any[]): Record<string, any> {
  // Simple keyword extraction (can enhance with NER later)
  const entities = {};
  // Extract: risk_appetite, investment_goal, etc.
  return entities;
}
```

**Acceptance Criteria:**
- [ ] Context compression: >10k tokens → <5k tokens (50% reduction)
- [ ] Entity memory preserved across summaries
- [ ] No loss of critical context (manual eval)

---

## Track 5: IronClaw - Testing & Validation

**Agent:** IronClaw  
**File Scope:** `apps/api/src/**/*.spec.ts`, `apps/api/test/**/*.e2e.spec.ts`  
**Can Start:** After Tracks 3 & 4 complete  
**Purpose:** Comprehensive testing (unit + integration + manual)

### Beads

#### bd-61: Unit Tests (60% Coverage)
**Estimate:** 8 hours  
**Dependencies:** bd-41, bd-52

Test files to create:
- `ai/metrics.service.spec.ts`
- `ai/rag-adapter.service.spec.ts`
- `ai/ai.service.spec.ts` (enhance existing)
- `nudge/nudge-engine.service.spec.ts` (enhance existing)
- `ai/proactive-triggers.service.spec.ts`

**Acceptance Criteria:**
- [ ] 60% coverage for new code (Jest)
- [ ] All critical paths tested (semantic cache, RAG grounding)
- [ ] Mocks for external services (Gemini, pgvector)

---

#### bd-62: Integration Tests (E2E)
**Estimate:** 6 hours  
**Dependencies:** bd-61

**Test Scenarios:**
1. E2E: User asks question → RAG retrieves docs → Response cites source
2. E2E: Similar query → Semantic cache hit → Fast response
3. E2E: Proactive trigger sends nudge → User receives notification

**Acceptance Criteria:**
- [ ] 5+ E2E scenarios passing
- [ ] Test DB seeded with sample data
- [ ] CI-ready (can run in GitHub Actions)

---

#### bd-63: Manual Evaluation (10 Test Queries)
**Estimate:** 2 hours  
**Dependencies:** bd-62

**Test Queries:**
1. "Lãi suất kép là gì?" → Should cite financial doc
2. "Recommend course about stocks" → Should retrieve course lessons
3. "What's my portfolio risk?" → Should ask for data OR use mock data
... (7 more)

**Evaluation Criteria:**
- ✅ Factually correct (verified against docs)
- ✅ Cites RAG sources
- ✅ Localized (correct language)
- ✅ Latency <2s
- ✅ Tokens <1,500

**Deliverable:** `docs/AI_MANUAL_EVALUATION_2026-01-10.md`

---

## Cross-Track Dependencies

```
┌─────────────────────────────────────────────────┐
│  Track 0: SpikeTeam (spikes 1, 2)               │
│  ⏱️ 3 hours                                      │
└─────────────────────────────────────────────────┘
         │
         ├─────────────────────────────────────┐
         │                                     │
         ▼                                     ▼
┌──────────────────────┐        ┌──────────────────────┐
│ Track 1: RedStone    │        │ Track 2: BlueLake    │
│ bd-11 (4h)           │        │ bd-21 (3h)           │
│ Metrics Service      │        │ RAG Adapter          │
└──────────────────────┘        └──────────────────────┘
         │                                     │
         └─────────────┬───────────────────────┘
                       │
         ┌─────────────────────────────────────┐
         │  Track 3: GreenMist (parallel)      │
         │  bd-51 → bd-52 (10h)                │
         │  Behavioral AI                      │
         └─────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│  Track 4: GoldPeak (SERIAL - touches ai.service)│
│  bd-12 → bd-22 → bd-31 → bd-32 → bd-41 (19h)    │
│  Core Service Mods                              │
└─────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│  Track 5: IronClaw (testing)                    │
│  bd-61 → bd-62 → bd-63 (16h)                    │
│  Unit + E2E + Manual                            │
└─────────────────────────────────────────────────┘
```

**Critical Path:** Track 0 → Track 4 → Track 5 = **3 + 19 + 16 = 38 hours work time**

---

## Key Learnings (Embed from Spikes)

### From spike-1 (Semantic Cache Threshold)
- **Recommended threshold:** [TBD - will fill after spike completes]
- **Cache hit rate (simulated):** [TBD]%
- **False positive rate:** [TBD]%
- **Reference code:** `.spikes/ai-optimization/semantic-cache-threshold/test.ts`

### From spike-2 (ORM Adapter Safety)
- **Safe read pattern:** [TBD - will fill after spike completes]
- **Transaction notes:** [TBD]
- **Example code:** `.spikes/ai-optimization/orm-adapter/test-cross-orm.ts`

---

## Orchestrator Protocol

### Phase 1: Spawn Workers
```bash
# Spawn Track 0 (spikes) - FIRST
Task(description="SpikeTeam: Validate HIGH risk items", prompt="...")

# After spikes complete, spawn parallel tracks:
Task(description="RedStone: Observability foundation", prompt="...")
Task(description="BlueLake: RAG adapter", prompt="...")
Task(description="GreenMist: Behavioral AI", prompt="...")

# After Tracks 1+2 complete, spawn serial track:
Task(description="GoldPeak: Core service enhancements", prompt="...")

# After Track 4 complete, spawn testing:
Task(description="IronClaw: Testing suite", prompt="...")
```

### Phase 2: Monitor Progress
```bash
# Check epic thread for completion messages
search_messages(query="bd-", limit=50)

# Check for blockers
fetch_inbox(agent_name="CoralReef", urgent_only=true)

# Check bead status
bv --robot-triage --graph-root <epic-id>
```

### Phase 3: Handle Cross-Track Blockers
- If GoldPeak blocked by RedStone → message RedStone
- If file conflict → coordinate release

### Phase 4: Epic Completion
```bash
# Verify all done
bv --robot-triage --graph-root <epic-id> | jq '.quick_ref.open_count'
# Should be 0

# Send completion summary to all workers
send_message(to=["RedStone", "BlueLake", "GreenMist", "GoldPeak", "IronClaw"], ...)

# Close epic
bd close <epic-id> --reason "All tracks complete, AI optimization delivered"
```

---

## Expected Timeline

| Week | Tracks Active | Key Deliverables |
|------|---------------|------------------|
| **Week 1** | 0 (spikes), then 1+2+3 parallel | Spikes validated, Metrics+RAG+Nudges done |
| **Week 2** | 4 (serial) | Core AI service enhanced (19h work) |
| **Week 3** | 5 (testing) | Tests passing, manual eval complete |

**Total Elapsed Time:** 3 weeks (with buffer)  
**Total Work Time:** 51 hours (distributed across 6 agents)

---

**Status:** 🟢 READY FOR ORCHESTRATOR TO SPAWN WORKERS

**Next Action:** Load orchestrator skill and spawn SpikeTeam first.
