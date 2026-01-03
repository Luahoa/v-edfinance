# 🤖 AI System Optimization Master Plan - V-EdFinance

**Date:** 2026-01-03  
**Status:** 🟢 READY FOR EXECUTION  
**Framework:** 6-Step Planning Pipeline + Beads Trinity Orchestration  
**Project Phase:** Sprint 6 - AI Intelligence Layer Enhancement

---

## 📊 PHASE 1: DISCOVERY (Current State Analysis)

### ✅ Existing AI Infrastructure

#### 1. **AI Mentor System** (Frontend + Backend)
**Location:** `apps/web/src/components/AiMentor.tsx` + `apps/api/src/ai/ai.service.ts`

**Current Features:**
- ✅ Multi-thread chat management (Thread + Message CRUD)
- ✅ Google Gemini 2.0 Flash integration
- ✅ Rate limiting (20 req/min) + Token budgeting (50k tokens/month)
- ✅ PII masking (email, phone, address)
- ✅ Analytics tracking (`useAnalytics` hook)
- ✅ Action Cards (COURSE_LINK, QUIZ, UPDATE_PROFILE)
- ✅ Real-time markdown rendering (ReactMarkdown)
- ✅ i18n support (vi/en/zh via `useTranslations`)

**Architecture:**
```
Frontend (React)          Backend (NestJS)           LLM Provider
┌─────────────────┐      ┌──────────────────┐      ┌────────────┐
│  AiMentor.tsx   │─────▶│  AiService       │─────▶│ Gemini API │
│  - Thread UI    │      │  - Rate Limiter  │      │ 2.0 Flash  │
│  - Chat UI      │      │  - PII Masking   │      └────────────┘
│  - Action Cards │      │  - Token Budget  │
└─────────────────┘      └──────────────────┘
         │                        │
         │                        ▼
         │                ┌──────────────────┐
         │                │ PrismaService    │
         │                │ - ChatThread     │
         └───────────────▶│ - ChatMessage    │
                          │ - BehaviorLog    │
                          └──────────────────┘
```

#### 2. **RAG System (Retrieval-Augmented Generation)**
**Location:** `apps/api/src/database/pgvector.service.ts` + `apps/api/src/modules/ai/vanna.service.ts`

**Current Features:**
- ✅ Local embeddings (Xenova all-MiniLM-L6-v2, 384-dim)
- ✅ pgvector similarity search (<10ms query time)
- ✅ Semantic query deduplication (0.85 cosine threshold)
- ✅ Optimization log storage (query text + recommendations)
- ✅ FAQ caching layer (hash-based, Redis/in-memory)

**Performance:**
- Embedding generation: ~50ms (local, no API costs)
- Vector search: <10ms (pgvector index)
- Cache hit rate: Unknown (needs metrics)

#### 3. **Specialized AI Services**

**a) AI Tutor Service** (`apps/api/src/modules/ai-tutor/ai-tutor.service.ts`)
- Persona-based prompts (WISE_SAGE, STRICT_COACH, SUPPORTIVE_BUDDY)
- Localized financial education (vi/en/zh)
- Knowledge level adaptation (Beginner/Intermediate/Advanced)
- Behavioral prediction integration (churn prevention)

**b) AI Moderation** (`apps/api/src/modules/ai/moderation.service.ts`)
- Content moderation (toxicity, spam, PII detection)
- Gemini-based moderation API
- Rule-based filters

**c) Vanna Service** (`apps/api/src/modules/ai/vanna.service.ts`)
- Text-to-SQL query generation
- Natural language → Database queries
- pgvector-powered query optimization

#### 4. **Analytics System**
**Location:** `apps/web/src/hooks/useAnalytics.ts` + `apps/api/src/modules/behavior-analytics/`

**Current Tracking:**
- ✅ User events (SEND_CHAT_MESSAGE, CLICK_ACTION_CARD)
- ✅ Session tracking (`sessionId`)
- ✅ Device info (userAgent, screen resolution)
- ✅ BehaviorLog persistence (Prisma)

