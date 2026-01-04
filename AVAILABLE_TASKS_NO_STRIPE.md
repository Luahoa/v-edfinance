# 🎯 Tasks Khả Dụng (Không Cần Stripe Setup)

**Cập nhật:** 2026-01-05  
**Trạng thái:** Ready to execute  
**Ưu tiên:** Các task P0 có thể làm ngay

---

## 🔴 PRIORITY 1: PHASE-0 Tasks (Debt Paydown)

Theo [STRATEGIC_DEBT_PAYDOWN_PLAN.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/STRATEGIC_DEBT_PAYDOWN_PLAN.md), cần xử lý các Phase-0 tasks trước:

### ved-3tl1: Archive Old Files Cleanup ⭐ RECOMMENDED
**Estimate:** 60 min  
**Priority:** P0  
**Status:** Ready  
**Impact:** Giảm clutter, tăng performance

**Scope:**
- Di chuyển old files sang `history/`
- Xóa duplicates
- Cập nhật .gitignore
- Clean up root directory

**Why now:** Không phụ thuộc vào Stripe, cải thiện project structure

---

### ved-08wy: Increase Connection Pool to 20
**Estimate:** 30 min  
**Priority:** P0  
**Status:** Ready  
**Impact:** Database performance

**Scope:**
- Update Prisma connection pool config
- Test connection stability
- Monitor metrics

**Why now:** Quick win, improves performance immediately

---

### ved-ll5l: Add BehaviorLog Performance Indexes
**Estimate:** 90 min  
**Priority:** P0  
**Status:** Ready  
**Impact:** Query performance (AI agent scans)

**Scope:**
- Add indexes for userId, timestamp, eventType
- Add composite indexes for analytics queries
- Migration script
- Performance verification

**Why now:** Unlocks AI agent optimization tasks

---

### ved-1y3c: Remove Unused Dependencies
**Estimate:** 120 min  
**Priority:** P0  
**Status:** Ready  
**Impact:** Bundle size, build time

**Scope:**
- Audit package.json
- Remove unused deps
- Update imports
- Verify builds

**Why now:** Reduces technical debt, faster builds

---

## 🟢 PRIORITY 2: Non-Payment P0 Tasks

### ved-s2zu: Progress API - Student Progress Summary ⭐ RECOMMENDED
**Estimate:** 300 min  
**Priority:** P0  
**Status:** Ready  
**Impact:** Core feature completion

**Scope:**
- GET /progress/summary endpoint
- Aggregate course completion stats
- Calculate time spent
- Return progress percentage

**Why now:** 
- Không phụ thuộc payment
- Hoàn thiện progress tracking system
- Can use existing UserProgress model

**Dependencies:**
- ✅ UserProgress model (already exists)
- ✅ Course/Lesson models (complete)

---

### ved-ecux: Enrollment Schema - Add Enrollment Model
**Estimate:** 180 min  
**Priority:** P0  
**Status:** Ready (if skip payment integration)

**Scope:**
- Create Enrollment model in Prisma
- Add enrolledAt, expiresAt fields
- Add status enum (ACTIVE, EXPIRED, REVOKED)
- Migration script

**Note:** Can implement schema now, integrate with payment later

---

## 🟡 PRIORITY 3: Infrastructure & Deployment

### ved-y1u: Enable pg_stat_statements on VPS
**Estimate:** 60 min  
**Priority:** P0  
**Status:** Ready  
**Impact:** Database monitoring

**Scope:**
- SSH to VPS
- Enable pg_stat_statements extension
- Configure retention
- Verify metrics collection

**Why now:** Enables database optimization tasks

---

### ved-drx: Deploy AI Agent to VPS Staging
**Estimate:** 240 min  
**Priority:** P0  
**Status:** Ready (if VPS accessible)

**Scope:**
- Deploy DB Architect agent to VPS
- Configure cron for weekly scans
- Test optimization PR generation
- Verify metrics collection

