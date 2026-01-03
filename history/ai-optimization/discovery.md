# Discovery Report: AI System Optimization

**Date:** 2026-01-03  
**Epic:** AI Smart Extensions Enhancement  
**Analyst:** Amp AI Agent

---

## Architecture Snapshot

### Package Structure
```
apps/api/src/
├── ai/
│   ├── ai.service.ts              # Main AI orchestrator (418 lines)
│   ├── ai.controller.ts           # REST endpoints
│   └── ai.module.ts               # NestJS module
├── config/
│   └── gemini.service.ts          # Gemini API wrapper (106 lines)
├── database/
│   ├── pgvector.service.ts        # RAG embeddings (265 lines)
│   ├── database.service.ts        # Unified DB interface
│   └── drizzle-schema.ts          # Drizzle ORM schema
├── modules/
│   ├── nudge/
│   │   └── nudge-engine.service.ts  # Behavioral nudges (200+ lines)
│   ├── ai-tutor/
│   │   └── ai-tutor.service.ts      # Financial tutoring
│   └── ai/
│       ├── vanna.service.ts         # Text-to-SQL
│       └── moderation.service.ts    # Content moderation
└── prisma/
    └── prisma.service.ts          # Prisma client
```

### Entry Points
- **REST API:** `ai.controller.ts` → `/ai/threads`, `/ai/threads/:id/chat`
- **Frontend:** `apps/web/src/components/AiMentor.tsx`
- **Backend Service:** `ai.service.ts` (exports `AiService` class)

### Key Dependencies
- **Gemini API:** `@google/generative-ai` (2.0 Flash model)
- **Embeddings:** `@xenova/transformers` (local, all-MiniLM-L6-v2)
- **Database:** Prisma (main) + Drizzle (pgvector) hybrid
- **Caching:** `@nestjs/cache-manager` (in-memory)

---

## Existing Patterns

### 1. Intent Classification (ai.service.ts:403-417)
```typescript
private classifyIntent(prompt: string): 'GENERAL_FAQ' | 'PERSONALIZED_ADVICE' {
  const faqKeywords = ['là gì', 'định nghĩa', 'how to', 'cách làm'];
  const isFAQ = faqKeywords.some((k) => prompt.toLowerCase().includes(k));
  return isFAQ ? 'GENERAL_FAQ' : 'PERSONALIZED_ADVICE';
}
```
**Pattern:** Simple keyword matching (rule-based)  
**Reusable:** ✅ Extend to support 5 intent types

### 2. Context Summarization (ai.service.ts:361-375)
```typescript
private async summarizeContext(messages: any[]): Promise<string> {
  // Summarizes old messages when context grows large
  const olderMessages = messages.slice(0, -5);
  const systemInstruction = `Summarize this conversation history: ...`;
  const summary = await this.model.generateContent(systemInstruction);
  return summary;
}
```
**Pattern:** LLM-based summarization with sliding window  
**Reusable:** ✅ Add entity extraction

### 3. FAQ Caching (ai.service.ts:235-252)
```typescript
private async getFAQResponse(userPrompt: string) {
  const hash = createHash('sha256').update(userPrompt).digest('hex');
  const cached = await this.cacheManager.get(`faq:${hash}`);
  if (cached) return cached;
  // ... generate new response ...
  await this.cacheManager.set(`faq:${hash}`, response, { ttl: 3600 });
  return response;
}
```
**Pattern:** Hash-based exact match caching  
**Limitation:** Misses semantically similar queries (e.g., "lãi suất kép?" vs "compound interest?")  
**Enhancement Needed:** Semantic similarity via pgvector

### 4. Behavioral Nudge Engine (nudge-engine.service.ts:35-57)
```typescript
async generateNudge(userId: string, context: string, data: any) {
  const persona = await this.analytics.getUserPersona(userId);
  
  switch (context) {
    case 'INVESTMENT_DECISION':
      return this.getInvestmentNudge(user, data, persona);
    case 'STREAK_WARNING':
      return this.getStreakNudge(user, data, persona);
    // ... 4 more context types
  }
}
```
**Pattern:** Rule-based persona mapping (HUNTER → SOCIAL_PROOF, SAVER → LOSS_AVERSION)  
**Reusable:** ✅ Add AI variant generation (10% A/B test)

### 5. pgvector RAG (pgvector.service.ts:81-100)
```typescript
async generateEmbedding(text: string): Promise<number[]> {
  const output = await this.embeddingPipeline(text, {
    pooling: 'mean',
    normalize: true,
  });
  return Array.from(output.data); // 384-dimensional vector
}
```
**Pattern:** Local Xenova embeddings (50ms, no API costs)  
**Reusable:** ✅ Add semantic response caching

---

## Technical Constraints