**Missing:**
- ❌ AI performance metrics (latency, token usage per request)
- ❌ RAG effectiveness metrics (cache hit rate, embedding quality)
- ❌ User satisfaction tracking (thumbs up/down on AI responses)

---

### 🚨 CRITICAL GAPS (Must Fix)

#### Gap 1: No Multi-Agent Orchestration
**Current:** Single-model system (Gemini 2.0 Flash only)  
**Problem:**
- Cannot route complex queries to specialized agents
- No task decomposition for multi-step reasoning
- Single point of failure (Gemini API down = entire AI offline)

**Impact:** Low accuracy on complex financial planning queries (e.g., "Analyze my portfolio risk + suggest rebalancing + estimate tax impact")

#### Gap 2: No Context Management System
**Current:** Full chat history sent to Gemini every request  
**Problem:**
- Token waste (repeated context in every API call)
- No summarization/compression for long threads
- Risk of context overflow (Gemini 2.0 limit: 128k tokens)

**Impact:** High token costs, slow response times (>3s for long threads)

#### Gap 3: Insufficient RAG Integration
**Current:** RAG exists but not connected to AI Mentor  
**Problem:**
- AI Mentor doesn't leverage RAG for factual grounding
- No course content/quiz retrieval for recommendations
- Hallucination risk (AI inventing fake financial advice)

**Impact:** Low trust, potential legal liability (incorrect financial guidance)

#### Gap 4: No AI Observability
**Current:** Basic logging only (console.error)  
**Problem:**
- No structured metrics (latency, token usage, error rates)
- No tracing for multi-step AI workflows
- Cannot detect performance degradation

**Impact:** Cannot optimize, debug issues, or prove ROI

