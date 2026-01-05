# 🚀 AI Orchestration Quick Start Guide

**For:** Developers starting Sprint 6 (AI System Optimization)  
**Read Time:** 5 minutes  
**Prerequisites:** Read [AI_SYSTEM_OPTIMIZATION_MASTERPLAN.md](../AI_SYSTEM_OPTIMIZATION_MASTERPLAN.md)

---

## 📋 Day 1 Checklist (Setup)

### 1. Install Dependencies
```bash
cd apps/api
pnpm add @opentelemetry/api @opentelemetry/sdk-node prom-client
pnpm add -D @types/prom-client
```

### 2. Create Folder Structure
```bash
mkdir -p apps/api/src/ai/orchestrator
mkdir -p apps/api/src/ai/agents
mkdir -p apps/api/src/ai/tracing
```

### 3. Create Beads Tasks
```bash
# Epic 1: AI Orchestrator Engine
beads.exe create "Epic 1: AI Orchestrator Engine" --type epic --priority 1 --estimate "3d"

# Task 1.1: Intent Classifier
beads.exe create "Task 1.1: Intent Classifier Service" \
  --type task \
  --priority 1 \
  --deps "Epic 1: AI Orchestrator Engine" \
  --estimate "6h"

# Task 1.2: Agent Router
beads.exe create "Task 1.2: Agent Router with Parallel Execution" \
  --type task \
  --priority 1 \
  --deps "ved-xxx (Task 1.1)" \
  --estimate "8h"
```

*(Replace `ved-xxx` with actual task IDs from `beads.exe list`)*

---

## 🎯 Week 1 Goals

| Day | Goal | Deliverable |
|-----|------|-------------|
| **Mon** | Setup + Intent Classifier | Intent classifier (90% accuracy) |
| **Tue** | Agent Router | Parallel agent execution |
| **Wed** | Context Manager | Thread summarization (50% compression) |
| **Thu** | RAG Integration | AI Mentor uses RAG for responses |
| **Fri** | Testing + Demo | Unit tests (60% coverage) + demo |

---

## 🔨 Implementation Priorities

### P0 (Critical Path):
1. Intent Classifier → Agent Router → Context Manager
2. RAG connection to AI Mentor
3. Unit tests (60% coverage)

### P1 (Nice to Have):
1. Specialized agents (Financial, Behavioral)
2. OpenTelemetry tracing
3. Prometheus metrics

### P2 (Future):
1. Grafana dashboards
2. A/B testing framework

---

## 🧪 Testing Commands

```bash
# Unit tests
pnpm --filter api test apps/api/src/ai/orchestrator

# Integration tests
pnpm --filter api test:e2e

# Manual testing (use Postman/cURL)
curl -X POST http://localhost:3001/ai/threads/THREAD_ID/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What is my portfolio risk?"}'
```

---

## 📊 Success Metrics (Daily Check)

Run this query daily:

```bash
# Check intent classification accuracy
beads.exe list --title-contains "Intent" --status in_progress

# View AI metrics (after Prometheus setup)
curl http://localhost:3001/metrics | grep ai_
```

---

## 🆘 Troubleshooting

### Issue: Beads CLI not working (ENOENT)
**Solution:** Use PowerShell instead of CMD, or manually create tasks in `.beads/issues.jsonl`

### Issue: Gemini API quota exceeded
**Solution:** Implement caching first (Task 1.3: Context Manager)

### Issue: RAG retrieval slow (>500ms)
**Solution:** Check pgvector index: `SELECT * FROM pg_indexes WHERE tablename = 'optimization_logs'`

---

## 📚 Key Files to Reference

| File | Purpose |
|------|---------|
| [apps/api/src/ai/ai.service.ts](../apps/api/src/ai/ai.service.ts) | Existing AI Mentor (enhance this) |
| [apps/api/src/database/pgvector.service.ts](../apps/api/src/database/pgvector.service.ts) | RAG embeddings |
| [apps/api/src/config/gemini.service.ts](../apps/api/src/config/gemini.service.ts) | Gemini API wrapper |
| [apps/web/src/components/AiMentor.tsx](../apps/web/src/components/AiMentor.tsx) | Frontend chat UI |

---

## 🎓 Learning Resources

- **OpenTelemetry Tracing:** https://opentelemetry.io/docs/languages/js/instrumentation/
- **Prometheus Metrics:** https://github.com/siimon/prom-client
- **Gemini API Docs:** https://ai.google.dev/gemini-api/docs
- **pgvector:** https://github.com/pgvector/pgvector

---

**Ready to start?** Begin with Task 1.1 (Intent Classifier). Good luck! 🚀