### Node.js Environment
```json
// From package.json (verified)
{
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

### Key Dependencies (versions verified)
- `@google/generative-ai`: ^0.1.3 (Gemini 2.0 Flash support)
- `@xenova/transformers`: ^2.6.0 (ESM module, requires `type: module`)
- `@nestjs/cache-manager`: ^2.1.1
- `prom-client`: **NOT INSTALLED** (need to add: `pnpm add prom-client`)
- `drizzle-orm`: ^0.28.6 (used by pgvector.service.ts)
- `@prisma/client`: ^5.6.0

### Build Requirements
```bash
# TypeScript compilation
pnpm --filter api build
# → apps/api/dist/

# Database
# - PostgreSQL 14+ with pgvector extension 0.5.x
# - Prisma migrations: apps/api/prisma/migrations/
```

### Database Schema Constraints
- **Prisma** manages schema migrations (source of truth)
- **Drizzle** mirrors schema for fast queries (DO NOT run drizzle migrations)
- **pgvector** extension required for `vector(384)` columns

---

## External References

### Library Documentation
- **Prometheus Node.js Client:** https://github.com/siimon/prom-client
  - Histogram, Counter, Gauge APIs
  - Express middleware integration
- **pgvector Node.js:** https://github.com/pgvector/pgvector-node
  - Drizzle ORM integration guide
  - Cosine similarity queries
- **Xenova Transformers:** https://huggingface.co/docs/transformers.js
  - Feature extraction pipeline
  - Embedding model: `Xenova/all-MiniLM-L6-v2` (384-dim)
- **Gemini API:** https://ai.google.dev/gemini-api/docs
  - generationConfig: maxOutputTokens, temperature, topP

### Similar Projects
- **LangChain RAG Examples:** https://js.langchain.com/docs/use_cases/question_answering
  - Semantic caching patterns
  - Multi-retriever strategies
- **Vercel AI SDK:** https://sdk.vercel.ai/docs/guides/caching
  - Response caching with embeddings
  - Streaming + caching

---

## Naming Conventions (from codebase audit)

### Service Classes
- Pattern: `{Domain}Service` (e.g., `AiService`, `PgvectorService`)
- Injectable: `@Injectable()` decorator
- Filename: `{domain}.service.ts`

### Methods
- Public methods: camelCase (e.g., `generateNudge`, `chat`)
- Private helpers: camelCase with `private` keyword (e.g., `private classifyIntent`)

### File Locations
- Services: `apps/api/src/{domain}/{domain}.service.ts`
- Controllers: `apps/api/src/{domain}/{domain}.controller.ts`
- Modules: `apps/api/src/{domain}/{domain}.module.ts`
- Tests: `apps/api/src/{domain}/{domain}.service.spec.ts`

---

## Reusable Utilities

### 1. Token Estimation (ai.service.ts)
```typescript
private estimateTokens(text: string): number {
  return Math.ceil(text.length / 4); // Rough estimate for English/Vietnamese
}
```
**Note:** Inaccurate for Vietnamese text (multi-byte chars). Use Gemini API's token counter.

### 2. PII Masking (ai.service.ts:97-122)
```typescript
private maskPII(data: any): any {
  // Recursively masks email, phone, address fields
  // Returns masked copy (does not mutate original)
}
```
**Reusable:** ✅ Use before logging user queries

### 3. Hash-based Caching
```typescript
const hash = createHash('sha256').update(input).digest('hex');
```
**Pattern:** SHA-256 for cache keys (collision-resistant)

---

## Known Issues (from codebase comments)

### 1. Token Estimation Inaccurate (ai.service.ts:215)
```typescript
// TODO: Use Gemini's token counter instead of length/4
```

### 2. No Circuit Breaker for Gemini API (ai.service.ts)
```typescript
// If Gemini API down, entire chat system fails
// No fallback to cached responses or rule-based mode
```

### 3. FAQ Cache Uses Exact Match Only (ai.service.ts:235)
```typescript
// "What is compound interest?" and "Explain compound interest" = cache miss
// Need semantic similarity matching
```

---

## Summary

### Strengths
- ✅ Clean service architecture (NestJS modules)
- ✅ Hybrid ORM strategy (Prisma + Drizzle) working in production
- ✅ Local embeddings (no API costs for RAG)
- ✅ Behavioral nudges with persona mapping
- ✅ i18n support (vi/en/zh)

### Gaps
- ❌ No semantic caching (only exact FAQ matches)
- ❌ No observability (metrics, tracing)
- ❌ Token budget math doesn't account for caching benefits
- ❌ ai.service.ts is a bottleneck (multiple features need to modify it)

### Constraints
- ⚠️ prom-client not installed (need to add dependency)
- ⚠️ ai.service.ts touched by 5+ planned tasks (limits parallelism)
- ⚠️ Cross-ORM reads (Drizzle→Prisma) need validation spike

---

**Next Phase:** Synthesis (Oracle gap analysis + risk assessment)