#### Gap 5: Limited Behavioral AI Integration
**Current:** AI Tutor has basic persona support  
**Problem:**
- No integration with Nudge Engine (no AI-generated nudges)
- No Hooked Loop triggers (AI doesn't initiate conversations)
- No loss aversion/social proof in AI responses

**Impact:** Missed engagement opportunities, low retention

---

## 🎯 PHASE 2: SYNTHESIS (Strategic Framework)

### Design Philosophy: **"AI Orchestration as a Service"**

**Core Principles:**
1. **Multi-Agent Architecture** - Route queries to specialized agents
2. **RAG-First Design** - Ground all responses in factual knowledge
3. **Context-Aware Caching** - Intelligent summarization + LRU eviction
4. **Observable AI** - Full tracing + metrics for every AI interaction
5. **Behavioral AI Fusion** - AI drives Nudge/Hooked loops

---

### Target Architecture: **Trinity AI System**

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI ORCHESTRATOR (New)                        │
│  - Query routing (intent classification)                        │
│  - Multi-agent coordination (parallel + sequential)             │
│  - Context management (summarization, compression)              │
│  - Fallback handling (circuit breaker, retry logic)             │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐      ┌──────────────┐
│ Financial    │    │ Learning     │      │ Behavioral   │
│ Advisor Agent│    │ Tutor Agent  │      │ Nudge Agent  │
│              │    │              │      │              │
│ - Portfolio  │    │ - Course Rec │      │ - Loss Alert │
│ - Risk Calc  │    │ - Quiz Gen   │      │ - Social Pr. │
│ - Tax Calc   │    │ - Progress   │      │ - Framing    │
└──────────────┘    └──────────────┘      └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
                ┌─────────────────────────┐
                │   RAG KNOWLEDGE BASE    │
                │  - Course content       │
                │  - Financial docs       │
                │  - User behavior        │
                │  - FAQ + Optimizations  │
                └─────────────────────────┘
                              │
                              ▼
                ┌─────────────────────────┐
                │  OBSERVABILITY LAYER    │
                │  - OpenTelemetry traces │
                │  - Prometheus metrics   │
                │  - Structured logging   │
                └─────────────────────────┘
```

---

## 🔬 PHASE 3: VERIFICATION (Success Metrics)

### Key Performance Indicators (KPIs)

| Metric | Current | Target | How to Measure |
|--------|---------|--------|----------------|
| **Response Latency (P95)** | Unknown | <2s | OpenTelemetry span duration |
| **Token Efficiency** | Unknown | -40% | Tokens/request (before vs after context mgmt) |
| **Cache Hit Rate** | Unknown | >60% | (Cache hits / Total queries) × 100 |
| **Accuracy (Financial)** | Unknown | >95% | Manual evaluation (10 test queries/week) |
| **User Satisfaction** | Unknown | >4.2/5 | Thumbs up/down + follow-up survey |
| **Hallucination Rate** | Unknown | <2% | RAG grounding checks (citation required) |
| **AI-Driven Conversions** | 0% | >15% | Users clicking Action Cards |
| **Multi-Agent Coverage** | 0% | >80% | % queries routed to specialized agents |

### A/B Testing Plan
- **Control Group:** Current single-agent system (Gemini 2.0 Flash only)
- **Treatment Group:** Trinity AI System (orchestrator + RAG + multi-agent)
- **Duration:** 2 weeks
- **Sample Size:** 500 users (250 per group)
- **Success Criteria:** +20% user satisfaction, -30% token costs, +10% engagement

---

## 🛠️ PHASE 4: DECOMPOSITION (Implementation Tasks)

### Epic 1: AI Orchestrator Engine (3 days)

#### Task 1.1: Intent Classifier (6 hours)
**Goal:** Route queries to specialized agents based on intent

**Implementation:**
```typescript
// apps/api/src/ai/orchestrator/intent-classifier.service.ts

export enum QueryIntent {
  FINANCIAL_ADVICE = 'financial_advice',    // → Financial Advisor Agent
  LEARNING_SUPPORT = 'learning_support',    // → Learning Tutor Agent
  BEHAVIORAL_NUDGE = 'behavioral_nudge',    // → Behavioral Nudge Agent
  GENERAL_CHAT = 'general_chat',            // → General AI Mentor
}

@Injectable()
export class IntentClassifierService {
  async classifyIntent(userQuery: string, context: any): Promise<QueryIntent> {
    // Use Gemini for zero-shot classification (fast, no training needed)
    const prompt = `
      Classify this user query into ONE of these categories:
      - financial_advice: Portfolio analysis, risk assessment, tax planning
      - learning_support: Course recommendations, quiz help, progress tracking
      - behavioral_nudge: Loss aversion alerts, social proof, streak reminders
      - general_chat: Greetings, small talk, off-topic
      
      User query: "${userQuery}"
      
      Respond with ONLY the category name (lowercase, underscores).
    `;
    
    const response = await this.geminiService.generate(prompt);
    return this.parseIntent(response);
  }
}
```

**Beads Task:**
```bash
beads.exe create "Task 1.1: Intent Classifier Service" \
  --type task \
  --priority 1 \
  --deps "Epic 1: AI Orchestrator Engine" \
  --estimate "6h"
```

#### Task 1.2: Agent Router (8 hours)
**Goal:** Coordinate parallel/sequential agent execution

**Implementation:**
```typescript
// apps/api/src/ai/orchestrator/agent-router.service.ts

export interface AgentResult {
  agentId: string;
  response: string;
  confidence: number;
  metadata?: any;
}

@Injectable()
export class AgentRouterService {
  async routeQuery(
    intent: QueryIntent,
    query: string,
    context: any,
  ): Promise<AgentResult[]> {
    const agents = this.selectAgents(intent);
    
    // Parallel execution for independent agents
    if (this.canRunParallel(agents)) {
      return Promise.all(
        agents.map(agent => agent.execute(query, context))
      );
    }
    
    // Sequential execution for dependent agents
    let results: AgentResult[] = [];
    for (const agent of agents) {
      const result = await agent.execute(query, {
        ...context,
        previousResults: results,
      });
      results.push(result);
    }
    
    return results;
  }
  
  private selectAgents(intent: QueryIntent) {
    const agentMap = {
      [QueryIntent.FINANCIAL_ADVICE]: [
        this.financialAdvisorAgent,
        this.ragAgent, // Retrieve financial docs
      ],
      [QueryIntent.LEARNING_SUPPORT]: [
        this.learningTutorAgent,
        this.ragAgent, // Retrieve course content
      ],
      [QueryIntent.BEHAVIORAL_NUDGE]: [
        this.behavioralNudgeAgent,
      ],
      [QueryIntent.GENERAL_CHAT]: [
        this.generalAiMentorAgent,
      ],
    };
    
    return agentMap[intent] || [this.generalAiMentorAgent];
  }
}
```

**Beads Task:**
```bash
beads.exe create "Task 1.2: Agent Router with Parallel Execution" \
  --type task \
  --priority 1 \
  --deps "ved-xxx (Task 1.1)" \
  --estimate "8h"
```

#### Task 1.3: Context Manager (10 hours)
**Goal:** Intelligent context compression + summarization

**Implementation:**
```typescript
// apps/api/src/ai/orchestrator/context-manager.service.ts

export interface ManagedContext {
  summary: string;           // Compressed conversation history
  recentMessages: any[];     // Last 5 messages (full)
  entityMemory: Map<string, any>; // Key facts (user goals, preferences)
  tokenCount: number;        // Estimated token usage
}

@Injectable()
export class ContextManagerService {
  async compressContext(
    threadId: string,
    maxTokens: number = 8000,
  ): Promise<ManagedContext> {
    const messages = await this.aiService.getMessages(threadId);
    
    // If context fits within limit, return as-is
    const totalTokens = this.estimateTokens(messages);
    if (totalTokens <= maxTokens) {
      return {
        summary: '',
        recentMessages: messages,
        entityMemory: new Map(),
        tokenCount: totalTokens,
      };
    }
    
    // Compress: Summarize older messages, keep recent ones
    const recentMessages = messages.slice(-5);
    const olderMessages = messages.slice(0, -5);
    
    const summary = await this.summarizeMessages(olderMessages);
    const entityMemory = this.extractEntities(messages);
    
    return {
      summary,
      recentMessages,
      entityMemory,
      tokenCount: this.estimateTokens([summary, ...recentMessages]),
    };
  }
  
  private async summarizeMessages(messages: any[]): Promise<string> {
    const prompt = `
      Summarize this conversation history into 3-5 key bullet points.
      Focus on: User goals, decisions made, important context.
      
      Conversation:
      ${messages.map(m => `${m.role}: ${m.content}`).join('\n')}
    `;
    
    return this.geminiService.generate(prompt);
  }
  
  private extractEntities(messages: any[]): Map<string, any> {
    // Extract key facts: user preferences, goals, financial data
    // Example: "risk_appetite: conservative", "investment_goal: retirement"
    const entities = new Map();
    
    // Use regex + NLP (or Gemini) to extract entities
    // For MVP: Simple keyword extraction
    
    return entities;
  }
}
```

**Beads Task:**
```bash
beads.exe create "Task 1.3: Context Manager with Summarization" \
  --type task \
  --priority 1 \
  --deps "ved-xxx (Task 1.2)" \
  --estimate "10h"
```

---

### Epic 2: RAG Enhancement (2 days)

#### Task 2.1: Connect RAG to AI Mentor (4 hours)
**Goal:** AI Mentor retrieves relevant docs before generating response

**Implementation:**
```typescript
// apps/api/src/ai/ai.service.ts (enhance existing chat method)

async chat(threadId: string, userId: string, prompt: string) {
  // 1. Classify intent
  const intent = await this.intentClassifier.classifyIntent(prompt, {});
  
  // 2. Retrieve relevant knowledge (RAG)
  let ragContext = '';
  if (this.needsRAG(intent)) {
    const embedding = await this.pgvectorService.generateEmbedding(prompt);
    const similarDocs = await this.findSimilarDocuments(embedding, {
      threshold: 0.75,
      limit: 3,
    });
    
    ragContext = similarDocs
      .map(doc => `[Source: ${doc.title}]\n${doc.content}`)
      .join('\n\n');
  }
  
  // 3. Compress conversation context
  const context = await this.contextManager.compressContext(threadId);
  
  // 4. Build enhanced prompt
  const enhancedPrompt = `
    ${ragContext ? `Relevant Knowledge:\n${ragContext}\n\n` : ''}
    
    Conversation History:
    ${context.summary}
    
    Recent Messages:
    ${context.recentMessages.map(m => `${m.role}: ${m.content}`).join('\n')}
    
    User Query: ${prompt}
    
    Instructions:
    - Answer based on the provided knowledge (cite sources if used)
    - If knowledge is insufficient, say "I don't have enough information"
    - Keep response under 200 words
  `;
  
  // 5. Generate response
  const response = await this.model.generateContent(enhancedPrompt);
  
  // 6. Save + return
  await this.saveMessage(threadId, 'USER', prompt);
  await this.saveMessage(threadId, 'ASSISTANT', response.text);
  
  return response.text;
}
```

**Beads Task:**
```bash
beads.exe create "Task 2.1: Integrate RAG into AI Mentor Chat" \
  --type task \
  --priority 1 \
  --deps "ved-xxx (Epic 1 completion)" \
  --estimate "4h"
```

#### Task 2.2: Expand Knowledge Base (6 hours)
**Goal:** Add course content, financial docs, user behavior to RAG

**Implementation:**
1. **Ingest course content** (lessons, quizzes) into pgvector
2. **Ingest financial education docs** (compound interest, risk diversification)
3. **Ingest user behavior patterns** (common questions, successful nudges)

**Script:**
```typescript
// apps/api/src/scripts/seed-rag-knowledge.ts

async function seedKnowledgeBase() {
  // 1. Course content
  const courses = await prisma.course.findMany({
    include: { lessons: true, quizzes: true },
  });
  
  for (const course of courses) {
    for (const lesson of course.lessons) {
      const embedding = await pgvectorService.generateEmbedding(
        `${lesson.title} ${lesson.content}`,
      );
      
      await db.insert(knowledgeBase).values({
        type: 'course_lesson',
        title: lesson.title,
        content: lesson.content,
        embedding,
        metadata: { courseId: course.id, lessonId: lesson.id },
      });
    }
  }
  
  // 2. Financial docs (from Markdown files)
  const docs = await loadFinancialDocs('./docs/financial-education/');
  for (const doc of docs) {
    const embedding = await pgvectorService.generateEmbedding(doc.content);
    await db.insert(knowledgeBase).values({
      type: 'financial_doc',
      title: doc.title,
      content: doc.content,
      embedding,
    });
  }
  
  // 3. User behavior (FAQ from BehaviorLog)
  const faq = await generateFAQFromBehaviorLog();
  for (const qa of faq) {
    const embedding = await pgvectorService.generateEmbedding(qa.question);
    await db.insert(knowledgeBase).values({
      type: 'faq',
      title: qa.question,
      content: qa.answer,
      embedding,
    });
  }
}
```

**Beads Task:**
```bash
beads.exe create "Task 2.2: Seed RAG Knowledge Base (Courses + Docs + FAQ)" \
  --type task \
  --priority 2 \
  --deps "ved-xxx (Task 2.1)" \
  --estimate "6h"
```

---

### Epic 3: Specialized Agents (3 days)

#### Task 3.1: Financial Advisor Agent (8 hours)
**Goal:** Portfolio risk analysis + tax estimation + rebalancing advice

**Implementation:**
```typescript
// apps/api/src/ai/agents/financial-advisor.agent.ts

@Injectable()
export class FinancialAdvisorAgent {
  async execute(query: string, context: any): Promise<AgentResult> {
    // 1. Extract user portfolio (if available)
    const portfolio = context.user?.portfolio || [];
    
    // 2. Retrieve financial knowledge (RAG)
    const ragDocs = await this.retrieveFinancialDocs(query);
    
    // 3. Build specialized prompt
    const prompt = `
      You are a certified financial advisor (CFP).
      
      User Portfolio:
      ${JSON.stringify(portfolio, null, 2)}
      
      Relevant Financial Principles:
      ${ragDocs.map(d => d.content).join('\n\n')}
      
      User Query: ${query}
      
      Provide:
      1. Risk assessment (Low/Medium/High)
      2. Rebalancing recommendation (if needed)
      3. Tax-efficient strategy
      
      Format: Markdown with bullet points.
    `;
    
    const response = await this.geminiService.generate(prompt);
    
    return {
      agentId: 'financial_advisor',
      response: response.text,
      confidence: 0.9,
      metadata: { portfolio, ragDocs },
    };
  }
}
```

**Beads Task:**
```bash
beads.exe create "Task 3.1: Financial Advisor Agent (Portfolio Risk + Tax)" \
  --type task \
  --priority 1 \
  --deps "ved-xxx (Epic 2 completion)" \
  --estimate "8h"
```

#### Task 3.2: Behavioral Nudge Agent (6 hours)
**Goal:** AI-generated loss aversion alerts + social proof messages

**Implementation:**
```typescript
// apps/api/src/ai/agents/behavioral-nudge.agent.ts

@Injectable()
export class BehavioralNudgeAgent {
  async execute(query: string, context: any): Promise<AgentResult> {
    const user = context.user;
    
    // 1. Detect behavioral triggers
    const triggers = await this.detectTriggers(user);
    
    // 2. Generate personalized nudge
    const nudgeType = this.selectNudgeType(triggers);
    
    const prompt = `
      Generate a ${nudgeType} message for this user:
      
      User Context:
      - Streak: ${user.streak} days
      - Last activity: ${user.lastActivity}
      - Risk: Churn probability ${triggers.churnProbability}%
      
      Requirements:
      - Use loss aversion framing ("Don't lose your X-day streak!")
      - Keep under 50 words
      - Include specific action ("Complete today's lesson")
      - Locale: ${context.locale}
    `;
    
    const nudge = await this.geminiService.generate(prompt);
    
    // 3. Schedule notification (if appropriate)
    if (triggers.severity === 'high') {
      await this.notificationService.send(user.id, nudge);
    }
    
    return {
      agentId: 'behavioral_nudge',
      response: nudge,
      confidence: 0.85,
      metadata: { nudgeType, triggers },
    };
  }
}
```

**Beads Task:**
```bash
beads.exe create "Task 3.2: Behavioral Nudge Agent (AI Loss Aversion)" \
  --type task \
  --priority 1 \
  --deps "ved-xxx (Task 3.1)" \
  --estimate "6h"
```

---

### Epic 4: Observability Layer (1 day)

#### Task 4.1: OpenTelemetry Integration (4 hours)
**Goal:** Distributed tracing for multi-agent workflows

**Implementation:**
```typescript
// apps/api/src/ai/tracing.ts

import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('ai-orchestrator');

export function traceAICall(operationName: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const span = tracer.startSpan(operationName);
      
      try {
        const result = await originalMethod.apply(this, args);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error.message,
        });
        throw error;
      } finally {
        span.end();
      }
    };
    
    return descriptor;
  };
}

