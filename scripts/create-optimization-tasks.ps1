# Create All Optimization Tasks for Beads
# Usage: .\scripts\create-optimization-tasks.ps1

Write-Host "Creating optimization roadmap tasks in beads..." -ForegroundColor Cyan

# Path to & `$beads
$beads = ".\& `$beads"

# PHASE-0: Emergency Fixes (P0 - Critical)
Write-Host "`n=== PHASE-0: Emergency Fixes (7 tasks) ===" -ForegroundColor Yellow

& $beads create "PHASE-0: Fix Web Build - Add lucide-react dependency" `
  --type task `
  --priority 0 `
  --estimate "5m" `
  --tags "optimization,build,p0,phase-0"

& `$beads create "PHASE-0: Fix Schema Drift - Update Drizzle passwordHash field" `
  --type task `
  --priority 0 `
  --estimate "30m" `
  --tags "optimization,database,p0,phase-0"

& `$beads create "PHASE-0: Remove Unused Dependencies (next/react from API)" `
  --type task `
  --priority 0 `
  --estimate "10m" `
  --tags "optimization,cleanup,p0,phase-0"

& `$beads create "PHASE-0: Add Performance Indexes to BehaviorLog" `
  --type task `
  --priority 0 `
  --estimate "1h" `
  --tags "optimization,database,performance,p0,phase-0"

& `$beads create "PHASE-0: Increase DB Connection Pool to 20" `
  --type task `
  --priority 0 `
  --estimate "5m" `
  --tags "optimization,database,p0,phase-0"

& `$beads create "PHASE-0: Archive Old Files - Cleanup Root Directory" `
  --type task `
  --priority 0 `
  --estimate "30m" `
  --tags "optimization,cleanup,p0,phase-0"

& `$beads create "PHASE-0: Verify All Builds - API + Web Quality Gate" `
  --type task `
  --priority 0 `
  --estimate "45m" `
  --tags "optimization,testing,p0,phase-0"

# PHASE-1: Database Optimization (P1 - High)
Write-Host "`n=== PHASE-1: Database Optimization (5 tasks) ===" -ForegroundColor Yellow

& `$beads create "PHASE-1: Fix N+1 Query Pattern in MetricsService" `
  --type task `
  --priority 1 `
  --estimate "4h" `
  --tags "optimization,database,performance,p1,phase-1"

& `$beads create "PHASE-1: Parallelize NudgeScheduler Processing" `
  --type task `
  --priority 1 `
  --estimate "2h" `
  --tags "optimization,performance,p1,phase-1"

& `$beads create "PHASE-1: Enable pg_stat_statements on VPS" `
  --type task `
  --priority 1 `
  --estimate "30m" `
  --tags "optimization,database,vps,p1,phase-1"

& `$beads create "PHASE-1: Complete Drizzle Schema Sync (1:1 with Prisma)" `
  --type task `
  --priority 1 `
  --estimate "3h" `
  --tags "optimization,database,drizzle,p1,phase-1"

& `$beads create "PHASE-1: Migrate BehaviorLog to Drizzle for 65% speedup" `
  --type task `
  --priority 1 `
  --estimate "5h" `
  --tags "optimization,database,drizzle,p1,phase-1"

# PHASE-2: Test Coverage Expansion (P1/P2)
Write-Host "`n=== PHASE-2: Test Coverage (7 tasks) ===" -ForegroundColor Yellow

& `$beads create "PHASE-2: Fix E2E Test Database Seeds" `
  --type task `
  --priority 1 `
  --estimate "4h" `
  --tags "optimization,testing,e2e,p1,phase-2"

& `$beads create "PHASE-2: Re-enable 15 Skipped E2E Tests" `
  --type task `
  --priority 1 `
  --estimate "4h" `
  --tags "optimization,testing,e2e,p1,phase-2"

& `$beads create "PHASE-2: Add Health Module Tests (0% to 80%)" `
  --type task `
  --priority 1 `
  --estimate "1h" `
  --tags "optimization,testing,coverage,p1,phase-2"

& `$beads create "PHASE-2: Add Audit Module Tests (0% to 70%)" `
  --type task `
  --priority 1 `
  --estimate "3h" `
  --tags "optimization,testing,coverage,p1,phase-2"

& `$beads create "PHASE-2: Add WebSocket Module Tests (0% to 70%)" `
  --type task `
  --priority 1 `
  --estimate "2h" `
  --tags "optimization,testing,coverage,p1,phase-2"

& `$beads create "PHASE-2: Add Integration Tests - Database/Storage" `
  --type task `
  --priority 2 `
  --estimate "4h" `
  --tags "optimization,testing,integration,p2,phase-2"

& `$beads create "PHASE-2: Add DTO Validation Tests (Courses)" `
  --type task `
  --priority 2 `
  --estimate "2h" `
  --tags "optimization,testing,validation,p2,phase-2"

# PHASE-3: Performance Tuning (P2)
Write-Host "`n=== PHASE-3: Performance Tuning (3 tasks) ===" -ForegroundColor Yellow

& `$beads create "PHASE-3: Implement Redis Caching Layer" `
  --type task `
  --priority 2 `
  --estimate "4h" `
  --tags "optimization,performance,caching,p2,phase-3"

& `$beads create "PHASE-3: Partition BehaviorLog Table by Month" `
  --type task `
  --priority 2 `
  --estimate "4h" `
  --tags "optimization,database,performance,p2,phase-3"

& `$beads create "PHASE-3: Run Vegeta Load Testing (1000 users)" `
  --type task `
  --priority 2 `
  --estimate "4h" `
  --tags "optimization,testing,performance,p2,phase-3"

# PHASE-4: Production Deployment (P0 - Final)
Write-Host "`n=== PHASE-4: Production Deployment (4 tasks) ===" -ForegroundColor Yellow

& `$beads create "PHASE-4: VPS Database Extensions Setup (vector + pg_stat)" `
  --type task `
  --priority 0 `
  --estimate "2h" `
  --tags "optimization,deployment,vps,p0,phase-4"

& `$beads create "PHASE-4: Deploy API to Staging Environment (Dokploy)" `
  --type task `
  --priority 0 `
  --estimate "2h" `
  --tags "optimization,deployment,staging,p0,phase-4"

& `$beads create "PHASE-4: Deploy Web to Production (Cloudflare Pages)" `
  --type task `
  --priority 0 `
  --estimate "2h" `
  --tags "optimization,deployment,production,p0,phase-4"

& `$beads create "PHASE-4: Post-Deployment Monitoring & Verification (24h)" `
  --type task `
  --priority 0 `
  --estimate "2h" `
  --tags "optimization,deployment,monitoring,p0,phase-4"

Write-Host "`n✅ All 26 optimization tasks created!" -ForegroundColor Green
Write-Host "Run: & `$beads list --tags optimization" -ForegroundColor Cyan
