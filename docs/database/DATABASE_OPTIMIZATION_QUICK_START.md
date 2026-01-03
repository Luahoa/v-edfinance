# ⚡ Quick Start: Database Optimization Thread

> **1-page guide for starting database optimization work**

---

## 📖 READ FIRST (5 minutes)

**Essential Doc:** [PRISMA_DRIZZLE_HYBRID_STRATEGY.md](docs/PRISMA_DRIZZLE_HYBRID_STRATEGY.md)

**TL;DR:**
- Prisma = migrations ONLY
- Drizzle = fast CRUD (65% faster)
- Kysely = analytics

---

## 🚀 Start Commands (Copy-Paste)

```bash
# 1. Read handoff
cat THREAD_HANDOFF_DATABASE_OPTIMIZATION_PHASE2.md

# 2. Create all 12 tasks
.\beads.exe create "Install Drizzle + AI Dependencies" --type task --priority 0
.\beads.exe create "Enable Pgvector extension" --type task --priority 0
.\beads.exe create "Create OptimizationLog Prisma table" --type task --priority 0
.\beads.exe create "Create Drizzle schema" --type task --priority 0
.\beads.exe create "DatabaseService hybrid" --type task --priority 1
.\beads.exe create "VannaService NL→SQL" --type task --priority 1
.\beads.exe create "PgvectorService embeddings" --type task --priority 1
.\beads.exe create "DatabaseArchitectAgent" --type task --priority 1
.\beads.exe create "Optimization Controller" --type task --priority 2
.\beads.exe create "Deploy to VPS" --type task --priority 0
.\beads.exe create "Enable pg_stat_statements" --type task --priority 0
.\beads.exe create "Run first audit" --type task --priority 1
.\beads.exe create "Grafana dashboard" --type task --priority 2

# 3. Start Task 1
.\beads.exe ready
cd apps/api
pnpm add drizzle-orm drizzle-zod @vanna.ai/vanna-node pgvector @xenova/transformers
```

---

## 🎯 Success Criteria

**Week 1:** Drizzle installed + schema mirrored  
**Week 2:** BehaviorLog 50%+ faster  
**Week 3:** AI Agent runs weekly audit  
**Week 4:** <50ms p95 latency (Grafana)

---

## 📚 Docs Tree

```
THREAD_HANDOFF_DATABASE_OPTIMIZATION_PHASE2.md  ← YOU ARE HERE
  ├── PRISMA_DRIZZLE_HYBRID_STRATEGY.md         ← Read this!
  ├── AI_DB_ARCHITECT_TASKS.md                  ← 12 task details
  └── DATABASE_TOOLS_INTEGRATION_SUMMARY.md     ← Summary
```

---

## ⚠️ Critical Rules

1. **NEVER** run Drizzle migrations (Prisma owns schema)
2. **ALWAYS** benchmark before claiming "faster"
3. **SYNC** Drizzle schema after Prisma migration

---

**Go!** → [Full Handoff Doc](THREAD_HANDOFF_DATABASE_OPTIMIZATION_PHASE2.md)