// Usage:
@Injectable()
export class AiService {
  @traceAICall('ai.chat')
  async chat(threadId: string, userId: string, prompt: string) {
    // ... existing code
  }
}
```

**Beads Task:**
```bash
beads.exe create "Task 4.1: OpenTelemetry Tracing for AI Workflows" \
  --type task \
  --priority 2 \
  --deps "ved-xxx (Epic 3 completion)" \
  --estimate "4h"
```

#### Task 4.2: Prometheus Metrics (4 hours)
**Goal:** Real-time dashboards for AI performance

**Metrics:**
- `ai_request_duration_seconds` (histogram)
- `ai_token_usage_total` (counter)
- `ai_cache_hit_rate` (gauge)
- `ai_error_rate` (counter)

**Implementation:**
```typescript
// apps/api/src/ai/metrics.ts

import { Counter, Histogram, Gauge } from 'prom-client';

export const aiRequestDuration = new Histogram({
  name: 'ai_request_duration_seconds',
  help: 'AI request latency',
  labelNames: ['agent', 'intent'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

export const aiTokenUsage = new Counter({
  name: 'ai_token_usage_total',
  help: 'Total tokens consumed',
  labelNames: ['model', 'operation'],
});

export const aiCacheHitRate = new Gauge({
  name: 'ai_cache_hit_rate',
  help: 'RAG cache hit rate (0-1)',
});
```

**Grafana Dashboard:**
```yaml
# monitoring/grafana/dashboards/ai-performance.json
{
  "title": "AI System Performance",
  "panels": [
    {
      "title": "Response Latency (P95)",
      "targets": [
        "histogram_quantile(0.95, ai_request_duration_seconds)"
      ]
    },
    {
      "title": "Token Usage (Last Hour)",
      "targets": [
        "rate(ai_token_usage_total[1h])"
      ]
    },
    {
      "title": "Cache Hit Rate",
      "targets": [
        "ai_cache_hit_rate"
      ]
    }
  ]
}
```

**Beads Task:**
```bash
beads.exe create "Task 4.2: Prometheus Metrics + Grafana Dashboard" \
  --type task \
  --priority 2 \
  --deps "ved-xxx (Task 4.1)" \
  --estimate "4h"
```

---

## ✅ PHASE 5: VALIDATION (Testing Strategy)

### Unit Tests (60% coverage target)

```typescript
// apps/api/src/ai/orchestrator/intent-classifier.spec.ts

describe('IntentClassifierService', () => {
  it('should classify financial advice queries', async () => {
    const query = 'What is my portfolio risk?';
    const intent = await service.classifyIntent(query, {});
    expect(intent).toBe(QueryIntent.FINANCIAL_ADVICE);
  });
  
  it('should classify learning support queries', async () => {
    const query = 'Recommend me a course about stocks';
    const intent = await service.classifyIntent(query, {});
    expect(intent).toBe(QueryIntent.LEARNING_SUPPORT);
  });
});
```

### Integration Tests

```typescript
// apps/api/test/ai-orchestrator.e2e.spec.ts

describe('AI Orchestrator E2E', () => {
  it('should route complex query to multiple agents', async () => {
    const query = 'Analyze my portfolio and suggest a course to improve';
    
    const result = await orchestrator.routeQuery(query, {
      user: mockUser,
      locale: 'en',
    });
    
    expect(result).toHaveLength(2); // Financial + Learning agents
    expect(result[0].agentId).toBe('financial_advisor');
    expect(result[1].agentId).toBe('learning_tutor');
  });
});
```

### Manual Evaluation (10 test queries/week)

**Test Queries:**
1. "What's the risk of my portfolio? I have 60% stocks, 40% bonds."
2. "Recommend a course for beginners about compound interest."
3. "Don't let me lose my 14-day streak!"
4. "How much tax will I pay on $10k capital gains?"
5. "Why should I diversify my investments?"

**Evaluation Criteria:**
- ✅ Factually correct (verified against financial docs)
- ✅ Cites sources (RAG grounding)
- ✅ Localized (correct language)
- ✅ Actionable (includes Action Cards when appropriate)

---

## 📈 PHASE 6: TRACK PLANNING (Beads Tasks + Timeline)

### Sprint 6.1: Core Orchestrator (Week 1)
```bash
# Epic 1: AI Orchestrator Engine (3 days)
beads.exe create "Epic 1: AI Orchestrator Engine" --type epic --priority 1

# Tasks (created above):
# - Task 1.1: Intent Classifier (6h)
# - Task 1.2: Agent Router (8h)
# - Task 1.3: Context Manager (10h)

# Epic 2: RAG Enhancement (2 days)
beads.exe create "Epic 2: RAG Enhancement" --type epic --priority 1 --deps "ved-xxx (Epic 1)"

# - Task 2.1: Connect RAG to AI Mentor (4h)
# - Task 2.2: Seed Knowledge Base (6h)
```

### Sprint 6.2: Specialized Agents (Week 2)
```bash
# Epic 3: Specialized Agents (3 days)
beads.exe create "Epic 3: Specialized Agents" --type epic --priority 1 --deps "ved-xxx (Epic 2)"

# - Task 3.1: Financial Advisor Agent (8h)
# - Task 3.2: Behavioral Nudge Agent (6h)
# - Task 3.3: Learning Tutor Agent (6h) [NEW]
```

### Sprint 6.3: Observability + Testing (Week 2)
```bash
# Epic 4: Observability Layer (1 day)
beads.exe create "Epic 4: Observability Layer" --type epic --priority 2 --deps "ved-xxx (Epic 3)"

# - Task 4.1: OpenTelemetry Tracing (4h)
# - Task 4.2: Prometheus Metrics + Grafana Dashboard (4h)

# Epic 5: Testing + Validation (2 days)
beads.exe create "Epic 5: Testing + Validation" --type epic --priority 1 --deps "ved-xxx (Epic 4)"

# - Task 5.1: Unit Tests (60% coverage) (8h)
# - Task 5.2: Integration Tests (E2E) (6h)
# - Task 5.3: Manual Evaluation (10 test queries) (2h)
```

---

## 🎯 Success Criteria (Definition of Done)

### Phase 1 (Week 1):
- ✅ Intent classifier achieves >90% accuracy (manual eval on 50 queries)
- ✅ Agent router handles 3+ parallel agents
- ✅ Context manager compresses threads >10k tokens by 50%
- ✅ RAG retrieves relevant docs in <100ms

### Phase 2 (Week 2):
- ✅ Financial Advisor Agent answers 10/10 test queries correctly
- ✅ Behavioral Nudge Agent generates 5 unique nudge types
- ✅ OpenTelemetry traces visible in Jaeger UI
- ✅ Grafana dashboard shows real-time AI metrics

### Phase 3 (Week 3):
- ✅ 60% unit test coverage (Jest)
- ✅ E2E tests pass (5+ scenarios)
- ✅ A/B test shows +20% user satisfaction vs control

---

## 📊 Risk Management

### High-Risk Items:
1. **Gemini API quotas** (50k tokens/month limit)
   - Mitigation: Implement aggressive caching, monitor token usage daily
2. **RAG hallucinations** (AI inventing facts)
   - Mitigation: Require citations, manual evaluation weekly
3. **Context manager edge cases** (thread summarization errors)
   - Mitigation: Unit test on 20+ edge cases (empty threads, single message, etc.)

### Fallback Plan:
- If multi-agent orchestrator fails → Revert to single-agent system
- If RAG retrieval slow → Use in-memory FAQ cache only
- If Gemini API down → Return cached responses (stale but functional)

---

## 🎓 Learning References

### 6-Step Planning Pipeline (Applied):
1. ✅ **Discovery** - Analyzed existing AI infrastructure (AiMentor, RAG, Analytics)
2. ✅ **Synthesis** - Designed Trinity AI System (Orchestrator + Multi-Agent + RAG)
3. ✅ **Verification** - Defined KPIs (latency, token efficiency, accuracy)
4. ✅ **Decomposition** - Broke down into 5 epics, 12+ tasks
5. ✅ **Validation** - Specified unit/integration/manual tests
6. ✅ **Track Planning** - Created Beads roadmap with dependencies

### Behavioral AI Principles:
- **Nudge Theory (Thaler):** Behavioral Nudge Agent generates loss aversion alerts
- **Hooked Loop (Eyal):** AI initiates conversations (trigger) + provides rewards (variable)
- **Social Proof:** AI cites stats ("85% of users like you chose this")

---

## 🚀 Next Steps

1. **Review this plan** with team (15 min standup)
2. **Create Beads tasks** (run bash commands above)
3. **Kickoff Sprint 6.1** (start with Task 1.1: Intent Classifier)
4. **Daily sync** - Check Beads progress (`beads.exe ready`)
5. **Week 1 demo** - Show intent classification + agent routing

---

**End of Master Plan** 🎯