**Why now:** Automation for database optimization

---

## 📊 Recommended Execution Order

### Session 1 (2-3 hours): Quick Wins
```
1. ved-08wy: Connection Pool (30 min)
2. ved-3tl1: Archive Cleanup (60 min)
3. ved-y1u: pg_stat_statements (60 min)
```
**Impact:** Infrastructure improvements, clean codebase

---

### Session 2 (5 hours): Core Feature
```
1. ved-s2zu: Progress API (300 min)
```
**Impact:** Complete progress tracking system

---

### Session 3 (2-3 hours): Performance
```
1. ved-ll5l: BehaviorLog Indexes (90 min)
2. ved-1y3c: Remove Unused Deps (120 min)
```
**Impact:** Faster queries, smaller bundles

---

### Session 4 (4 hours): Deployment
```
1. ved-drx: Deploy AI Agent (240 min)
```
**Impact:** Automated database optimization

---

## ❌ Tasks Cần Stripe (Bỏ Qua Tạm Thời)

- ❌ ved-pqpv: Payment Schema (DONE - cần test)
- ❌ ved-do76: Webhook Handler (DONE - cần test)
- ❌ ved-6s0z: Payment UI (cần Stripe keys)
- ❌ ved-cl04: Webhook Security (cần Stripe webhook secret)
- ❌ ved-0jl6: Enrollment Logic (tích hợp với webhook)

**Note:** Các tasks này đã code xong, chỉ cần Stripe setup để test

---

## 🎯 Đề Xuất: Bắt Đầu Với Quick Wins

### Option 1: Infrastructure First (RECOMMENDED)
**Time:** 2-3 hours  
**Tasks:** ved-08wy + ved-3tl1 + ved-y1u  
**Impact:** Clean codebase, better performance, monitoring enabled

**Execute:**
```bash
# 1. Connection Pool
beads.exe update ved-08wy --status in_progress
# Update apps/api/.env: DATABASE_URL connection_limit=20
# Test connections

# 2. Archive Cleanup
beads.exe update ved-3tl1 --status in_progress
# Move old files to history/
# Clean up root

# 3. pg_stat_statements
beads.exe update ved-y1u --status in_progress
# SSH to VPS and enable extension
```

---

### Option 2: Feature First
**Time:** 5 hours  
**Task:** ved-s2zu (Progress API)  
**Impact:** Complete core feature

**Execute:**
```bash
beads.exe update ved-s2zu --status in_progress
# Implement GET /progress/summary
# Write tests
# Document API
```

---

## 🔍 Task Details Query

Để xem chi tiết task:
```bash
beads.exe show ved-XXXX
```

Để xem dependencies:
```bash
beads.exe list --title-contains "Progress"
beads.exe list --title-contains "PHASE-0"
```

---

## 📋 Summary

**Ready to Start (Không cần Stripe):**
- ✅ ved-3tl1: Archive Cleanup (60 min) ⭐
- ✅ ved-08wy: Connection Pool (30 min) ⭐
- ✅ ved-ll5l: BehaviorLog Indexes (90 min)
- ✅ ved-1y3c: Remove Deps (120 min)
- ✅ ved-s2zu: Progress API (300 min) ⭐
- ✅ ved-y1u: pg_stat_statements (60 min)
- ✅ ved-drx: Deploy AI Agent (240 min)
- ✅ ved-ecux: Enrollment Schema (180 min)

**Waiting for Stripe:**
- ⏳ ved-pqpv, ved-do76, ved-6s0z, ved-cl04, ved-0jl6

**Total Available Work:** ~900 minutes (15 hours)

---

## 🚀 Next Action

**Recommended:** Start with ved-3tl1 (Archive Cleanup)

```bash
beads.exe update ved-3tl1 --status in_progress
```

**Why:**
- Quickest (60 min)
- No dependencies
- Improves project structure
- Good warm-up task

---

**Bạn muốn bắt đầu task nào?**
