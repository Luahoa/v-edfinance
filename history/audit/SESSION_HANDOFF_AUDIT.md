# Session Handoff: VPS Deployment → Project Audit

**Date:** 2026-01-05  
**From Thread:** T-019b89c8-7f2e-748e-940e-6cf525ceafcd  
**Context:** VPS Deployment Track 4 paused for technical debt cleanup

---

## 🎯 Current Status

### Completed Work
✅ **Track 2 (ved-y1u):** PostgreSQL pg_stat_statements enabled  
✅ **Track 3 (ved-drx):** Monitoring stack verified (5/6 tools)  
✅ **Track 5 (ved-8yqm):** R2 backup configured  
✅ **Track 4 (ved-4r86):** Prisma migrations deployed (after fixing 3 blockers)

### Paused Work
⏸️ **Track 4 Deployment:** VED-43OQ (API), VED-949O (Web), VED-T298 (Smoke Tests)

---

## 🚨 Why We Paused

**Incident:** VED-4R86 (Prisma Migration) encountered 3 critical blockers:
1. Missing pgvector PostgreSQL extension
2. Schema drift: Migration files referenced non-existent tables (SocialPost)
3. PostgreSQL constraint: NOW() function not immutable in index predicates

**Root Cause:** Accumulated technical debt from rapid development without systematic validation.

**Decision:** Pause deployment to conduct comprehensive project audit.

---

## 📋 Audit Epic Created

**Epic:** [VED-3GAT - Project Audit & Technical Debt Cleanup](file:///c:/Users/luaho/Demo%20project/v-edfinance/.beads/ved-3gat.md)

**Priority:** P0  
**Estimated Time:** 8-11 hours (1.5 days)

### Audit Scope
1. **Schema & Database Integrity** - Verify schema.prisma vs migrations
2. **Dependency & Environment Drift** - Audit packages, Docker, .env files
3. **Code Quality & Type Safety** - TypeScript errors, dead code, type suppressions
4. **Build & Test Infrastructure** - Verify builds, tests, CI/CD
5. **Documentation Debt** - Update AGENTS.md, runbooks, architecture docs
6. **File System Cleanup** - Remove temp files, archive spikes

---

## 📊 Key Artifacts

| Document | Purpose |
|----------|---------|
| [PROJECT_AUDIT_TASK.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/history/audit/PROJECT_AUDIT_TASK.md) | Full audit task definition |
| [MIGRATION_FIX_PLAN.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/history/vps-deployment/MIGRATION_FIX_PLAN.md) | Lessons from migration issues |
| [ved-4r86-complete.json](file:///c:/Users/luaho/Demo%20project/v-edfinance/.beads/agent-mail/ved-4r86-complete.json) | Migration deployment summary |
| [track-4-paused-audit-required.json](file:///c:/Users/luaho/Demo%20project/v-edfinance/.beads/agent-mail/track-4-paused-audit-required.json) | Pause notification |

---

## 🎯 Next Agent Instructions

### Step 1: Load Planning Skill
```bash
Read .agents/skills/planning.md
```

### Step 2: Execute Discovery Phase
Use parallel agents to gather audit data:
- **Agent A:** Schema audit (compare schema.prisma vs migrations vs VPS database)
- **Agent B:** Dependency audit (package.json, Docker images, .env files)
- **Agent C:** TypeScript audit (run typecheck, find `any` types)
- **Agent D:** File system audit (find temp files, orphaned code)

### Step 3: Synthesize with Oracle
```javascript
oracle({
  task: "Analyze audit findings and create cleanup plan",
  context: "Discovery reports from 4 parallel agents attached",
  files: ["history/audit/discovery-*.md"]
})
```

### Step 4: Create Audit Beads
Use file-beads skill to decompose into executable tasks:
- Group by risk level (HIGH → MEDIUM → LOW)
- Assign to tracks based on file scope
- Embed learnings from discovery phase

### Step 5: Execute with Orchestrator
Spawn parallel cleanup workers:
- Track 1: Schema & Database fixes
- Track 2: Dependency & Environment fixes
- Track 3: Code Quality fixes
- Track 4: Documentation & Cleanup

### Step 6: Resume Deployment
After audit complete:
1. Close ved-3gat epic
2. Update agent-mail: Track 4 unblocked
3. Resume ved-43oq (API Deployment)

---

## 🛠️ Critical Context for Next Agent

### VPS Connection
- Host: 103.54.153.248
- User: root
- Key: C:\Users\luaho\.ssh\vps_new_key
- Script: scripts/vps-toolkit/vps-connection.js

### Database
- Connection: postgresql://postgres:Halinh!@34@172.17.0.1:5432/vedfinance
- Current tables: User, BehaviorLog, Course, Lesson, InvestmentProfile, UserProgress, OptimizationLog, SystemSettings
- Missing tables: SocialPost, BuddyGroup (intentional - VPS subset)

### Beads Trinity Protocol
- Always use `--no-daemon` flag with beads commands
- Sync after major changes: `beads sync --no-daemon -m "message"`
- Update agent-mail for cross-agent coordination

### Anti-Hallucination Protocol
- Always Read file before editing
- Check prisma/schema.prisma before assuming DB fields
- Verify service signatures before calling methods
- Run `pnpm --filter api build` before finishing tasks

---

## 📌 Blocking Tasks

| Task | Title | Blocked Until |
|------|-------|---------------|
| ved-43oq | Deploy API Docker Image | ved-3gat complete |
| ved-949o | Deploy Web Docker Image | ved-3gat complete |
| ved-t298 | Run Staging Smoke Tests | ved-3gat complete |

---

## 🎓 Lessons Learned (Add to AGENTS.md)

1. **Schema Validation:** Always verify migration files against target database schema before deploy
2. **Docker Dependencies:** Pre-install OpenSSL + pgvector in migration containers
3. **PostgreSQL Constraints:** NOW() function cannot be used in index predicates (use fixed timestamp)
4. **Schema Subsets:** VPS production can be subset of full schema - document this decision
5. **Migration Process:** Create validation script to check migrations before deployment

---

**Handoff Status:** READY  
**Priority:** P0  
**Next Action:** Load Planning Skill and start Discovery Phase  
**Estimated Completion:** 2026-01-06 (1.5 days from now)
