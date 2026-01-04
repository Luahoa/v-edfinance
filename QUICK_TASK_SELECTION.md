# 🎯 Quick Task Selection Guide

**Last Updated:** 2026-01-05  
**Context:** Payment tasks complete (code only), need Stripe setup for testing

---

## ⚡ TOP 3 RECOMMENDED (No Stripe Needed)

### 1. ved-3tl1: Archive Old Files Cleanup
**Time:** 60 min | **Priority:** P0 | **Difficulty:** Easy  
**Why:** Quick win, clean codebase, no dependencies

```bash
beads.exe update ved-3tl1 --status in_progress
```

**Tasks:**
- Move old files to `history/`
- Clean up root directory
- Update .gitignore
- Remove duplicates

---

### 2. ved-s2zu: Progress API
**Time:** 300 min | **Priority:** P0 | **Difficulty:** Medium  
**Why:** Core feature, independent of payment

```bash
beads.exe update ved-s2zu --status in_progress
```

**Tasks:**
- GET /progress/summary endpoint
- Aggregate completion stats
- Calculate time spent
- Return progress percentage

---

### 3. ved-08wy: Increase Connection Pool
**Time:** 30 min | **Priority:** P0 | **Difficulty:** Easy  
**Why:** Performance improvement, quick win

```bash
beads.exe update ved-08wy --status in_progress
```

**Tasks:**
- Update DATABASE_URL with connection_limit=20
- Test connection stability
- Monitor performance

---

## 📊 All Available Tasks

| Task ID | Title | Time | Priority | Ready? |
|---------|-------|------|----------|--------|
| ved-3tl1 | Archive Cleanup | 60 min | P0 | ✅ |
| ved-08wy | Connection Pool | 30 min | P0 | ✅ |
| ved-ll5l | BehaviorLog Indexes | 90 min | P0 | ✅ |
| ved-1y3c | Remove Unused Deps | 120 min | P0 | ✅ |
| ved-s2zu | Progress API | 300 min | P0 | ✅ |
| ved-y1u | pg_stat_statements | 60 min | P0 | ✅ |
| ved-drx | Deploy AI Agent | 240 min | P0 | ⚠️ VPS |
| ved-ecux | Enrollment Schema | 180 min | P0 | ✅ |

---

## 🔴 Blocked by Stripe Setup

| Task ID | Title | Status |
|---------|-------|--------|
| ved-pqpv | Payment Schema | ✅ CODE DONE |
| ved-do76 | Webhook Handler | ✅ CODE DONE |
| ved-6s0z | Payment UI | ⏳ Need Stripe keys |
| ved-cl04 | Webhook Security | ⏳ Need webhook secret |

---

## 🎯 Recommended Execution Order

### Quick Wins First (150 min)
```
1. ved-08wy (30 min) - Connection pool
2. ved-3tl1 (60 min) - Archive cleanup
3. ved-y1u (60 min) - pg_stat_statements
```

### Core Feature (300 min)
```
4. ved-s2zu (300 min) - Progress API
```

### Performance (210 min)
```
5. ved-ll5l (90 min) - Indexes
6. ved-1y3c (120 min) - Remove deps
```

**Total:** 660 minutes (11 hours)

---

## 🚀 Start Now

**Pick one:**

```bash
# Option A: Quick & Easy (30 min)
beads.exe update ved-08wy --status in_progress

# Option B: Medium Impact (60 min)
beads.exe update ved-3tl1 --status in_progress

# Option C: Core Feature (300 min)
beads.exe update ved-s2zu --status in_progress
```

---

## 📋 Task Status Check

```bash
# View all P0 tasks
beads.exe list --status open --priority P0

# View ready tasks
beads.exe ready

# View task details
beads.exe show ved-3tl1
```

---

**What would you like to work on?**
